import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import Order from "../../../db/models/order.model";
import Product from "../../../db/models/product.model";
import StripeService from "../../../services/stripe.service";

import {
  BadRequest,
  ResourceNotFound,
  ServerError,
} from "../../../errors/httpErrors";
import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
type QueryParams = {
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
};

import * as validators from "../validators/order.validator";
class OrderController {
  async createOrderStripe(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;
    const { error, data } = validators.createOrderValidator(req.body);

    if (error) throw new BadRequest(error.message, error.code);
    const { products, paymentDetails, deliveryDetails } = data;

    if (!products || products.length < 1) {
      throw new BadRequest(
        "No product in the cart items provided",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    const productArray = [];
    let subtotal = 0;
    const uuid = uuidv4();
    const orderRef = uuid.replace(/-/g, "").substring(0, 10);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const dbProduct = await Product.findOne({ _id: product.productId });
      if (!dbProduct) {
        throw new ResourceNotFound(
          `No product with id : ${product.productId}`,
          "RESOURCE_NOT_FOUND"
        );
      }
      const { productPrice, _id } = dbProduct;
      const orderSubRef = `${orderRef}-${i + 1000}`; // Calculate orderSubRef dynamically
      const singleProductItem = {
        orderSubRef,
        productId: _id,
        quantity: product.quantity,
        color: product.color,
        size: product.size,
        price: productPrice,
        subtotal: product.quantity * productPrice,
      };
      subtotal += singleProductItem.subtotal;
      productArray.push(singleProductItem);
    }

    const shippingFee = paymentDetails.shippingFee || 0;
    const tax = paymentDetails.tax || 0;
    const totalAmount = subtotal + shippingFee + tax;
    const totalSubAmount = subtotal;

    // Calculate expectedDeliveryStart
    const expectedDeliveryStart = new Date();
    expectedDeliveryStart.setDate(expectedDeliveryStart.getDate() + 5);

    // Calculate expectedDeliveryEnd
    const expectedDeliveryEnd = new Date(expectedDeliveryStart);
    expectedDeliveryEnd.setDate(expectedDeliveryEnd.getDate() + 3);

    const orderPayload = {
      orderRef,
      buyerId,
      products: productArray,
      orderDetails: {
        noOfItems: products.length,
        orderStatus: "Pending Payment",
      },
      paymentDetails: {
        // paymentRef,
        paymentStatus: "Pending",
        paymentMethod: paymentDetails.paymentMethod,
        totalAmount,
        totalSubAmount,
        shippingFee,
        tax,
      },
      deliveryDetails: {
        ...deliveryDetails,
        expectedDeliveryStart,
        expectedDeliveryEnd,
      },
    };

    // Create airtime document
    const order = await Order.create(orderPayload);
    const stripeTotalAmount = Math.round(
      Number(order.paymentDetails.totalAmount) * 100
    ); // Round to nearest integer

    // create the payment link
    const response = await StripeService.createCheckoutSession(
      stripeTotalAmount,
      order.id
    );
    if (!response) {
      throw new ServerError(
        "Initiate payment failed",
        "THIRD_PARTY_API_FAILURE"
      );
    }

    //in the webhook
    //perform business wallet logic
    //create transaction
    //update order
    return res.ok({
      redirectUrl: response.url,
      order,
      messageOrder:
        "Order request created successfully, pay within next 30 minutes to avoid order being cancelled.",
    });
  }

  // Get all orders by admin
  async getOrdersByAdmin(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1))
      .populate("products.productId");

    const totalOrders = await Order.countDocuments(orders);

    res.ok({ orders, totalOrders }, { page, limit, startDate, endDate });
  }

  // Get all orders by buyer
  async getOrdersByBuyer(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const orders = await Order.find({
      buyerId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1))
      .populate("products.productId");

    const totalOrders = await Order.countDocuments(orders);

    res.ok({ orders, totalOrders }, { page, limit, startDate, endDate });
  }

  // Get all orders by buisness
  async getOrdersByBusiness(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    // Find all products belonging to the specified business
    const products = await Product.find({ businessId });

    // Extract productIds from the products found
    const productIds = products.map((product) => product._id);

    // Find orders where at least one product belongs to the specified business
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      "products.productId": { $in: productIds },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1))
      .populate("products.productId");

    const totalOrders = await Order.countDocuments(orders);

    res.ok({ orders, totalOrders }, { page, limit, startDate, endDate });
  }

  async getSingleOrder(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) {
      throw new ResourceNotFound(
        "business Id is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }
    const order = await Order.findById(id).populate("products.productId");
    if (!order) {
      throw new ResourceNotFound(
        `No order with id : ${id}`,
        "RESOURCE_NOT_FOUND"
      );
    }
    res.ok({ order });
  }

  async updateOrder(req: Request, res: Response) {
    const { id } = req.params;

    // Validate the request body
    const { error, data } = validators.updateOrderValidator(req.body);
    if (error) {
      throw new BadRequest(error.message, error.code);
    }

    // Extract the editable fields from the validated data
    const { orderStatus, deliveryDetails } = data;

    // Find the order by id
    const order = await Order.findOne({ _id: id });
    if (!order) {
      throw new ResourceNotFound(
        `No order with id : ${id}`,
        "RESOURCE_NOT_FOUND"
      );
    }

    // Update the order status if provided and valid
    if (orderStatus) {
      order.orderDetails.orderStatus = orderStatus;
    }

    // Update the delivery details if provided
    if (deliveryDetails) {
      Object.assign(order.deliveryDetails, deliveryDetails);
    }

    // Save the updated order
    await order.save();

    res.ok({ order });
  }

  // handle payment trial
  async handlePaymentTrialWithStripe(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;

    const { orderId } = req.query;
    if (!orderId) {
      throw new ResourceNotFound("Order id is missing.", "RESOURCE_NOT_FOUND");
    }

    const order = await Order.findOne({
      _id: orderId,
      buyerId,
    });

    if (!order) {
      throw new ResourceNotFound(
        "Order not found or not associated with your account.",
        "RESOURCE_NOT_FOUND"
      );
    }
    if (order.paymentDetails.paymentStatus !== "Pending") {
      throw new BadRequest(
        "You cannot continue with this transaction.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }
    const stripeTotalAmount = Math.round(
      Number(order.paymentDetails.totalAmount) * 100
    ); // Round to nearest integer

    // create the payment link
    const response = await StripeService.createCheckoutSession(
      stripeTotalAmount,
      order._id // Use _id here
    );
    if (!response) {
      throw new ServerError(
        "Initiate payment failed",
        "THIRD_PARTY_API_FAILURE"
      );
    }

    return res.ok({
      redirectUrl: response.url,
      order,
      messageOrder:
        "Payment link successfully generated, pay within next 5 minutes to avoid order being cancelled.",
    });
  }
}

export default new OrderController();

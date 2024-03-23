import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// import Order, { IOrder } from "../../../db/models/order.model";
import Product from "../../../db/models/product.model";
import PaypalService from "../../../services/payment.service";

import {
  BadRequest,
  ResourceNotFound,
  ServerError,
} from "../../../errors/httpErrors";

import * as validators from "../validators/order.validator";
// const yourBaseURL = process.env.BASE_URL!;

class OrderController {
  async createOrder(req: Request, res: Response) {
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
    const orderRef = uuidv4();

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

    const orderPayload = {
      buyerId,
      orderRef,
      products: productArray,
      orderDetails: {
        noOfItems: products.length,
        // orderStatus
      },
      paymentDetails: {
        paymentMethod: paymentDetails.paymentMethod,
        totalAmount,
        totalSubAmount,
        shippingFee,
        tax,
        // paymentRef, paymentStatus
      },
      deliveryDetails,
      // expectedDeliveryStart,
      // expectedDeliveryEnd,
    };

    const orderPaypal = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            // reference_id: "d9f80740-38f0-11e8-b467-0ed5f89f718b",
            currency_code: "USD",
            value: orderPayload.paymentDetails.totalAmount.toString(),
          },
        },
      ],
    };

    const result = await PaypalService.orderPayment(orderPaypal);
    console.log(result);

    if (!result) {
      throw new ServerError(
        "Initiate payment failed",
        "THIRD_PARTY_API_FAILURE"
      );
    }

    const approveLink = result.links.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (link: any) => link.rel === "approve"
    );

    if (approveLink) {
      const approvalUrl = approveLink.href;
      // Redirect the user to the approval URL, which will take them to PayPal for payment approval
      return res.ok({
        approvalUrl,
        message: "Order payment link created.",
      });
    }
  }
}

export default new OrderController();

// const getAllOrders = async (req, res) => {
//   const orders = await Order.find({});
//   res.status(StatusCodes.OK).json({ orders, count: orders.length });
// };

// const getSingleOrder = async (req, res) => {
//   const { id: orderId } = req.params;
//   const order = await Order.findOne({ _id: orderId });
//   if (!order) {
//     throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
//   }
//   checkPermissions(req.user, order.user);
//   res.status(StatusCodes.OK).json({ order });
// };

// const getCurrentUserOrders = async (req, res) => {
//   const orders = await Order.find({ user: req.user.userId });
//   res.status(StatusCodes.OK).json({ orders, count: orders.length });
// };

// const updateOrder = async (req, res) => {
//   const { id: orderId } = req.params;
//   const { paymentIntentId } = req.body;

//   const order = await Order.findOne({ _id: orderId });
//   if (!order) {
//     throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
//   }
//   checkPermissions(req.user, order.user);

//   order.paymentIntentId = paymentIntentId;
//   order.status = "paid";
//   await order.save();

//   res.status(StatusCodes.OK).json({ order });
// };

// import express from "express";
// import fetch from "node-fetch";
// import "dotenv/config";
// import path from "path";

// const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8888 } = process.env;
// const base = "https://api-m.sandbox.paypal.com";
// const app = express();

// // host static files
// app.use(express.static("client"));

// // parse post params sent in body in json format
// app.use(express.json());

// /**
//  * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
//  * @see https://developer.paypal.com/api/rest/authentication/
//  */
// const generateAccessToken = async () => {
//   try {
//     if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
//       throw new Error("MISSING_API_CREDENTIALS");
//     }
//     const auth = Buffer.from(
//       PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
//     ).toString("base64");
//     const response = await fetch(`${base}/v1/oauth2/token`, {
//       method: "POST",
//       body: "grant_type=client_credentials",
//       headers: {
//         Authorization: `Basic ${auth}`,
//       },
//     });

//     const data = await response.json();
//     return data.access_token;
//   } catch (error) {
//     console.error("Failed to generate Access Token:", error);
//   }
// };

// /**
//  * Create an order to start the transaction.
//  * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
//  */
// const createOrder = async (cart) => {
//   // use the cart information passed from the front-end to calculate the purchase unit details
//   console.log(
//     "shopping cart information passed from the frontend createOrder() callback:",
//     cart
//   );

//   const accessToken = await generateAccessToken();
//   const url = `${base}/v2/checkout/orders`;
//   const payload = {
//     intent: "CAPTURE",
//     purchase_units: [
//       {
//         amount: {
//           currency_code: "USD",
//           value: "100.00",
//         },
//       },
//     ],
//   };

//   const response = await fetch(url, {
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//       // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
//       // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
//       // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
//       // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
//       // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
//     },
//     method: "POST",
//     body: JSON.stringify(payload),
//   });

//   return handleResponse(response);
// };

// /**
//  * Capture payment for the created order to complete the transaction.
//  * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
//  */
// const captureOrder = async (orderID) => {
//   const accessToken = await generateAccessToken();
//   const url = `${base}/v2/checkout/orders/${orderID}/capture`;

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//       // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
//       // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
//       // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
//       // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
//       // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
//     },
//   });

//   return handleResponse(response);
// };

// async function handleResponse(response) {
//   try {
//     const jsonResponse = await response.json();
//     return {
//       jsonResponse,
//       httpStatusCode: response.status,
//     };
//   } catch (err) {
//     const errorMessage = await response.text();
//     throw new Error(errorMessage);
//   }
// }

// app.post("/api/orders", async (req, res) => {
//   try {
//     // use the cart information passed from the front-end to calculate the order amount detals
//     const { cart } = req.body;
//     const { jsonResponse, httpStatusCode } = await createOrder(cart);
//     res.status(httpStatusCode).json(jsonResponse);
//   } catch (error) {
//     console.error("Failed to create order:", error);
//     res.status(500).json({ error: "Failed to create order." });
//   }
// });

// app.post("/api/orders/:orderID/capture", async (req, res) => {
//   try {
//     const { orderID } = req.params;
//     const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
//     res.status(httpStatusCode).json(jsonResponse);
//   } catch (error) {
//     console.error("Failed to create order:", error);
//     res.status(500).json({ error: "Failed to capture order." });
//   }
// });

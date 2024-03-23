import mongoose, { Document, Model } from "mongoose";

// Define the interface for the order document
export interface IOrder extends Document {
  orderRef: string;
  buyerId: mongoose.Types.ObjectId;
  products: {
    orderSubRef: string;
    productId: mongoose.Types.ObjectId;
    quantity: number;
    color: string;
    size: number;
    price: number;
    subtotal: number;
  }[];
  orderDetails: {
    NoOfItems: number;
    orderStatus:
      | "Payment Unsuccessful"
      | "Out of Stock"
      | "Cancelled"
      | "Refund"
      | "Pending Confirmation"
      | "Waiting to be Shipped"
      | "Out for Delivery"
      | "Shipped"
      | "Delivered";
  };
  paymentDetails: {
    paymentRef: string;
    paymentMethod: "Stripe" | "Paypal" | "Cash";
    paymentStatus: "Pending" | "Success" | "Failed";
    totalAmount: number;
    totalSubAmount: number;
    shippingFee: number;
    tax: number;
  };
  deliveryDetails: {
    shippingMethod: "Door Delivery" | "Pick-up Office";
    shippingAddress: string;
    shippingPhoneNumber: string;
    shippingCityCountry: string;
    expectedDeliveryStart: string;
    expectedDeliveryEnd: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the order schema
const OrderSchema = new mongoose.Schema<IOrder>(
  {
    orderRef: {
      type: String,
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer", // Reference to the buyer schema
      required: true,
    },
    products: [
      {
        orderSubRef: {
          type: String,
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to the product schema
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          required: true,
        },
      },
    ],

    orderDetails: {
      noOfItems: {
        type: Number,
        required: true,
      },
      orderStatus: {
        type: String,
        enum: [
          "Payment Unsuccessful",
          "Out of Stock",
          "Cancelled",
          "Refund",
          "Pending Confirmation",
          "Waiting to be Shipped",
          "Out for Delivery",
          "Shipped",
          "Delivered",
        ],
        required: true,
      },
    },

    paymentDetails: {
      paymentRef: {
        type: String,
        required: true,
      },
      paymentMethod: {
        type: String,
        required: true,
        enum: ["Stripe", "Paypal", "Cash"],
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Success", "Failed"],
        required: true,
        default: "Pending",
      },
      totalAmount: {
        // = totalsubamount + shipping + tax
        type: Number,
        required: true,
      },
      totalSubAmount: {
        // = subtotal of product accummulated
        type: Number,
        required: true,
      },
      shippingFee: {
        // = general shipping fee
        type: Number,
      },
      tax: {
        // = general tax on the order based on value
        type: Number,
      },
    },

    deliveryDetails: {
      shippingMethod: {
        type: String,
        required: true,
        enum: ["Door Delivery", "Pick-up Office"],
      },
      shippingAddress: {
        type: String,
        required: true,
      },
      shippingPhoneNumber: {
        type: String,
        required: true,
      },
      shippingCityCountry: {
        type: String,
        required: true,
      },
      expectedDeliveryStart: {
        type: Date,
        required: true,
      },
      expectedDeliveryEnd: {
        type: Date,
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Define the order model
const OrderModel: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default OrderModel;

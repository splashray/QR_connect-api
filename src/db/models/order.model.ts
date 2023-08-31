import mongoose, { Document, Model } from "mongoose";

// Define the interface for the order document
interface IOrder extends Document {
  buyerId: mongoose.Types.ObjectId;
  products: {
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    color: string;
    size: number;
    price: number;
  }[];
  orderRef: string;
  orderDetails: {
    NoOfItems: number;
    totalAmount: number;
    orderStatus: "Pending" | "Processing" | "Shipped" | "Delivered" | "Closed" | "Refund";
  };
  paymentDetails: {
    transactionRef: string;
    paymentMethod: "Stripe" | "Paypal" | "Cash";
    paymentStatus: "Pending" | "Success" | "Failed";
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
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to the product schema
          required: true,
        },
        name: {
          type: Number,
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
      },
    ],

    orderDetails:{
      NoOfItems: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      orderStatus: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "closed", "Refund"],
        default: "Pending",
      },
    },

    paymentDetails:{
      transactionRef: {
        type: String,
        required: true,
      },
      paymentMethod: {
        type: String,
        enum: ["Stripe", "Paypal", "Cash"],
        default: "Pending",
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Success", "Failed"],
        default: "Pending",
      },
    },
      
  },
  { timestamps: true }
);

// Define the order model
const OrderModel: Model<IOrder> = mongoose.model<IOrder>(
  "Order",
  OrderSchema
);

export default OrderModel;

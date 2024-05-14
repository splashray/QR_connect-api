import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITransaction extends Document {
  buyerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  transactionCustomId: string;
  transactionType: "Order";
  amount: number;
  status?: "pending" | "completed" | "Failed";
  paymentMethod: "Stripe";
  paymentComment: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    transactionCustomId: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Order"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "Failed"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Stripe"],
      required: true,
    },
    paymentComment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const TransactionModel: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);

export default TransactionModel;

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBusinessTransaction extends Document {
  businessId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  refNo: string;
  transactionType: "credit" | "withdrawal";
  amount: number;
  status: "pending" | "completed";
}

const businessTransactionSchema = new Schema<IBusinessTransaction>(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },  
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    refNo: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["credit", "withdrawal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    }
  },
  { timestamps: true },
);

const BusinessTransactionModel: Model<IBusinessTransaction> =
  mongoose.model<IBusinessTransaction>("BusinessTransaction", businessTransactionSchema);

export default BusinessTransactionModel;

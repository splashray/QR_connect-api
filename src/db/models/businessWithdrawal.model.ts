import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBusinessWithdrawal extends Document {
  businessId: mongoose.Types.ObjectId;
  withdrawalNo: string;
  amount: number;
  status: "pending" | "completed" | "Failed" | "Rejected";
}

const businessWithdrawalSchema = new Schema<IBusinessWithdrawal>(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    withdrawalNo: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "Failed", "Rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const BusinessWithdrawalModel: Model<IBusinessWithdrawal> =
  mongoose.model<IBusinessWithdrawal>(
    "BusinessWithdrawal",
    businessWithdrawalSchema
  );

export default BusinessWithdrawalModel;

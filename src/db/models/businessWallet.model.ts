import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBusinessWallet extends Document {
  businessId: mongoose.Types.ObjectId;
  paypalEmail: string;
  accountEmail: string;
  accountNumber: string;
}

const businessWalletSchema = new Schema<IBusinessWallet>(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    paypalEmail: {
      type: String,
    },
    accountEmail: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
  },
  { timestamps: true },
);

const BusinessWalletModel: Model<IBusinessWallet> =
  mongoose.model<IBusinessWallet>("BusinessWallet", businessWalletSchema);

export default BusinessWalletModel;

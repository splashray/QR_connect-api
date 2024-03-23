import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBusinessWallet extends Document {
  businessId: mongoose.Types.ObjectId;
  balance: number;
  paypalEmail: string;
  restriction: boolean;
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
    balance: {
      type: Number,
      default: 0,
    },
    paypalEmail: {
      type: String,
    },
    restriction: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const BusinessWalletModel: Model<IBusinessWallet> =
  mongoose.model<IBusinessWallet>("BusinessWallet", businessWalletSchema);

export default BusinessWalletModel;

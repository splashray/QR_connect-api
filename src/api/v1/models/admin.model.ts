import mongoose, { Document, Model } from "mongoose";

enum AccountType {
  Buyer = "Buyer",  
  Admin = "Admin",
  Business = "Business",
}

interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  accountType: AccountType;
  profilePicture?: string;
  isAdmin: boolean;
  refreshToken?: string;
  deletedAt?: Date | null;
}

const AdminSchema = new mongoose.Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      required: true,
      enum: Object.values(AccountType),
    },
    profilePicture: {
      type: String,
      default: "https://res.cloudinary.com/dsffatdpd/image/upload/v1685691602/baca/logo_aqssg3.jpg",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const AdminModel: Model<IAdmin> = mongoose.model<IAdmin>("Admin", AdminSchema);

export default AdminModel;

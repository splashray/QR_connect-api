import mongoose, { Document, Model } from "mongoose";

enum AccountType {
  Buyer = "Buyer",
  Admin = "Admin",
  Business = "Business",
}

enum UserType {
  Buyer = "Buyer",
  Business = "Business",
}

interface IBuyer extends Document {
  email: string;
  firstName: string;
  lastName: string;
  addressBook: string;
  phoneNumber: string;

  authType: {
    password?: string;
    googleUuid?: string;
  };
  accountType: AccountType;
  userType: UserType;
  profilePicture?: string;
  isAdmin: boolean;
  finishTourGuide: boolean;
  passwordRecovery?: {
    passwordRecoveryOtp?: string;
    passwordRecoveryOtpExpiresAt?: Date;
  };
  refreshToken?: string;
  deletedAt?: Date | null;
}

const BuyerSchema = new mongoose.Schema<IBuyer>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    
    addressBook: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    authType: {
      password: {
        type: String,
      },
      googleUuid: {
        type: String,
      },
    },
    accountType: {
      type: String,
      required: true,
      enum: Object.values(AccountType),
    },
    userType: {
      type: String,
      required: true,
      enum: Object.values(UserType),
    },
    profilePicture: {
      type: String,
      default: "https://res.cloudinary.com/dsffatdpd/image/upload/v1685691602/baca/logo_aqssg3.jpg",

    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    finishTourGuide: {
      type: Boolean,
      default: false,
    },

    passwordRecovery: {
      passwordRecoveryOtp: {
        type: String,
      },
      passwordRecoveryOtpExpiresAt: {
        type: Date,
      },
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

const BuyerModel: Model<IBuyer> = mongoose.model<IBuyer>("Buyer", BuyerSchema);

export default BuyerModel;

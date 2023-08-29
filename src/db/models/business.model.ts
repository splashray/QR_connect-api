import mongoose, { Document, Model } from "mongoose";

type AccountType = "Admin" | "Buyer" | "Business";

type UserType = "Buyer" | "Business";

type SubscriptionStatus = "Trial" | "Subscribed" | "Deactivated";

interface IBusiness extends Document {
  qrcode: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessSlug: string,
  industry: string;

  authType: {
    password?: string;
    googleUuid?: string;
  };
  accountType: AccountType;
  userType: UserType;
  profilePicture?: string;
  isAdmin: boolean;
  finishTourGuide: boolean;
  subscriptionStatus: SubscriptionStatus;
  passwordRecovery?: {
    passwordRecoveryOtp?: string;
    passwordRecoveryOtpExpiresAt?: Date;
  };
  refreshToken?: string;
  deletedAt?: Date | null;
}

const BusinessSchema = new mongoose.Schema<IBusiness>(
  {
    qrcode: {
      type: String,
      required: true,
    },
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

    businessName: {
        type: String,
        required: true,
    },
    businessSlug: {
        type: String,
        required: true,
    },
    industry: {
        type: String,
        required: true,
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
      enum: ["Admin", "Buyer", "Business"],
    },
    userType: {
      type: String,
      required: true,
      enum: ["Buyer","Business"]
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
    subscriptionStatus: {
      type: String,
      enum:[ "Trial", "Subscribed", "Deactivated"],
      default: "Trial",
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

const BusinessModel: Model<IBusiness> = mongoose.model<IBusiness>("Business", BusinessSchema);

export default BusinessModel;

import mongoose, { Document, Model, Schema } from "mongoose";

type SubscriptionStatus = "active" | "expired" | "failed" | "pending";

interface ISubscription extends Document {
  businessId: mongoose.Types.ObjectId;
  subscriptionPlanId: mongoose.Types.ObjectId;
  paidAt: Date;
  expiresAt: Date;
  status: SubscriptionStatus;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "failed", "pending"],
      required: true,
    },
  },
  { timestamps: true },
);

const SubscriptionModel: Model<ISubscription> = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);

export default SubscriptionModel;

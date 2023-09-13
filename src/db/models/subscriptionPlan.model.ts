import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  duration: number;
  paypalPlanId: string;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    paypalPlanId: {
      type: String,
    },
  },
  { timestamps: true },
);

const SubscriptionPlanModel: Model<ISubscriptionPlan> =
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlanModel;

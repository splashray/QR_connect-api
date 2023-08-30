import mongoose, { Document, Model, Schema } from "mongoose";

interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  duration: number;
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
  },
  { timestamps: true },
);

const SubscriptionPlanModel: Model<ISubscriptionPlan> =
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlanModel;

import mongoose, { Document, Model, Schema } from "mongoose";

interface ISubscriptionLog extends Document {
  businessId: mongoose.Types.ObjectId;
  subscriptionPlanId: mongoose.Types.ObjectId;
  reference: string;
  amountPaid: number;
  startDate: Date;
  endDate: Date;
  comment: string;
}

const subscriptionLogSchema = new Schema<ISubscriptionLog>(
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
    reference: {
      type: String,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const SubscriptionLogModel: Model<ISubscriptionLog> = mongoose.model<ISubscriptionLog>(
  "SubscriptionLog",
  subscriptionLogSchema
);

export default SubscriptionLogModel;

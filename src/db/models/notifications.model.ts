import mongoose, { Document, Model, Schema } from "mongoose";

interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "Notifications",
  }
);

const NotificationModel: Model<INotification> = mongoose.model<INotification>(
  "Notifications",
  notificationSchema
);

export default NotificationModel;

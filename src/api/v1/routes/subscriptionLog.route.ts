import express from "express";
import SubscriptionLogController from "../controllers/subscriptionLog.controller";
import { auth } from "../../middlewares/authMiddleware";

const subscriptionLogRouter = express.Router();

// Get all subscriptions
subscriptionLogRouter.get("/", auth({ accountType: ["admin"] }), SubscriptionLogController.getSubscriptionLogs);

// Get a subscription plan by ID
subscriptionLogRouter.get("/:id", auth({ accountType: ["admin"] }),  SubscriptionLogController.getSubscriptionLogById);


export default subscriptionLogRouter;

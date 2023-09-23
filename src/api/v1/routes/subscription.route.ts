import express from "express";
import SubscriptionController from "../controllers/subscription.controller";
import { auth } from "../../middlewares/authMiddleware";

const subscriptionRouter = express.Router();


// Create a free trial subscription by business/admin for business
subscriptionRouter.post( "/create/freetrial", auth({ accountType: ["business"] }), SubscriptionController.createFreeTrialSubscription);

// Create a new subscription by business/admin for business
subscriptionRouter.post( "/create/paypal", auth({ accountType: ["business"] }), SubscriptionController.createSubscriptionWithPaypal);

// Cancel a subscription by business/admin for business
subscriptionRouter.post( "/cancel/paypal", auth({ accountType: ["business"] }), SubscriptionController.cancelSubscription);

// Activate Subscription by business/admin for business
// subscriptionRouter.post( "/activate/paypal", auth({ accountType: ["business"] }), SubscriptionController.activateSubscription);

// Get all subscriptions by admin
subscriptionRouter.get("/all", auth({ accountType: ["admin"] }),  SubscriptionController.getSubscriptionsByAdmin);

// Get a subscription by ID
subscriptionRouter.get("/:businessId", auth({ accountType: ["business"] }),  SubscriptionController.getSubscriptionByBusinessId);



export default subscriptionRouter;

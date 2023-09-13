import express from "express";
import SubscriptionController from "../controllers/subscription.controller";
import { auth } from "../../middlewares/authMiddleware";

const subscriptionPlanRouter = express.Router();


// Create a free trial subscription by business/admin for business
subscriptionPlanRouter.post( "/create/freetrial", auth({ accountType: ["business"] }), SubscriptionController.createFreeTrialSubscription);

// Create a new subscription by business/admin for business
subscriptionPlanRouter.post( "/create/paypal", auth({ accountType: ["business"] }), SubscriptionController.createSubscriptionWithPaypal);

// // Get all subscription plans
// subscriptionPlanRouter.get("/", SubscriptionPlanController.getSubscriptionPlans);

// // Get a subscription plan by ID
// subscriptionPlanRouter.get("/:subscriptionPlanId", SubscriptionPlanController.getSubscriptionPlanById);

// // Update a subscription plan by ID (admin route)
// subscriptionPlanRouter.put( "/:subscriptionPlanId", auth({ accountType: ["admin"] }), SubscriptionPlanController.updateSubscriptionPlan );

// // Delete a subscription plan by ID (admin route)
// subscriptionPlanRouter.delete( "/:subscriptionPlanId", auth({ accountType: ["admin"] }),SubscriptionPlanController.deleteSubscriptionPlan );

export default subscriptionPlanRouter;

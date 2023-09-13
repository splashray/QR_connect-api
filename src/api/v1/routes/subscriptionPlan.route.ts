import express from "express";
import SubscriptionPlanController from "../controllers/subscriptionPlan.controller";
import { auth } from "../../middlewares/authMiddleware";

const subscriptionPlanRouter = express.Router();

// Create a new subscription plan (admin route)
subscriptionPlanRouter.post( "/", auth({ accountType: ["admin"] }), SubscriptionPlanController.createSubscriptionPlan);

// Get all subscription plans
subscriptionPlanRouter.get("/", SubscriptionPlanController.getSubscriptionPlans);

// Get a subscription plan by ID
subscriptionPlanRouter.get("/:subscriptionPlanId", SubscriptionPlanController.getSubscriptionPlanById);

// Update a subscription plan by ID (admin route)
subscriptionPlanRouter.put( "/:subscriptionPlanId", auth({ accountType: ["admin"] }), SubscriptionPlanController.updateSubscriptionPlan );

// Delete a subscription plan by ID (admin route)
subscriptionPlanRouter.delete( "/:subscriptionPlanId", auth({ accountType: ["admin"] }),SubscriptionPlanController.deleteSubscriptionPlan );

export default subscriptionPlanRouter;

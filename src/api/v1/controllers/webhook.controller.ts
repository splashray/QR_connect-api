import { Request, Response } from "express";
import { BadRequest, ResourceNotFound, ServerError } from "../../../errors/httpErrors";
import Business from "../../../db/models/business.model";
import SubscriptionPlan from "../../../db/models/subscriptionPlan.model";
import Subscription from "../../../db/models/subscription.model";
import SubscriptionLog from "../../../db/models/subscriptionLog.model";
// import { v4 as uuidv4 } from "uuid";
// import PaypalService from "./paypalService"; // Adjust the import path as needed

class WebhookController {
  async paypalWebhook(req: Request, res: Response) {
    const { event_type } = req.body;

    // Check if the event_type matches the desired events
    if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED" || event_type === "PAYMENT.SALE.COMPLETED") {
      try {
        // Handle the webhook event based on the event type
        if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
          await this.handleSubscriptionActivated(req.body); // Handle subscription activation
        } else if (event_type === "PAYMENT.SALE.COMPLETED") {
          await this.handlePaymentCompleted(req.body); // Handle payment completed
        }

        return res.ok({ message: "Webhook event processed." });
      } catch (error) {
        console.error("Error handling PayPal webhook event:", error);
        throw new ServerError("Error handling PayPal webhook event", "UNEXPECTED_ERROR");
      }
    }

    // Handle other webhook events or return a response if not handled
    return res.ok({ message: "Webhook event processed." });
  }

  // Handle subscription activation event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleSubscriptionActivated(data: any) {
    // Extract necessary information from the webhook data
    const { resource, resource_type } = data;

    if (resource_type === "subscription") {
      // Get the business ID and subscription plan ID from your data source (e.g., MongoDB)
      const businessId = resource.businessId; // Adjust this based on your data structure
      const subscriptionPlanId = resource.subscriptionPlanId; // Adjust this based on your data structure

      // Check if the business exists
      const business = await Business.findById(businessId);
      if (!business) {
        throw new ResourceNotFound(`Business with ID ${businessId} not found.`, "RESOURCE_NOT_FOUND");
      }

      // Retrieve the selected subscription plan from MongoDB
      const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        throw new ResourceNotFound("Subscription Plan not found", "RESOURCE_NOT_FOUND");
      }

      // Create or update the subscription based on the webhook data
      await this.createOrUpdateSubscription(businessId, subscriptionPlan);
    }
  }

  // Handle payment completed event
  async handlePaymentCompleted(data: any) {
    // Extract necessary information from the webhook data
    // Add your logic to handle payment completed events here
    // You can access the payment details from 'data' object
  }

  // Create or update the subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOrUpdateSubscription(businessId: string, subscriptionPlan: any) {
    // Check if the user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      businessId,
      status: "active",
    });

    if (existingSubscription) {
      // Update the existing subscription if needed
      // You can add logic here to update subscription details if necessary
      // For example, updating the subscription end date or plan
    } else {
      // Create a new subscription
      const newSubscription = new Subscription({
        businessId,
        subscriptionPlanId: subscriptionPlan._id,
        // Add other subscription details as needed
        status: "active",
        expiresAt: new Date(), // Set the expiration date as needed
      });

      const savedSubscription = await newSubscription.save();

      if (!savedSubscription) {
        throw new BadRequest("Failed to create a new subscription", "INVALID_REQUEST_PARAMETERS");
      }

      // Create a subscription log entry
      const newSubscriptionLog = new SubscriptionLog({
        businessId,
        subscriptionPlanId: subscriptionPlan._id,
        // Add other subscription log details as needed
        comment: "Subscription created",
      });

      const savedSubscriptionLog = await newSubscriptionLog.save();

      if (!savedSubscriptionLog) {
        throw new BadRequest("Failed to create a subscription log entry", "INVALID_REQUEST_PARAMETERS");
      }
    }
  }
}

export default new WebhookController();

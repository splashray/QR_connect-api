import { Request, Response } from "express";
import { BadRequest, ResourceNotFound } from "../../../errors/httpErrors";
import Business from "../../../db/models/business.model";
import SubscriptionPlan, { ISubscriptionPlan } from "../../../db/models/subscriptionPlan.model";
import Subscription from "../../../db/models/subscription.model";
import SubscriptionLog from "../../../db/models/subscriptionLog.model";
import PaypalService from "../../../services/payment.service";
import dotenv from "dotenv";
dotenv.config();

interface resourcePayload {
    id: string,
    custom_id: string
    start_time: Date,
    billing_info: {
        next_billing_time: string
    },
    plan_id: string,
}    

class WebhookController {
  constructor() {
    // Bind the methods to the current instance
    this.paypalWebhook = this.paypalWebhook.bind(this);
    this.handleSubscriptionActivated = this.handleSubscriptionActivated.bind(this);
    this.handlePaymentCompleted = this.handlePaymentCompleted.bind(this);
  }
  //function to verify Webhook Signature     
  async paypalWebhook(req: Request, res: Response) {
    const headers = req.headers;
    const body = JSON.stringify(req.body);
   
    // Call the createSubscription function from PaypalService
    const result = await PaypalService.paypalWebhook(headers, body);
    // Verify the webhook signature
    if (result.verification_status === "SUCCESS") {
      console.log("valid signature", result)
      // Signature is valid, process the webhook event
      const { event_type, resource_type,  resource } = JSON.parse(body);
    
      // Handle the webhook event based on the event type
      if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {   
        console.log("type: BILLING.SUBSCRIPTION.ACTIVATED")
        await this.handleSubscriptionActivated(resource, resource_type); 
      } else if (event_type === "PAYMENT.SALE.COMPLETED") {
        console.log("type: PAYMENT.SALE.COMPLETED")
        await this.handlePaymentCompleted(JSON.parse(body)); 
      }
  
      // Handle response since event if is handled
      console.log("Handle response")
      return res.sendStatus(200);
    } else {
      // Invalid signature, reject the webhook
      console.log("Invalid signature", result)
      return res.sendStatus(403); // 403 Forbidden
    }

  }

  // Handle subscription activation event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleSubscriptionActivated(resource_type: string, resource: resourcePayload) {
    if (resource_type === "subscription") {
      console.log("resource_type: subscription")

      const businessId = resource.custom_id; 
      const PlanId = resource.plan_id; 

      // Check if the business exists
      const business = await Business.findById(businessId);
      if (!business) {
        throw new ResourceNotFound(`Business with ID ${businessId} not found.`, "RESOURCE_NOT_FOUND");
      }

      // Retrieve the selected subscription plan from MongoDB
      const subscriptionPlan = await SubscriptionPlan.findOne({paypalPlanId: PlanId});
      if (!subscriptionPlan) {
        throw new ResourceNotFound("Subscription Plan not found", "RESOURCE_NOT_FOUND");
      }

      // Create or update the subscription based on the webhook data
      await this.createOrUpdateSubscription(businessId, subscriptionPlan, resource);
    }
  }

  // Create or update the subscription
  async createOrUpdateSubscription(businessId: string, subscriptionPlan: ISubscriptionPlan, resource: resourcePayload) {

    // Check if the user already has an active subscription
    const existingSubscription = await Subscription.findOne({businessId});
    if (existingSubscription) {
      console.log("existingSubscription")

      // Update the existing subscription if needed
      existingSubscription.subscriptionPlanId = subscriptionPlan._id;
      existingSubscription.subscriptionPlanName = subscriptionPlan.name;
      existingSubscription.status = "active";
      existingSubscription.paidAt =  new Date(resource.start_time);
      existingSubscription.paypalPlanId = resource.plan_id;
      existingSubscription.subscribedIdFromPaypal =  resource.id;

      // Save the updated subscription
      const updatedSubscription = await existingSubscription.save();
  
      if (!updatedSubscription) {
        throw new BadRequest("Failed to update the subscription", "INVALID_REQUEST_PARAMETERS");
      }
        
      // Create a subscription log entry for the update
      const updateSubscriptionLog = new SubscriptionLog({
        businessId,
        subscriptionPlanId: subscriptionPlan._id,
        reference: resource.id,
        amountPaid: subscriptionPlan.price,
        startDate: new Date(resource.start_time),
        endDate: new Date(resource.billing_info.next_billing_time),
        comment: `${subscriptionPlan.name} Subscription created`
      });
  
      const savedUpdateSubscriptionLog = await updateSubscriptionLog.save();
  
      if (!savedUpdateSubscriptionLog) {
        throw new BadRequest("Failed to create a subscription log entry for the update", "INVALID_REQUEST_PARAMETERS");
      }
      
    } else {
      console.log("No existingSubscription")

      // Create a new subscription and subscription log
      const newSubscription = new Subscription({
        businessId,
        subscriptionPlanId: subscriptionPlan._id,
        subscriptionPlanName: subscriptionPlan.name,
        status: "active",
        paidAt: new Date(resource.start_time),
        expiresAt: new Date(resource.billing_info.next_billing_time),
        paypalPlanId: resource.plan_id,
        subscribedIdFromPaypal: resource.id
      });

      const savedSubscription = await newSubscription.save();

      if (!savedSubscription) {
        throw new BadRequest("Failed to create a new subscription", "INVALID_REQUEST_PARAMETERS");
      }

      // Create a subscription log entry
      const newSubscriptionLog = new SubscriptionLog({
        businessId,
        subscriptionPlanId: subscriptionPlan._id,
        reference: resource.id,
        amountPaid: subscriptionPlan.price,
        startDate: new Date(resource.start_time),
        endDate: new Date(resource.billing_info.next_billing_time),
        comment: `${subscriptionPlan.name} Subscription created`
      });

      const savedSubscriptionLog = await newSubscriptionLog.save();

      if (!savedSubscriptionLog) {
        throw new BadRequest("Failed to create a subscription log entry", "INVALID_REQUEST_PARAMETERS");
      }
    }
  }
  
  
  // Handle payment completed event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handlePaymentCompleted(data: any) {
    console.log(data)
  }
}

export default new WebhookController();

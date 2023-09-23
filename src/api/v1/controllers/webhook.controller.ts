import { Request, Response } from "express";
import Business, { IBusiness } from "../../../db/models/business.model";
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
    this.handleSubscriptionCancelled = this.handleSubscriptionCancelled.bind(this);
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
    
      console.log( event_type, resource_type,  resource );
      
      // Handle the webhook event based on the event type
      if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {   
        console.log("type: BILLING.SUBSCRIPTION.ACTIVATED")
        await this.handleSubscriptionActivated(resource, resource_type, res); 
      } else if (event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
        console.log("type: BILLING.SUBSCRIPTION.CANCELLED")
        await this.handleSubscriptionCancelled(resource, resource_type, res); 
      } else if (event_type === "PAYMENT.SALE.COMPLETED") {
        console.log("type: PAYMENT.SALE.COMPLETED")
        await this.handlePaymentCompleted(JSON.parse(body)); 
      }  else{
        // Handle response since event is handled
        console.log("Handle response")
        return res.sendStatus(200);
      }
  
    } else {
      console.log(result);
      // Invalid signature, reject the webhook
      console.log("Invalid signature", result)
      return res.sendStatus(403); // 403 Forbidden
    }

  }

  // Handle subscription activation event
  async handleSubscriptionActivated(resource: resourcePayload, resource_type: string, res: Response) {
    if (resource_type === "subscription") {
      console.log("resource_type: subscription")

      const businessId = resource.custom_id; 
      const PlanId = resource.plan_id; 

      // Check if the existingLog exists
      const existingLog = await SubscriptionLog.findOne({reference: resource.id});
      if (existingLog) {
        return res.sendStatus(401); // 401 badrequest
      }

      // Check if the business exists
      const business = await Business.findById(businessId);
      if (!business) {
        return res.sendStatus(404); // 404 not found
      }

      // Retrieve the selected subscription plan from MongoDB
      const subscriptionPlan = await SubscriptionPlan.findOne({paypalPlanId: PlanId});
      if (!subscriptionPlan) {
        return res.sendStatus(404); // 404 not found
      }

      // Create or update the subscription based on the webhook data
      await this.createOrUpdateSubscription(business, subscriptionPlan, resource, res);
    }
  }

  // Create or update the subscription
  async createOrUpdateSubscription(business: IBusiness, subscriptionPlan: ISubscriptionPlan, resource: resourcePayload, res:Response) {

    const businessId = business._id
    // Check if the user already has an active subscription
    const existingSubscription = await Subscription.findOne({businessId});
    if (existingSubscription) {
      console.log("existingSubscription")

      // Update the existing subscription if needed
      existingSubscription.subscriptionPlanId = subscriptionPlan._id;
      existingSubscription.subscriptionPlanName = subscriptionPlan.name;
      existingSubscription.status = "active";
      existingSubscription.paidAt =  new Date(resource.start_time);
      existingSubscription.expiresAt =   new Date(resource.billing_info.next_billing_time),
      existingSubscription.paypalPlanId = resource.plan_id;
      existingSubscription.subscribedIdFromPaypal =  resource.id;
      // Save the updated subscription
      const updatedSubscription = await existingSubscription.save();
      if (!updatedSubscription) {
        return res.sendStatus(401); // 401 badrequest
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
        return res.sendStatus(401); // 401 badrequest
      }

      // update business sub status
      business.subscriptionStatus = "Subscribed";
      const savedBusiness = await business.save();
      if (!savedBusiness) {
        return res.sendStatus(401); // 401 badrequest
      }
      // Handle response since event is handled
      console.log("Handle response")
      return res.sendStatus(200);
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
        return res.sendStatus(401); // 401 badrequest
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
        return res.sendStatus(401); // 401 badrequest
      }

      // update business sub status
      business.subscriptionStatus = "Subscribed";
      const savedBusiness = await business.save();
      if (!savedBusiness) {
        return res.sendStatus(401); // 401 badrequest
      }
      // Handle response since event is handled
      console.log("Handle response")
      return res.sendStatus(200);
    }
  }
  
  // Cancel the subscription
  async handleSubscriptionCancelled(resource: resourcePayload, resource_type: string, res: Response) {
    if (resource_type === "subscription") {
      console.log("resource_type: subscription")

      const businessId = resource.custom_id; 
      // Check if the business exists
      const business = await Business.findById(businessId);
      if (!business) {
        return res.sendStatus(404); // 404 not found
      }
      // update business sub status
      business.subscriptionStatus = "Deactivated";
      const savedBusiness = await business.save();
      if (!savedBusiness) {
        return res.sendStatus(401); // 401 badrequest
      }

      // update business sub in the subscription status
      const subscription = await Subscription.findOne({
        subscribedIdFromPaypal: resource.id, businessId: businessId
      });
      if (!subscription) {
        return res.sendStatus(404); // 404 not found
      }
      // update subscription sub status subscription
      subscription.status = "expired";
      const savedSub = await subscription.save();
      if (!savedSub) {
        return res.sendStatus(401); // 401 badrequest
      }

      // Handle response since event is handled
      console.log("Handle response")
      return res.sendStatus(200);
    }
  }

  
  // Handle payment completed event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handlePaymentCompleted(data: any) {
    console.log(data)
  }
}

export default new WebhookController();

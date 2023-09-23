import { Request, Response } from "express";
import {
  BadRequest,
  ResourceNotFound, ServerError
} from "../../../errors/httpErrors";
import Business from "../../../db/models/business.model";
import SubscriptionPlan from "../../../db/models/subscriptionPlan.model";
import Subscription from "../../../db/models/subscription.model";
import SubscriptionLog from "../../../db/models/subscriptionLog.model";
import PaypalService from "../../../services/payment.service";
import { v4 as uuidv4 } from "uuid"; 
import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
import * as moment from "moment-timezone";

const yourBaseURL = process.env.BASE_URL!;
type QueryParams = {
  startDate?: Date; 
  endDate?: Date; 
  limit?: string; 
  page?: string; 
};

class SubscriptionController {
  // Create a new free trial subscription
  async createFreeTrialSubscription(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
    const { subscriptionPlanId } = req.query;
    if (!subscriptionPlanId) {
      throw new ResourceNotFound("subscription Plan Id is missing.", "RESOURCE_NOT_FOUND");
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new ResourceNotFound(`Business with ID ${businessId} not found.`, "RESOURCE_NOT_FOUND");
    }

    // Retrieve the selected subscription plan from MongoDB
    const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!subscriptionPlan) {
      throw new ResourceNotFound("Subscription Plan not found", "RESOURCE_NOT_FOUND");
    }

    // Check if the selected subscription plan is a Free Trial Package
    if (subscriptionPlan.name !== "Free Trial Package") {
      throw new BadRequest("Selected plan is not a free trial Plan", "INVALID_REQUEST_PARAMETERS");
    }

    // Check if the user already has an active subscription to the free plan
    const existingFreeTrialSubscription = await Subscription.findOne({
      businessId,
      subscriptionPlanId: subscriptionPlan._id,
      status: "active",
    });

    if (existingFreeTrialSubscription) {
      throw new BadRequest("You are already subscribed to the free trial Plan", "INVALID_REQUEST_PARAMETERS");
    }

    const existingSubscriptionLog = await SubscriptionLog.findOne({
      businessId,
      subscriptionId: subscriptionPlan._id,
    });
    if (existingSubscriptionLog) {
      throw new BadRequest("You free trial Plan has overdue, kindly subscribe to other plans", "INVALID_REQUEST_PARAMETERS");
    }


    // Calculate the expiration date, which is 7 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Create the new subscription with the calculated expiration date
    const newSubscription = new Subscription({
      businessId,
      subscriptionPlanId: subscriptionPlan._id,
      subscriptionPlanName: subscriptionPlan.name,
      status: "active",
      paidAt: new Date(),
      expiresAt: expirationDate,
    // paypalPlanId
    // subscribedIdFromPaypal
    });

    const savedFreeTrialSubscription =  await newSubscription.save();

    // if not savedFreeTrialSubscription
    if (!savedFreeTrialSubscription) {
      throw new BadRequest("Initiate free trial failed.","INVALID_REQUEST_PARAMETERS");
    }

    
    // Create the new subscription log with the calculated expiration date
    const customId = uuidv4(); 
    const newSubscriptionLog = new SubscriptionLog({
      businessId,
      subscriptionPlanId: subscriptionPlan._id,
      reference: customId,
      amountPaid: 0,
      startDate: new Date(),
      endDate: expirationDate,
      comment: "Free trial subscription package"
    });

    const savedFreeTrialSubscriptionLog =  await newSubscriptionLog.save();

    // if not savedFreeTrialSubscriptionLog
    if (!savedFreeTrialSubscriptionLog) {
      throw new BadRequest("Initiate free trial failed..","INVALID_REQUEST_PARAMETERS");
    }

    const updatedbusiness = await Business.findByIdAndUpdate(businessId,
      { subscriptionStatus: "Free-Trial", updatedAt: new Date() },
      { new: true }
    );
    // if not updatedbusiness
    if (!updatedbusiness) {
      throw new BadRequest("Initiate free trial failed for business","INVALID_REQUEST_PARAMETERS");
    }

    return res.ok({ 
      savedFreeTrialSubscription,
      savedFreeTrialSubscriptionLog,
      message: "Free Trial Subscription created Successfully.",
    });
  }

  // Create a new subscription
  async createSubscriptionWithPaypal(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
    const { subscriptionPlanId } = req.query;
    if (!subscriptionPlanId) {
      throw new ResourceNotFound("subscription Plan Id is missing.", "RESOURCE_NOT_FOUND");
    }
  
    const business = await Business.findById(businessId);
    if (!business) {
      throw new ResourceNotFound(
        `Business with ID ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }
    // Retrieve the selected subscription plan from MongoDB
    const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!subscriptionPlan) {
      throw new ResourceNotFound("Subscription Plan not found", "RESOURCE_NOT_FOUND");
    }
    // Check if the selected subscription plan is a Free Trial Package
    if (subscriptionPlan.name === "Free Trial Package") {
      throw new BadRequest("Selected plan is a free trial Plan", "INVALID_REQUEST_PARAMETERS");
    }
    
    // Detect the user's timezone based on their browser settings
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Get the current time in the detected user's timezone
    const userCurrentTime = moment.tz(userTimeZone);
    // Calculate the start time by adding 1 hour to the current time
    const startTime = userCurrentTime.add(1, "hours").toISOString();
    console.log(startTime)

    // Create a PayPal subscription payload
    const paypalSubscriptionPayload = {
      plan_id: subscriptionPlan.paypalPlanId, 
      start_time: startTime, 
      quantity: "1", 
      shipping_amount: {
        currency_code: "USD",
        value: "0", 
      },
      subscriber: {
        name: {
          given_name: business.firstName,
          surname: business.lastName, 
        },
        email_address: business.email, 
      },
      application_context: {
        brand_name: "QR Conect", 
        locale: "en-US", 
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: `${yourBaseURL}/store/dashboard`,
        cancel_url: `${yourBaseURL}/auth/select-plan`,
      },
      custom_id: business._id,
    };

    // Call the createSubscription function from PaypalService
    const result = await PaypalService.createSubscription(paypalSubscriptionPayload);
    if (!result) {
      throw new ServerError("Initiate payment failed", "THIRD_PARTY_API_FAILURE");
    }

    //extract out the link to make payment from the result response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approveLink = result.links.find((link: any) => link.rel === "approve"); 
    // console.log("RESULT", result);

    if (approveLink) {
      const approvalUrl = approveLink.href;
      // Redirect the user to the approval URL, which will take them to PayPal for payment approval
      return res.ok({ 
        approvalUrl,
        message: "Subscription link created.",
      });
    }
    
  }

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
    const { reason } = req.query;
    // Check if reason is missing or an empty string
    if (!reason || (typeof reason === "string" && reason.trim() === "")) {
      throw new ResourceNotFound("You don't have a valid reason to cancel the plan.", "RESOURCE_NOT_FOUND");
    }

    const subscription = await Subscription.findOne({businessId: businessId});
    if (!subscription) {
      throw new ResourceNotFound(`Subscription with ID ${businessId} not found.`, "RESOURCE_NOT_FOUND");
    }

    const id = subscription.subscribedIdFromPaypal;
    // Call the cancelSubscription function from PaypalService
    const result = await PaypalService.cancelSubscription(reason.toString(), id);
    if (result.status !== 204) {
      throw new ServerError("Initiate cancellation failed", "THIRD_PARTY_API_FAILURE");
    }
      
    res.ok("Your Subscription has been cancelled");
  }

  // // Activate subscription
  // async activateSubscription(req: Request, res: Response) {
  //   const businessId = req.loggedInAccount._id;
  //   const { reason } = req.query;
  //   // Check if reason is missing or an empty string
  //   if (!reason || (typeof reason === "string" && reason.trim() === "")) {
  //     throw new ResourceNotFound("You don't have a valid reason to cancel the plan.", "RESOURCE_NOT_FOUND");
  //   }

  //   const subscription = await Subscription.findOne({businessId: businessId});
  //   if (!subscription) {
  //     throw new ResourceNotFound(`Subscription with ID ${businessId} not found.`, "RESOURCE_NOT_FOUND");
  //   }
  //   console.log(subscription);

  //   const id = subscription.subscribedIdFromPaypal;
  //   // Call the activateSubscription function from PaypalService
  //   const result = await PaypalService.activateSubscription(reason.toString(), id);
  //   console.log("RESULT ======" ,result)
  //   if (result.status !== 204) {
  //     throw new ServerError("Initiate activation failed", "THIRD_PARTY_API_FAILURE");
  //   }
      
  //   res.ok("Your Subscription has been reactivated");
  // }

  // Get subscription by businessId
  async getSubscriptionByBusinessId(req: Request, res: Response) {
    const { businessId } = req.params;
    if (!businessId) {
      throw new ResourceNotFound("business Id is missing.", "RESOURCE_NOT_FOUND");
    }
    const subscription = await Subscription.findOne({ businessId });
    if (!subscription) {
      throw new ResourceNotFound(`Subscription with ID ${businessId} not found.`, "RESOURCE_NOT_FOUND");
    }
    const subscriptionlog = await SubscriptionLog.find({ businessId });

    // Fetch the latest SubscriptionLog for the Subscription
    const currentSubscriptionLog = await SubscriptionLog.findOne({ businessId })
      .sort({ createdAt: -1 }) 
      .limit(1);


    res.ok({subscription, currentSubscriptionLog, subscriptionlog});
  }

  // Get all subscriptions by admin
  async getSubscriptionsByAdmin(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);
  
    const subscriptions = await Subscription.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
    const totalSubscriptions = await Subscription.countDocuments(subscriptions);

    res.ok({ subscriptions, totalSubscriptions }, { page, limit, startDate, endDate }
    );
  }


}

export default new SubscriptionController();

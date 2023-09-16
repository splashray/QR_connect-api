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
// import * as moment from "moment-timezone";

const yourBaseURL = process.env.BASE_URL!;

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
      status: "active",
      paidAt: new Date(),
      expiresAt: expirationDate,
    // paypalSubscriptionId
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

    // Create a PayPal subscription payload
    const paypalSubscriptionPayload = {
      plan_id: subscriptionPlan.paypalPlanId, 
      start_time: "2023-09-15T13:30:59+01:00", 
      quantity: "1", 
      shipping_amount: {
        currency_code: "USD",
        value: subscriptionPlan.price.toString(), 
      },
      subscriber: {
        name: {
          given_name: business.firstName,
          surname: business.lastName, 
        },
        email_address: business.email, 
        shipping_address: {
          name: {
            full_name: business.firstName + " " + business.lastName,
          },
          address: {
            address_line_1: "17, Odongunyan", // Replace with the address details
            address_line_2: "must?", // Replace with additional address details
            admin_area_2: "lets see!", // Replace with the city
            admin_area_1: "ikorodu", // Replace with the state or province
            postal_code: "some number", // Replace with the postal code
            country_code: "NG", // Replace with the country code
          },
        },
      },
      application_context: {
        brand_name: "QR Connect", 
        locale: "en-US", 
        shipping_preference: "SET_PROVIDED_ADDRESS",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: `${yourBaseURL}/returnUrl`,
        cancel_url: `${yourBaseURL}/cancelUrl`,
      },
    };

    // Call the createSubscription function from PaypalService
    const result = await PaypalService.createSubscription(paypalSubscriptionPayload);
    if (!result) {
      throw new ServerError("Initiate payment failed", "THIRD_PARTY_API_FAILURE");
    }

    //extract out the link to make payment from the result response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approveLink = result.links.find((link: any) => link.rel === "approve"); 
    console.log("RESULT", result);

    if (approveLink) {
      const approvalUrl = approveLink.href;
      // Redirect the user to the approval URL, which will take them to PayPal for payment approval
      return res.ok({ 
        approvalUrl,
        message: "Subscription link created.",
      });
    }
    
  }

  // // Cancel subscription
  // async cancelSubscription(req: Request, res: Response) {
  //   const businessId = req.loggedInAccount._id;
    
  // }

  // // Activate subscription
  // async activateSubscription(req: Request, res: Response) {
  //   const businessId = req.loggedInAccount._id;
    
  // }

}

export default new SubscriptionController();

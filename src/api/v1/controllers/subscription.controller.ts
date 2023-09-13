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

    // Check if the user already has an active subscription to the free plan
    const existingFreeTrialSubscription = await Subscription.findOne({
      businessId,
      subscriptionPlanId: subscriptionPlan._id,
      status: "active",
    });

    if (existingFreeTrialSubscription) {
      throw new BadRequest(`You are already subscribed to the ${subscriptionPlan.name} Plan`, "INVALID_REQUEST_PARAMETERS");
    }

    // Create a PayPal subscription payload
    const paypalSubscriptionPayload = {
      plan_id: subscriptionPlan.paypalPlanId, // PayPal Plan ID for the selected subscription plan
      start_time: "Date.now()", // Replace with the desired start time
      quantity: "1", // Replace with the desired quantity
      shipping_amount: {
        currency_code: "USD", // Replace with the desired currency code
        value: "10.00", // Replace with the desired shipping amount
        // value: subscriptionPlan.price, // Replace with the desired shipping amount
      },
      subscriber: {
        name: {
          given_name: business.firstName, // Replace with the subscriber's first name
          surname: business.lastName, // Replace with the subscriber's last name
        },
        email_address: business.email, // Replace with the subscriber's email address
        // shipping_address: {
        //   name: {
        //     full_name: business.firstName + " " + business.lastName, // Replace with the full name
        //   },
        //   address: {
        //     address_line_1: "123 Main Street", // Replace with the address details
        //     address_line_2: "Apt 4B", // Replace with additional address details
        //     admin_area_2: "San Jose", // Replace with the city
        //     admin_area_1: "CA", // Replace with the state or province
        //     postal_code: "95131", // Replace with the postal code
        //     country_code: "US", // Replace with the country code
        //   },
        // },
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

    return res.ok({ 
      result,
      message: "Subscription link created.",
    });
  }

  //   authorizationUrl: response.authorization_url,
  
  // Subscription created successfully, you can save the subscription ID in MongoDB
  // const newSubscription = new Subscription({
  //   userId,
  //   subscriptionPlanId,
  //   paypalSubscriptionId: subscription.id,
  //   status: "active", // Set initial status as active
  //   expiresAt: new Date(subscription.current_period_end * 1000), // Convert PayPal timestamp to Date
  // });

  // Update a subscription (e.g., change plan or cancel)
  //   async updateSubscription(req: Request, res: Response) {
  //     try {
  //       // Extract necessary data from the request body
  //       const { userId, subscriptionId, newPlanId, cancelSubscription } = req.body;

  //       // Retrieve the current subscription from MongoDB
  //       const currentSubscription = await Subscription.findById(subscriptionId);

  //       if (!currentSubscription) {
  //         return res.status(404).json({ error: "Subscription not found" });
  //       }

  //       // If cancelSubscription is true, cancel the PayPal subscription
  //       if (cancelSubscription) {
  //         paypal.subscriptions.cancel(userId, currentSubscription.paypalSubscriptionId, (error, canceledSubscription) => {
  //           if (error) {
  //             console.error("PayPal subscription cancellation error:", error);
  //             return res.status(500).json({ error: "Failed to cancel PayPal subscription" });
  //           }

  //           // Update the subscription status in MongoDB
  //           currentSubscription.status = "canceled";
  //           currentSubscription.save()
  //             .then(() => {
  //               res.status(200).json({ message: "Subscription canceled successfully" });
  //             })
  //             .catch((saveError) => {
  //               console.error("Failed to update subscription status in MongoDB:", saveError);
  //               res.status(500).json({ error: "Failed to update subscription status in MongoDB" });
  //             });
  //         });
  //       } else {
  //         // If changing to a new plan, update the PayPal subscription
  //         const updatedPaypalSubscription = {
  //           plan_id: newPlanId, // PayPal Plan ID for the new subscription plan
  //         };

  //         paypal.subscriptions.update(userId, currentSubscription.paypalSubscriptionId, updatedPaypalSubscription, (error, subscription) => {
  //           if (error) {
  //             console.error("PayPal subscription update error:", error);
  //             return res.status(500).json({ error: "Failed to update PayPal subscription" });
  //           }

  //           // Update the subscription plan ID in MongoDB
  //           currentSubscription.subscriptionPlanId = newPlanId;
  //           currentSubscription.save()
  //             .then(() => {
  //               res.status(200).json({ message: "Subscription updated successfully" });
  //             })
  //             .catch((saveError) => {
  //               console.error("Failed to update subscription plan in MongoDB:", saveError);
  //               res.status(500).json({ error: "Failed to update subscription plan in MongoDB" });
  //             });
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Subscription update error:", error);
  //       res.status(500).json({ error: "Internal Server Error" });
  //     }
  //   }

}

export default new SubscriptionController();


// <div id="paypal-button-container-P-17M88242TH834703MMT5ZX6Y"></div>
// <script src="https://www.paypal.com/sdk/js?client-id=AVExF2v6xU8awClSddRaAHKzOIj8ycI8fOerC-pN2tS8OC_nSLBZMSco4otcEKC1Wbszzr2WIpRP5hr-&vault=true&intent=subscription" data-sdk-integration-source="button-factory"></script>
// <script>
//   paypal.Buttons({
//       style: {
//           shape: 'pill',
//           color: 'gold',
//           layout: 'vertical',
//           label: 'subscribe'
//       },
//       createSubscription: function(data, actions) {
//         return actions.subscription.create({
//           /* Creates the subscription */
//           plan_id: 'P-17M88242TH834703MMT5ZX6Y'
//         });
//       },
//       onApprove: function(data, actions) {
//         alert(data.subscriptionID); // You can add optional success message for the subscriber here
//       }
//   }).render('#paypal-button-container-P-17M88242TH834703MMT5ZX6Y'); // Renders the PayPal button
// </script>



// const fetch = require("node-fetch");

// fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions", {
//   method: "POST",
//   headers: {
//     "Authorization": "Bearer A21AAGHr9qtiRRXH4oYcQokQgV99rGqEIfgrr8xHCclP0OzmD9KVgg5ppIIg1jzJgQkV4wd02svIvBJyg6cLFJjFow_SjBhxQ",
//     "Content-Type": "application/json",
//     "Accept": "application/json",
//     "PayPal-Request-Id": "SUBSCRIPTION-21092019-001",
//     "Prefer": "return=representation"
//   },
//   body: JSON.stringify({ 
//     "plan_id": "P-5ML4271244454362WXNWU5NQ", 
//     "start_time": "2018-11-01T00:00:00Z", 
//     "quantity": "20", 
//     "shipping_amount": { 
//       "currency_code": "USD", "value": "10.00" 
//     },
//     "subscriber": { 
//       "name": { "given_name": "John", "surname": "Doe" }, 
//       "email_address": "customer@example.com",
//       "shipping_address": {
//         "name": { "full_name": "John Doe" }, 
//         "address": { 
//           "address_line_1": "2211 N First Street", 
//           "address_line_2": "Building 17", 
//           "admin_area_2": "San Jose", 
//           "admin_area_1": "CA", 
//           "postal_code": "95131", 
//           "country_code": "US" 
//         } 
//       } 
//     }, 
//     "application_context": { 
//       "brand_name": "walmart", 
//       "locale": "en-US", 
//       "shipping_preference": "SET_PROVIDED_ADDRESS", 
//       "user_action": "SUBSCRIBE_NOW", 
//       "payment_method": { 
//         "payer_selected": "PAYPAL", 
//         "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED" 
//       }, 
//       "return_url": "https://example.com/returnUrl", 
//       "cancel_url": "https://example.com/cancelUrl" 
//     } 
//   })
// });

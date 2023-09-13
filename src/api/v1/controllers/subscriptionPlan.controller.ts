import { Request, Response } from "express";
import {
  BadRequest,
  ResourceNotFound,
} from "../../../errors/httpErrors";
import SubscriptionPlan from "../../../db/models/subscriptionPlan.model";
import * as validators from "../validators/subscription.validator"; 

class SubscriptionPlanController {
  //create a new plan on paypal and get the plan id before creating this (e.g -> P-17M88242TH834703MMT5ZX6Y)
  // Create a new subscription plan
  async createSubscriptionPlan(req: Request, res: Response) {
    const { error, data } = validators.createSubscriptionPlanValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const existingSubscriptionPlans = await SubscriptionPlan.findOne({name: data.name});
    if (existingSubscriptionPlans) throw new BadRequest("New plan already created", "INVALID_REQUEST_PARAMETERS");

    const subscriptionPlan = new SubscriptionPlan(data);
    const savedPlan =  await subscriptionPlan.save();
    if (!savedPlan) throw new BadRequest("New plan not created", "INVALID_REQUEST_PARAMETERS");

    res.created({subscriptionPlan: savedPlan, message: "New plan has been created"});
  }

  // Get all subscription plans
  async getSubscriptionPlans(req: Request, res: Response) {
    const subscriptionPlans = await SubscriptionPlan.find();
    if (!subscriptionPlans) {
      throw new ResourceNotFound("subscription Plans are empty.", "RESOURCE_NOT_FOUND");
    } 
    res.ok(subscriptionPlans);
  }

  // Get a subscription plan by ID
  async getSubscriptionPlanById(req: Request, res: Response) {
    const { subscriptionPlanId } = req.params;
    if (!subscriptionPlanId) {
      throw new ResourceNotFound("subscription Plan Id is missing.", "RESOURCE_NOT_FOUND");
    }
    const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!subscriptionPlan) {
      throw new ResourceNotFound("subscription Plan not found.", "RESOURCE_NOT_FOUND");
    } 
    res.ok(subscriptionPlan);
  }

  // Update a subscription plan by ID
  async updateSubscriptionPlan(req: Request, res: Response) {
    const { subscriptionPlanId } = req.params;
    const { error, data } = validators.updateSubscriptionPlanValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code)

    const subscriptionPlan = await SubscriptionPlan.findByIdAndUpdate(
      subscriptionPlanId,
      { ...data},
      { new: true }
    );

    if (!subscriptionPlan) {
      throw new ResourceNotFound("subscription Plan not found.", "RESOURCE_NOT_FOUND");
    } 
    res.ok(subscriptionPlan);
  }

  // Delete a subscription plan by ID
  async deleteSubscriptionPlan(req: Request, res: Response) {
    const { subscriptionPlanId } = req.params;
    if (!subscriptionPlanId) {
      throw new ResourceNotFound("subscription Plan Id is missing.", "RESOURCE_NOT_FOUND");
    }
    const subscriptionPlan = await SubscriptionPlan.findByIdAndDelete(subscriptionPlanId);
    if (!subscriptionPlan) {
      throw new ResourceNotFound("subscription Plan not found.", "RESOURCE_NOT_FOUND");
    } 
    res.noContent();
   
  }
}

export default new SubscriptionPlanController();

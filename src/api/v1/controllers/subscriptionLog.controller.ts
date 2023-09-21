import { Request, Response } from "express";
import SubscriptionLog from "../../../db/models/subscriptionLog.model";
import { ResourceNotFound } from "../../../errors/httpErrors";
import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
  
  type QueryParams = {
    startDate?: Date; 
    endDate?: Date; 
    limit?: string; 
    page?: string; 
  };

class SubscriptionLogController {
// Get all subscription Logs
  async getSubscriptionLogs(req: Request, res: Response){
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const query = SubscriptionLog.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .skip(limit * (page - 1))
      .limit(limit);

    const totalSubscriptionLogs = await SubscriptionLog.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const subscriptionLogs = await query;

    res.ok({ subscriptionLogs, totalSubscriptionLogs }, { page, limit, startDate, endDate });
  }

  // Get a single subscription Log by ID
  async getSubscriptionLogById(req: Request, res: Response) {
    const { id } = req.params;

    const subscriptionPlan = await SubscriptionLog.findById(id);
    if (!subscriptionPlan) {
      throw new ResourceNotFound("Subscription log not found", "RESOURCE_NOT_FOUND");
    }

    res.ok(subscriptionPlan);
  }

}
export default new SubscriptionLogController();

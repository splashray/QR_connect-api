import { Request, Response } from "express";
import Buyer from "../../../db/models/buyer.model";
import Business from "../../../db/models/business.model";
import { ServerError } from "../../../errors/httpErrors";

class ReportController {
  // Get total numbers of Buyers and Businesses
  async getTotalBuyersAndBusinesses(req: Request, res: Response) {
    try {
      // Count total Buyers
      const totalBuyers = await Buyer.countDocuments({
        userType: "Buyer",
        deletedAt: null, // Exclude soft-deleted users
      });

      // Count total Businesses
      const totalBusinesses = await Business.countDocuments({
        userType: "Business",
        deletedAt: null, // Exclude soft-deleted users
      });

      if (totalBuyers === 0 && totalBusinesses === 0) {
        return {
          totalBuyers: 0,
          totalBusinesses: 0,
          message:
            "Total numbers of Buyers and Businesses retrieved successfully",
        };
      }

      // Send response
      res.ok({
        totalBuyers,
        totalBusinesses,
        message:
          "Total numbers of Buyers and Businesses retrieved successfully",
      });
    } catch (error) {
      throw new ServerError(
        "Failed to retrieve user statistics",
        "UNEXPECTED_ERROR"
      );
    }
  }
}

export default new ReportController();

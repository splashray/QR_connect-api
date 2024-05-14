import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import { BadRequest, ResourceNotFound } from "../../../errors/httpErrors";
import Transaction from "../../../db/models/transaction.model";

import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";

type QueryParams = {
  transactionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
  userId?: string;
};

class transactionController {
  async getAllTransactions(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    // Query the database with the constructed filter
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    // Send the response
    res.ok(
      {
        transactions,
      },
      { page, limit, startDate, endDate }
    );
  }

  async getBuyerTransactions(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const accountType = req.loggedInAccount.accountType;
    let buyerId;

    if (accountType === "Admin") {
      buyerId = queryParams.userId;
    } else if (accountType === "Buyer") {
      buyerId = req.loggedInAccount._id;
    }
    if (!buyerId) {
      throw new BadRequest("please provide buyer id", "MISSING_REQUIRED_FIELD");
    }
    const transactions = await Transaction.find({
      buyerId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
    if (transactions.length < 1) {
      throw new ResourceNotFound(
        `Buyer ${buyerId} does not have any transaction`,
        "RESOURCE_NOT_FOUND"
      );
    }
    // Send the response
    res.ok(
      {
        transactions,
      },
      { page, limit, startDate, endDate }
    );
  }

  async getAtransactionById(req: Request, res: Response) {
    const accountType = req.loggedInAccount.accountType;
    const queryParams: QueryParams = req.query;
    const _id = queryParams.transactionId;
    let transaction;
    if (accountType === "Admin") {
      transaction = await Transaction.findOne({ _id });
    } else if (accountType === "Buyer") {
      const buyer = req.loggedInAccount._id;
      transaction = await Transaction.findOne({ _id, buyer });
    }
    if (!transaction) {
      throw new ResourceNotFound(
        `No transaction with id:${_id}`,
        "RESOURCE_NOT_FOUND"
      );
    }
    // Send the response
    res.ok({
      transaction,
    });
  }

  async getUserAmountSpent(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;

    if (!buyerId) {
      throw new BadRequest("please provide buyer id", "MISSING_REQUIRED_FIELD");
    }

    const transactions = await Transaction.find({
      buyerId,
      status: { $in: ["completed"] }, // Filter by status
    });

    // Calculate total amount spent
    let totalAmountSpent = 0;
    if (transactions.length > 1) {
      transactions.forEach((transaction) => {
        totalAmountSpent += Number(transaction.amount);
      });
    }

    res.ok({
      totalAmountSpent,
      message: "Total amount spent retrieved",
    });
  }
}

export default new transactionController();

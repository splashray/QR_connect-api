import { Request, Response } from "express";

import {
  BadRequest,
  ResourceNotFound,
  // Forbidden,
  // Unauthorized,
} from "../../../errors/httpErrors";

import Business from "../../../db/models/business.model";
import BusinessWallet from "../../../db/models/businessWallet.model";
import BusinessTransaction from "../../../db/models/businessTransaction.model";
import BusinessWithdrawal from "../../../db/models/businessWithdrawal.model";

import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
// import { businessFields } from "../../../utils/fieldHelpers";
import * as validators from "../validators/wallet.validator";

type QueryParams = {
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
};

class BusinessController {
  // Get all Businesss wallets by admin
  async getAllBusinesssWallets(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const wallets = await BusinessWallet.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalWallets = await BusinessWallet.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.ok({ wallets, totalWallets }, { page, limit, startDate, endDate });
  }

  // Get all transactions by admin
  async getAllTransactions(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const transactions = await BusinessTransaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalTransactions = await BusinessTransaction.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.ok(
      { transactions, totalTransactions },
      { page, limit, startDate, endDate }
    );
  }

  // Get all withdrawal by admin
  async getAllWithdrawals(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const withdrawals = await BusinessWithdrawal.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalWithdrawals = await BusinessWithdrawal.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.ok(
      { withdrawals, totalWithdrawals },
      { page, limit, startDate, endDate }
    );
  }

  // Get all transactions by business
  async getTransactionsByBusiness(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    // Filter BusinessWithdrawal by businessId
    const transactions = await BusinessTransaction.find({
      businessId: businessId, // Filter by the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalTransactions = await BusinessTransaction.countDocuments({
      businessId: businessId, // Count documents with the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.ok(
      { transactions, totalTransactions },
      { page, limit, startDate, endDate }
    );
  }

  // Get all withdrawals by business
  async getWithdrawalsByBusiness(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    // Filter BusinessWithdrawal by businessId
    const withdrawals = await BusinessWithdrawal.find({
      businessId: businessId, // Filter by the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalWithdrawals = await BusinessWithdrawal.countDocuments({
      businessId: businessId, // Count documents with the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.ok(
      { withdrawals, totalWithdrawals },
      { page, limit, startDate, endDate }
    );
  }

  // Get a Business by ID
  async getBusinessWalletById(req: Request, res: Response) {
    const { businessId } = req.params;
    if (!businessId) {
      throw new ResourceNotFound(
        "BusinessID is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new ResourceNotFound(
        `Business with ID ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    const wallet = await BusinessWallet.findOne({ businessId });
    if (!wallet) {
      throw new ResourceNotFound(
        "Wallet details not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok(wallet);
  }

  // Update/add a wallet details
  async payoutAccount(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    // Prompt the user to submit their PayPal email
    const { error, data } = validators.walletdetails(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { paypalEmail } = data;

    // Update the wallet with the PayPal email
    const wallet = await BusinessWallet.findOneAndUpdate(
      { businessId },
      { paypalEmail, updatedAt: new Date() },
      { new: true }
    );

    if (!wallet) {
      throw new ResourceNotFound("Wallet not found.", "RESOURCE_NOT_FOUND");
    }

    res.ok({
      updated: wallet,
      message: "Business updated successfully.",
    });
  }

  // place a withdrawal
  async placeWithdrawal(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
    if (!businessId) {
      throw new ResourceNotFound(
        "BusinessID is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new ResourceNotFound(
        `Business with ID ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    // Check if business is subscribed
    if (business.subscriptionStatus != "Subscribed") {
      throw new BadRequest(
        "Withdrawal is not allowed due to subscription plan, kindly subscribe.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    const wallet = await BusinessWallet.findOne({ businessId });
    if (!wallet) {
      throw new ResourceNotFound(
        "Wallet details not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    // Check if withdrawal is allowed based on restriction
    if (wallet.restriction) {
      throw new BadRequest(
        "Withdrawal is not allowed due to restriction.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    // Assuming req.body.amount contains the withdrawal amount
    const withdrawalAmount: number = req.body.amount;

    // Check if balance is sufficient for withdrawal
    if (wallet.balance < withdrawalAmount) {
      throw new BadRequest(
        "Insufficient balance for withdrawal.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    // Create withdrawal
    const withdrawal = await BusinessWithdrawal.create({
      businessId,
      withdrawalNo: "WD-" + Math.random().toString(36).substr(2, 9),
      amount: withdrawalAmount,
    });

    // Create transaction for withdrawal
    const withdrawalTransaction = await BusinessTransaction.create({
      businessId,
      withdrawalId: withdrawal._id,
      refNo: withdrawal.withdrawalNo,
      transactionType: "withdrawal",
      amount: withdrawal.amount,
      status: "pending",
    });

    // Update wallet balance
    const updatedBalance = wallet.balance - withdrawalAmount;
    wallet.balance = updatedBalance;
    await wallet.save();

    res.ok({ withdrawal, withdrawalTransaction });
  }

  // restrict an account
  async restrictPayoutAccount(req: Request, res: Response) {
    console.log(req.loggedInAccount);

    const { error, data } = validators.restrictWallet(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { restricted } = data;

    const { businessId } = req.query;
    if (!businessId) {
      throw new ResourceNotFound(
        "BusinessID is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new ResourceNotFound(
        `Business with ID ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    const wallet = await BusinessWallet.findOne({ businessId });
    if (!wallet) {
      throw new ResourceNotFound(
        "Wallet details not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    wallet.restriction = restricted;
    await wallet.save();

    res.ok({
      wallet,
      message: "Wallet restriction status updated successfully.",
    });
  }

  async settleWithdrawal(req: Request, res: Response) {
    const { businessId } = req.query;
    if (!businessId) {
      throw new ResourceNotFound(
        "BusinessID is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new ResourceNotFound(
        `Business with ID ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    const wallet = await BusinessWallet.findOne({ businessId });
    if (!wallet) {
      throw new ResourceNotFound(
        "Wallet details not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    // Assuming req.body.withdrawalId contains the ID of the withdrawal to settle
    const { withdrawalId } = req.query;
    if (!withdrawalId) {
      throw new Error("Withdrawal ID is missing in the request body.");
    }

    // Find the withdrawal by ID
    const withdrawal = await BusinessWithdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new ResourceNotFound(
        `Withdrawal with ID ${withdrawalId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    // Assuming req.body.success contains the settlement status
    const status: string = req.body.status;

    // Validate the status against the enum values
    if (!["pending", "completed", "Failed", "Rejected"].includes(status)) {
      throw new Error("Invalid status provided.");
    }

    // Update withdrawal status
    withdrawal.status = status as
      | "pending"
      | "completed"
      | "Failed"
      | "Rejected";
    await withdrawal.save();
    if (status === "Rejected") {
      // Update wallet balance
      const updatedBalance = wallet.balance + withdrawal.amount;
      wallet.balance = updatedBalance;
      await wallet.save();
    }

    res.ok({ message: "Withdrawal settled successfully." });
  }
}

export default new BusinessController();

import { Request, Response } from "express";

import {
  BadRequest,
  ResourceNotFound,
  Forbidden,
  Unauthorized,
} from "../../../errors/httpErrors";

import Business from "../../../db/models/business.model";
import Order from "../../../db/models/order.model";
import Product from "../../../db/models/product.model";
import bcrypt from "bcrypt";
import { promises as fsPromises } from "fs";
import path from "path";
import { uploadPicture } from "../../../services/file.service";
import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
import { businessFields } from "../../../utils/fieldHelpers";
import * as validators from "../validators/auth.validator";
import moment from "moment";
type QueryParams = {
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
};

class BusinessController {
  // Get all Businesss
  async getBusinesss(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const query = Business.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalBusinesss = await Business.countDocuments(query);

    const mappedBusinesss = await query.select(businessFields.join(" "));

    res.ok(
      { businesses: mappedBusinesss, totalBusinesss },
      { page, limit, startDate, endDate }
    );
  }

  // Get a Business by ID
  async getBusinessById(req: Request, res: Response) {
    const { businessId } = req.params;
    if (!businessId) {
      throw new ResourceNotFound(
        "BusinessID is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const business = await Business.findById(businessId).select(
      businessFields.join(" ")
    );
    if (!business) {
      throw new ResourceNotFound(
        `Business with ID ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok(business);
  }

  // Update a Business by ID
  async updateBusiness(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    const { error, data } = validators.updateBusinessValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const {
      firstName,
      lastName,
      finishTourGuide,
      phoneNumber,
      businessSlogan,
    } = data;

    const business = await Business.findByIdAndUpdate(
      businessId,
      {
        firstName,
        lastName,
        finishTourGuide,
        phoneNumber,
        businessSlogan,
        updatedAt: new Date(),
      },
      { new: true }
    ).select(businessFields.join(" "));

    if (!business) {
      throw new ResourceNotFound(
        `Business ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok({
      updated: business,
      message: "Business updated successfully.",
    });
  }

  // Delete a Business by ID
  async deleteBusiness(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    await Business.findByIdAndUpdate(businessId, {
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    res.noContent();
  }

  //update Business password
  async formBusinessUpdatePassword(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    const { error, data } = validators.changePasswordValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { oldPassword, newPassword } = data;
    const business = await Business.findById(businessId);
    if (!business)
      throw new ResourceNotFound("Business not found", "RESOURCE_NOT_FOUND");

    if (business.authMethod !== "Form") {
      throw new Forbidden(
        "Cannot change password for non-form authentication method.",
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    // Retrieve the hashed password from the user's business account
    const hashedPassword = business.authType?.password;

    // Check if hashedPassword is not undefined before using bcrypt.compareSync
    if (hashedPassword !== undefined) {
      const isPasswordValid = bcrypt.compareSync(oldPassword, hashedPassword);
      if (!isPasswordValid) {
        throw new Unauthorized("Invalid old password.", "INVALID_PASSWORD");
      }
    } else {
      throw new Forbidden(
        "You have no password set; please sign in with a third-party provider, e.g. Google.",
        "ACCESS_DENIED"
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await Business.findByIdAndUpdate(businessId, {
      "authType.password": hash,
      updatedAt: new Date(),
    });

    return res.ok({
      message: "Password successfully changed",
    });
  }

  //update Business dp
  async updateBusinessDp(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
    const profilePicture = req.file; // Access the uploaded file from req

    if (!profilePicture) {
      throw new BadRequest(
        "No profile picture provided.",
        "MISSING_REQUIRED_FIELD"
      );
    }

    const uploadedFile = profilePicture as Express.Multer.File;

    const profilePictureExtension = path.extname(uploadedFile.originalname);
    const profilePictureKey = await uploadPicture(
      uploadedFile.path,
      "business-profile",
      profilePictureExtension
    );
    await fsPromises.unlink(uploadedFile.path);

    const key = `https://qrconnect-data.s3.amazonaws.com/${profilePictureKey}`;
    const business = await Business.findByIdAndUpdate(
      businessId,
      { profilePicture: key, updatedAt: new Date() },
      { new: true }
    ).select(businessFields.join(" "));

    if (!business) {
      throw new ResourceNotFound(
        `Business ${businessId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok({
      updated: business,
      message: "Business picture uploaded successfully.",
    });
  }

  //business Dashbaord
  async getBusinessDashboard(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    // Get all product IDs belonging to this business
    const businessProductIds = await Product.distinct("_id", { businessId });

    // Get date ranges
    const startOfWeek = moment().startOf("week").toDate();
    const endOfWeek = moment().endOf("week").toDate();
    const startOfLastWeek = moment()
      .subtract(1, "week")
      .startOf("week")
      .toDate();
    const endOfLastWeek = moment().subtract(1, "week").endOf("week").toDate();
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();
    const startOfLastMonth = moment()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfLastMonth = moment()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    // Helper function to calculate percentage change
    const getPercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Total Revenue (All-time)
    const totalRevenue = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.businessId": businessId } },
      { $group: { _id: null, totalRevenue: { $sum: "$products.subtotal" } } },
    ]);

    // Total Revenue for Current and Last Month
    const currentMonthRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.businessId": businessId } },
      { $group: { _id: null, totalRevenue: { $sum: "$products.subtotal" } } },
    ]);

    const lastMonthRevenue = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.businessId": businessId } },
      { $group: { _id: null, totalRevenue: { $sum: "$products.subtotal" } } },
    ]);

    const totalRevenueValue = totalRevenue[0]?.totalRevenue || 0;
    const currentMonthRevenueValue = currentMonthRevenue[0]?.totalRevenue || 0;
    const lastMonthRevenueValue = lastMonthRevenue[0]?.totalRevenue || 0;
    const revenueChangePercentage = getPercentageChange(
      currentMonthRevenueValue,
      lastMonthRevenueValue
    );

    // Weekly Revenue for Current and Last Week
    const weeklyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfWeek, $lte: endOfWeek } } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.businessId": businessId } },
      { $group: { _id: null, totalRevenue: { $sum: "$products.subtotal" } } },
    ]);

    const lastWeekRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.businessId": businessId } },
      { $group: { _id: null, totalRevenue: { $sum: "$products.subtotal" } } },
    ]);

    const weeklyRevenueValue = weeklyRevenue[0]?.totalRevenue || 0;
    const lastWeekRevenueValue = lastWeekRevenue[0]?.totalRevenue || 0;
    const weeklyRevenueChange = getPercentageChange(
      weeklyRevenueValue,
      lastWeekRevenueValue
    );

    // Total Orders (Current and Last Month)
    const totalOrders = await Order.countDocuments({
      "products.productId": { $in: businessProductIds },
    });

    const currentMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      "products.productId": { $in: businessProductIds },
    });

    const lastMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      "products.productId": { $in: businessProductIds },
    });

    const ordersChangePercentage = getPercentageChange(
      currentMonthOrders,
      lastMonthOrders
    );

    // Total Customers (Only for this business)
    const totalCustomers = await Order.distinct("buyerId", {
      "products.productId": { $in: businessProductIds },
    }).then((customers) => customers.length);

    // New Customers (Current and Last Month)
    const newCustomers = await Order.distinct("buyerId", {
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      "products.productId": { $in: businessProductIds },
    }).then((customers) => customers.length);

    const lastMonthCustomers = await Order.distinct("buyerId", {
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      "products.productId": { $in: businessProductIds },
    }).then((customers) => customers.length);

    const customersChangePercentage = getPercentageChange(
      newCustomers,
      lastMonthCustomers
    );

    // Total Products
    const totalProducts = await Product.countDocuments({ businessId });

    // Most Sold Products (Only for this business)
    const mostSoldProducts = await Order.aggregate([
      { $unwind: "$products" },
      { $match: { "products.productId": { $in: businessProductIds } } },
      {
        $group: {
          _id: "$products.productId", // Keep productId for later lookup
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: "$productDetails.productName",
          totalSold: 1,
        },
      },
    ]);

    res.ok({
      totalRevenue: parseFloat(totalRevenueValue.toFixed(2)),
      revenueChangePercentage: parseFloat(revenueChangePercentage.toFixed(2)),
      weeklyRevenue: parseFloat(weeklyRevenueValue.toFixed(2)),
      weeklyRevenueChange: parseFloat(weeklyRevenueChange.toFixed(2)),
      totalOrders,
      ordersChangePercentage: parseFloat(ordersChangePercentage.toFixed(2)),
      totalCustomers,
      newCustomers,
      customersChangePercentage: parseFloat(
        customersChangePercentage.toFixed(2)
      ),
      totalProducts,
      mostSoldProducts,
    });
  }
}

export default new BusinessController();

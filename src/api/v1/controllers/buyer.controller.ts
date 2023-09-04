import { Request, Response } from "express";

import {
  BadRequest,
  ResourceNotFound,
  Forbidden,
} from "../../../errors/httpErrors";

import Buyer from "../../../db/models/buyer.model";
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
import { buyerFields } from "../../../utils/fieldHelpers";
import * as validators from "../validators/auth.validator";


type QueryParams = {
  startDate?: Date; 
  endDate?: Date; 
  limit?: string; 
  page?: string; 
};

class BuyerController {
  // Get all Buyers
  async getBuyers(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);
  
    const query = Buyer.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
  
    const totalBuyers = await Buyer.countDocuments(query);
  
    const mappedBuyers = await query.select(buyerFields.join(" "));
  
    res.ok(
      { buyers: mappedBuyers, totalBuyers },
      { page, limit, startDate, endDate }
    );
  }
  

  // Get a Buyer by ID
  async getBuyerById(req: Request, res: Response) {
    const { buyerId } = req.params;
    if (!buyerId) {
      throw new ResourceNotFound("BuyerID is missing.", "RESOURCE_NOT_FOUND");
    }

    const buyer = await Buyer.findById(buyerId).select(buyerFields.join(" "));
    if (!buyer) {
      throw new ResourceNotFound(
        `Buyer with ID ${buyerId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok(buyer);
  }

  // Update a Buyer by ID
  async updateBuyer(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;
    const { firstName, lastName, addressBook, phoneNumber } = req.body;

    const { error } = validators.updateBuyerValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const buyer = await Buyer.findByIdAndUpdate(
      buyerId,
      { firstName, lastName, addressBook, phoneNumber, updatedAt: new Date() },
      { new: true }
    ).select(buyerFields.join(" "));

    if (!buyer) {
      throw new ResourceNotFound(
        `Buyer ${buyerId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok({
      updated: buyer,
      message: "Buyer updated successfully.",
    });
  }

  // Delete a Buyer by ID
  async deleteBuyer(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;

    await Buyer.findByIdAndUpdate(buyerId, {
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    res.noContent();
  }

  //update Buyer password
  async formBuyerUpdatePassword(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;
    const { oldPassword, newPassword } = req.body;

    const { error } = validators.changePasswordValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const buyer = await Buyer.findById(buyerId);
    if (!buyer)
      throw new ResourceNotFound("Buyer not found", "RESOURCE_NOT_FOUND");

    if (buyer.authType.password === undefined) {
      throw new Forbidden(
        "Cannot change password for non-form accounts.",
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, buyer.authType.password);
    if (!isMatch)
      throw new BadRequest(
        "Incorrect old password",
        "INVALID_REQUEST_PARAMETERS"
      );

    const hash = await bcrypt.hash(newPassword, 10);
    await Buyer.findByIdAndUpdate(buyerId, {
      password: hash,
      updatedAt: new Date(),
    });

    return res.ok({
      message: "Password successfully changed",
    });
  }

  //update Buyer dp
  async updateBuyerDp(req: Request, res: Response) {
    const buyerId = req.loggedInAccount._id;
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
      "buyer-profile",
      profilePictureExtension
    );
    await fsPromises.unlink(uploadedFile.path);
  
    const key = `https://qrconnect.s3.amazonaws.com/${profilePictureKey}`;
  
    const buyer = await Buyer.findByIdAndUpdate(
      buyerId,
      { profilePicture: key, updatedAt: new Date() },
      { new: true }
    ).select(buyerFields.join(" "));
  
    if (!buyer) {
      throw new ResourceNotFound(`Buyer ${buyerId} not found.`, "RESOURCE_NOT_FOUND");
    }
  
    res.ok({
      updated: buyer,
      message: "Buyer picture uploaded successfully.",
    });
  }


}

export default new BuyerController();

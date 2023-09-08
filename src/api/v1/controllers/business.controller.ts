import { Request, Response } from "express";

import {
  BadRequest,
  ResourceNotFound,
  Forbidden,
  Unauthorized
} from "../../../errors/httpErrors";

import Business from "../../../db/models/business.model";
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
      throw new ResourceNotFound("BusinessID is missing.", "RESOURCE_NOT_FOUND");
    }

    const business = await Business.findById(businessId).select(businessFields.join(" "));
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
    const { firstName, lastName, finishTourGuide, phoneNumber } = data;

    const business = await Business.findByIdAndUpdate(
      businessId,
      { firstName, lastName, finishTourGuide, phoneNumber, updatedAt: new Date() },
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
      throw new ResourceNotFound(`Business ${businessId} not found.`, "RESOURCE_NOT_FOUND");
    }
  
    res.ok({
      updated: business,
      message: "Business picture uploaded successfully.",
    });
  }


}

export default new BusinessController();

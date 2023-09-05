import { Request, Response } from "express";

import {
  BadRequest,
  ResourceNotFound,
  Forbidden,
  Unauthorized
} from "../../../errors/httpErrors";

import Admin from "../../../db/models/admin.model";
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
import { adminFields } from "../../../utils/fieldHelpers";
import * as validators from "../validators/auth.validator";


type QueryParams = {
  startDate?: Date; 
  endDate?: Date; 
  limit?: string; 
  page?: string; 
};

class AdminController {
  // Get all Admins
  async getAdmins(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);
  
    const query = Admin.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
  
    const totalAdmins = await Admin.countDocuments(query);
  
    const mappedAdmins = await query.select(adminFields.join(" "));
  
    res.ok(
      { buyers: mappedAdmins, totalAdmins },
      { page, limit, startDate, endDate }
    );
  }
  

  // Get a Admin by ID
  async getAdminById(req: Request, res: Response) {
    const { adminId } = req.params;
    if (!adminId) {
      throw new ResourceNotFound("AdminID is missing.", "RESOURCE_NOT_FOUND");
    }

    const admin = await Admin.findById(adminId).select(adminFields.join(" "));
    if (!admin) {
      throw new ResourceNotFound(
        `Admin with ID ${adminId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok(admin);
  }

  // Delete a Admin by ID
  async deleteAdmin(req: Request, res: Response) {
    const adminId = req.loggedInAccount._id;

    await Admin.findByIdAndUpdate(adminId, {
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    res.noContent();
  }

  //update Admin password
  async formAdminUpdatePassword(req: Request, res: Response) {
    const adminId = req.loggedInAccount._id;
    
    const { error, data } = validators.changePasswordValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { oldPassword, newPassword } = data;

    const admin = await Admin.findById(adminId);
    if (!admin)
      throw new ResourceNotFound("Admin not found", "RESOURCE_NOT_FOUND");
    
    // Retrieve the hashed password from the user's admin account
    const hashedPassword = admin.password;

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
    await Admin.findByIdAndUpdate(adminId, {
      password: hash,
      updatedAt: new Date(),
    });

    return res.ok({
      message: "Password successfully changed",
    });
  }

  //update Admin dp
  async updateAdminDp(req: Request, res: Response) {
    const adminId = req.loggedInAccount._id;
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
      "admin-profile",
      profilePictureExtension
    );
    await fsPromises.unlink(uploadedFile.path);
  
    const key = `https://qrconnect-data.s3.amazonaws.com/${profilePictureKey}`;
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { profilePicture: key, updatedAt: new Date() },
      { new: true }
    ).select(adminFields.join(" "));
  
    if (!admin) {
      throw new ResourceNotFound(`Admin ${adminId} not found.`, "RESOURCE_NOT_FOUND");
    }
  
    res.ok({
      updated: admin,
      message: "Admin picture uploaded successfully.",
    });
  }


}

export default new AdminController();

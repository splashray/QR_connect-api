/* eslint-disable no-inner-declarations */
/* eslint-disable prefer-const */
import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import slugify from "slugify";
import _ from "lodash";
import * as moment from "moment-timezone";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";

import {
  BadRequest,
  ResourceNotFound,
  Conflict,
  Unauthorized,
  Forbidden,
} from "../../../errors/httpErrors";
import Admin from "../../../db/models/admin.model";
import Business from "../../../db/models/business.model";
import Buyer from "../../../db/models/buyer.model";
import * as validators from "../validators/auth.validator";
import {
  generateAuthToken,
  verifyRefreshToken,
} from "../../../utils/authHelpers";
import {
  businessFields,
  buyerFields,
  adminFields,
} from "../../../utils/fieldHelpers";
import { generateQRCode } from "../../../utils/qrCodeHelpers";

const PASSWORD_TOKEN_EXPIRY = 10; // 10 minutes

class AuthController {
  //business auth
  async businessFormRegister(req: Request, res: Response) {
    let { firstName, lastName, email, businessName, password, industry } =
      req.body;
    email = email.toLowerCase(); // Convert email to lowercase

    const { error } = validators.createBusinessValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const emailExists = await Business.findOne({ email });
    if (emailExists) {
      console.log(`${email} already exist, change the email.`);
      throw new Conflict(
        `${email} already exist, change the email.`,
        "EXISTING_USER_EMAIL",
      );
    }

    const accountType = "Business";
    const hash = await bcrypt.hash(password, 10);
    // Create a unique slug for the businessName
    const businessSlug = slugify(businessName, { lower: true });
    // Check if the businessSlug already exists
    const existingBusiness = await Business.findOne({ businessSlug });
    if (existingBusiness) {
      throw new Conflict(
        `${businessName} already exists, choose another business name.`,
        "SLUG_UNAVAILABLE",
      );
    }
    // Generate QR code for the businessSlug
    const yourBaseURL = process.env.BASE_URL!;
    const qrCodeData = `${yourBaseURL}?store=${businessSlug}`;
    const qrCodeOptions: qrcode.QRCodeToDataURLOptions = {
      type: "image/png", // Set the type property to 'image/png'
    };
    const qrCodeImageURL = await generateQRCode(qrCodeData, qrCodeOptions);

    const business = await Business.create({
      firstName,
      lastName,
      email,
      businessName,
      businessSlug,
      industry,
      accountType,
      userType: "Business",
      authType: {
        password: hash,
      },
      qrcode: qrCodeImageURL,
    });

    const { accessToken, refreshToken } = await generateAuthToken(
      business,
      accountType,
    );

    const formattedBusiness = _.pick(business, businessFields);

    return res.created({
      business: formattedBusiness,
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Account created successfully",
    });
  }

  async businessFormLogin(req: Request, res: Response) {
    let { email, password } = req.body;
    email = email.toLowerCase(); // Convert email to lowercase
    const { error } = validators.loginValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    // Check if a business with the provided email exists
    const business = await Business.findOne({ email });
    if (!business) {
      throw new BadRequest(
        "Business account not found.",
        "INVALID_REQUEST_PARAMETERS",
      );
    }
    // Check if user account has been deleted
    if (business.deletedAt) {
      throw new Forbidden(
        "Your account is currently deleted. Contact support if this is by mistake.",
        "ACCESS_DENIED",
      );
    }
    if (business.accountType !== "Business") {
      throw new Forbidden(
        "Your account is not a business. Contact support if this is by mistake.",
        "ACCESS_DENIED",
      );
    }

    // Check if user has "value" on password as authType
    if (business.authType.password !== null) {
      throw new Forbidden(
        "You have no password set; please sign in with a third-party provider, e.g. Google.",
        "ACCESS_DENIED",
      );
    }

    // Verify the provided password against the hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      business.authType.password,
    );
    if (!isPasswordValid) {
      throw new Unauthorized("Invalid password.", "INVALID_PASSWORD");
    }

    const { accessToken, refreshToken } = await generateAuthToken(
      business,
      "Business",
    );
    const formattedBusiness = _.pick(business, businessFields);

    return res.ok({
      business: formattedBusiness,
      accessToken,
      refreshToken,
      message: "Logged in successfully",
    });
  }

  //buyer auth
  async buyerFormRegister(req: Request, res: Response) {
    const { firstName, lastName, email, password } = req.body;

    const { error } = validators.createBuyerValidator(req.body);

    if (error) throw new BadRequest(error.message, error.code);

    const emailExists = await Buyer.findOne({ email });
    if (emailExists) {
      console.log(`${email} already exist, change the email.`);
      throw new Conflict(
        `${email} already exist, change the email.`,
        "EXISTING_USER_EMAIL",
      );
    }
    const accountType = "Buyer";
    const hash = await bcrypt.hash(password, 10);

    const buyer = await Buyer.create({
      firstName,
      lastName,
      email,
      accountType,
      userType: "Buyer",
      authType: {
        password: hash,
      },
    });

    const { accessToken, refreshToken } = await generateAuthToken(
      buyer,
      accountType,
    );

    const formattedBuyer = _.pick(buyer, buyerFields);

    return res.created({
      buyer: formattedBuyer,
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Account created successfully",
    });
  }

  async buyerFormLogin(req: Request, res: Response) {
    let { email, password } = req.body;
    email = email.toLowerCase(); // Convert email to lowercase
    const { error } = validators.loginValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    // Check if a buyer with the provided email exists
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      throw new BadRequest(
        "buyer account not found.",
        "INVALID_REQUEST_PARAMETERS",
      );
    }
    // Check if user account has been deleted
    if (buyer.deletedAt) {
      throw new Forbidden(
        "Your account is currently deleted. Contact support if this is by mistake.",
        "ACCESS_DENIED",
      );
    }
    if (buyer.accountType !== "Buyer") {
      throw new Forbidden(
        "Your account is not a buyer. Contact support if this is by mistake.",
        "ACCESS_DENIED",
      );
    }

    // Check if user has "value" on password as authType
    if (buyer.authType.password !== null) {
      throw new Forbidden(
        "You have no password set; please sign in with a third-party provider, e.g. Google.",
        "ACCESS_DENIED",
      );
    }

    // Verify the provided password against the hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      buyer.authType.password,
    );
    if (!isPasswordValid) {
      throw new Unauthorized("Invalid password.", "INVALID_PASSWORD");
    }

    const { accessToken, refreshToken } = await generateAuthToken(
      buyer,
      "Buyer",
    );
    const formattedBuyer = _.pick(buyer, buyerFields);

    return res.ok({
      buyer: formattedBuyer,
      accessToken,
      refreshToken,
      message: "Logged in successfully",
    });
  }

  // admin auth
  async adminRegister(req: Request, res: Response) {
    const { username, email, password } = req.body;

    const { error } = validators.createAdminValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const emailExists = await Admin.findOne({ email });
    if (emailExists) {
      console.log(`${email} already exist, change the email.`);
      throw new Conflict(
        `${email} already exist, change the email.`,
        "EXISTING_USER_EMAIL",
      );
    }
    const accountType = "Admin";
    const hash = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      email,
      password: hash,
      isAdmin: true,
      accountType: "Admin",
    });

    const { accessToken, refreshToken } = await generateAuthToken(
      admin,
      accountType,
    );

    const formattedAdmin = _.pick(admin, adminFields);

    return res.created({
      admin: formattedAdmin,
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Account created successfully",
    });
  }

  async adminLogin(req: Request, res: Response) {
    let { email, password } = req.body;
    email = email.toLowerCase(); // Convert email to lowercase
    const { error } = validators.adminValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    // Check if a admin with the provided email exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new BadRequest(
        "buyer account not found.",
        "INVALID_REQUEST_PARAMETERS",
      );
    }
    // Check if user account has been deleted
    if (admin.deletedAt) {
      throw new Forbidden(
        "Your account is currently deleted. Contact support if this is by mistake.",
        "ACCESS_DENIED",
      );
    }
    if (admin.accountType !== "Admin") {
      throw new Forbidden(
        "Your account is not a admin. Contact support if this is by mistake.",
        "ACCESS_DENIED",
      );
    }

    // Verify the provided password against the hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Unauthorized("Invalid password.", "INVALID_PASSWORD");
    }

    const { accessToken, refreshToken } = await generateAuthToken(
      admin,
      "Admin",
    );
    const formattedAdmin = _.pick(admin, adminFields);

    return res.ok({
      admin: formattedAdmin,
      accessToken,
      refreshToken,
      message: "Logged in successfully",
    });
  }

  // General Reset Password
  async sendTokenToForgetPassword(req: Request, res: Response) {
    let { email, accountType } = req.body;
    email = email.toLowerCase(); // convert to lowercase
    const { error } = validators.resetTokenValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    if (accountType === "Buyer") {
      const buyer = await Buyer.findOne({ email });
      if (!buyer) {
        throw new ResourceNotFound("User not found", "RESOURCE_NOT_FOUND");
      }

      if (buyer.authType.password === undefined) {
        throw new BadRequest(
          "Cannot reset password for non-Form login account, continue with another option",
          "INVALID_REQUEST_PARAMETERS",
        );
      }

      const userTimezone = moment.tz.guess();
      const now = moment.tz(userTimezone);
      const expiry = now.add(PASSWORD_TOKEN_EXPIRY, "minutes").toDate();

      function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }

      buyer.passwordRecovery = {
        passwordRecoveryOtp: generateOTP(),
        passwordRecoveryOtpExpiresAt: expiry,
      };
      await buyer.save();

      // const otp = buyer.passwordRecovery.passwordRecoveryOtp;
      // await resetPasswordEmail(email, buyer.firstName, otp);

      res.ok({ message: `New reset password Otp sent to ${email}` });
    } else if (accountType === "Business") {
      const business = await Business.findOne({ email, userType: accountType });
      if (!business) {
        throw new ResourceNotFound("User not found", "RESOURCE_NOT_FOUND");
      }

      if (business.authType.password === undefined) {
        throw new BadRequest(
          "Cannot reset password for non-Form login account, continue with another option",
          "INVALID_REQUEST_PARAMETERS",
        );
      }

      const userTimezone = moment.tz.guess();
      const now = moment.tz(userTimezone);
      const expiry = now.add(PASSWORD_TOKEN_EXPIRY, "minutes").toDate();
      function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }

      business.passwordRecovery = {
        passwordRecoveryOtp: generateOTP(),
        passwordRecoveryOtpExpiresAt: expiry,
      };

      await business.save();

      // const otp = business.passwordRecovery.passwordRecoveryOtp;
      // await resetPasswordEmail(email, business.firstName, otp);

      res.ok({ message: `New reset password Otp sent to ${email}` });
    } else {
      throw new BadRequest(
        "Invalid account type",
        "INVALID_REQUEST_PARAMETERS",
      );
    }
  }

  async verifyUserOtpResetPassword(req: Request, res: Response) {
    const { otp, accountType } = req.query;
    
    // Cast the req.query object to the expected payload structure
    const verifyTokenPayload = {
      otp: otp as string,
      accountType: accountType as "Buyer" | "Business",
    };

    const { error } = validators.verifyTokenValidator(verifyTokenPayload);
    if (error) throw new BadRequest(error.message, error.code);

    if (accountType === "Buyer") {
      const buyer = await Buyer.findOne({
        "passwordRecovery.passwordRecoveryOtp": otp,
      });
      if (!buyer) {
        throw new Unauthorized("Invalid OTP supplied", "EXPIRED_TOKEN");
      }

      const userTimezone = moment.tz.guess();
      const now = moment.tz(userTimezone);
      const otpExpired = now.isAfter(
        buyer?.passwordRecovery?.passwordRecoveryOtpExpiresAt
      );

      // Handle expired OTP
      if (otpExpired) {
        buyer.passwordRecovery = {
          passwordRecoveryOtp: undefined,
          passwordRecoveryOtpExpiresAt: undefined,
        };
        await buyer.save();
        return res.error(
          400,
          "OTP Expired, request a new one",
          "EXPIRED_TOKEN",
        );
      }

      res.ok({ message: "Otp validated successfully" });
    } else if (accountType === "Business") {
      const business = await Business.findOne({
        "passwordRecovery.passwordRecoveryOtp": otp,
      });
      if (!business) {
        throw new Unauthorized("Invalid OTP supplied", "EXPIRED_TOKEN");
      }

      const userTimezone = moment.tz.guess();
      const now = moment.tz(userTimezone);
      const otpExpired = now.isAfter(
        business?.passwordRecovery?.passwordRecoveryOtpExpiresAt,
      );

      // Handle expired OTP
      if (otpExpired) {
        business.passwordRecovery = {
          passwordRecoveryOtp: undefined,
          passwordRecoveryOtpExpiresAt: undefined,
        };
        await business.save();
        return res.error(
          400,
          "OTP Expired, request a new one",
          "EXPIRED_TOKEN",
        );
      }

      res.ok({ message: "Otp validated successfully" });
    } else {
      throw new BadRequest(
        "Invalid account type",
        "INVALID_REQUEST_PARAMETERS",
      );
    }
  }

  async verifyUserOtpAndChangePassword(req: Request, res: Response) {
    const { otp, newPassword, accountType } = req.body;
  
    const { error } = validators.verifyUserOtpAndChangePasswordValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
  
    if (accountType === "Buyer") {
      const buyer = await Buyer.findOne({
        "passwordRecovery.passwordRecoveryOtp": otp,
        accountType: accountType, // Assuming you have an accountType field in your schema
      });
  
      if (!buyer) throw new BadRequest("Invalid OTP", "INVALID_REQUEST_PARAMETERS");

      const userTimezone = moment.tz.guess();
      const now = moment.tz(userTimezone);      
      const otpExpired = now.isAfter(
        buyer?.passwordRecovery?.passwordRecoveryOtpExpiresAt
      );
  
      // Handle expired OTP
      if (otpExpired) {
        buyer.passwordRecovery = {
          passwordRecoveryOtp: undefined,
          passwordRecoveryOtpExpiresAt: undefined,
        };
        await buyer.save();
        return res.error(400, "OTP Expired, request a new one", "EXPIRED_TOKEN");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        buyer.authType.password = hashedPassword;
        buyer.passwordRecovery = {
          passwordRecoveryOtp: undefined,
          passwordRecoveryOtpExpiresAt: undefined,
        };
        await buyer.save();
        res.ok({ message: "Password changed successfully" });
      }
    } else if (accountType === "Business") {
      const business = await Business.findOne({
        "passwordRecovery.passwordRecoveryOtp": otp,
        accountType: accountType, // Assuming you have an accountType field in your schema
      });
  
      if (!business) throw new BadRequest("Invalid OTP", "INVALID_REQUEST_PARAMETERS");

      const userTimezone = moment.tz.guess();
      const now = moment.tz(userTimezone);      
      const otpExpired = now.isAfter(
        business?.passwordRecovery?.passwordRecoveryOtpExpiresAt
      );
  
      // Handle expired OTP
      if (otpExpired) {
        business.passwordRecovery = {
          passwordRecoveryOtp: undefined,
          passwordRecoveryOtpExpiresAt: undefined,
        };
        await business.save();
        return res.error(400, "OTP Expired, request a new one", "EXPIRED_TOKEN");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        business.authType.password = hashedPassword;
        business.passwordRecovery = {
          passwordRecoveryOtp: undefined,
          passwordRecoveryOtpExpiresAt: undefined,
        };
        await business.save();
        res.ok({ message: "Password changed successfully" });
      }
    }else {
      throw new BadRequest(
        "Invalid account type",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

  }

  //General Refresh Token and Logout for users and Admin
  async refreshToken(req: Request, res: Response) {
    const { refreshToken, accountType } = req.body;
    let payload, accessToken;
    const { error } = validators.tokenValidator(req.body);
    if (error) throw new BadRequest(error.message,  error.code);

    interface result {
      buyerId?: string;
      businessId?: string;
      adminId?: string;
      // ... Other possible properties ...
    }

    // Specify the type of the returned value from verifyRefreshToken
    const result = await verifyRefreshToken(refreshToken, accountType);

    // Cast result to the expected type TokenDetails
    const tokenDetails = result as result;
    if (!tokenDetails) {
      console.log(tokenDetails);
      throw new Unauthorized("Can't validate Refresh token", "INVALID_TOKEN");
    }

    if (accountType === "Buyer") {
      payload = { buyerId: tokenDetails.buyerId };
      accessToken = jwt.sign(payload, process.env.JWT_SEC, {
        expiresIn: "24h",
      });
    } else if (accountType === "Business") {
      payload = { businessId: tokenDetails.businessId };
      accessToken = jwt.sign(payload, process.env.JWT_SEC, {
        expiresIn: "14h",
      });
    } else if (accountType === "Admin") {
      payload = { adminId: tokenDetails.adminId };
      accessToken = jwt.sign(payload, process.env.JWT_SEC, {
        expiresIn: "1h",
      });
    } else {
      throw new Unauthorized("Account type is not valid for refreshing token", "INVALID_TOKEN");
    }
    res.ok({ accessToken, message: `New Access token created successfully for the ${accountType}` });
  }

  async logout(req: Request, res: Response) {
    const { refreshToken, accountType } = req.body;
    const { error } = validators.tokenValidator(req.body);
    if (error) throw new BadRequest(error.message,  error.code);

    if (accountType === "Buyer") {
      const loggedBuyer = await Buyer.findOneAndUpdate(
        { refreshToken: refreshToken },
        { refreshToken: "" },
        { new: true }
      );
  
      if (!loggedBuyer) {
        throw new Unauthorized("You are not logged in", "INVALID_TOKEN");
      }
  
      res.ok({ message: "Logged Out Successfully" });
    } else if (accountType === "Business") {
      const loggedBusiness= await Business.findOneAndUpdate(
        { refreshToken: refreshToken },
        { refreshToken: "" },
        { new: true }
      );
  
      if (!loggedBusiness) {
        throw new Unauthorized("You are not logged in", "INVALID_TOKEN");
      }
  
      res.ok({ message: "Logged Out Successfully" });
    } else if (accountType === "Admin") {
      const loggedAdmin = await Admin.findOneAndUpdate(
        { refreshToken: refreshToken },
        { refreshToken: "" },
        { new: true }
      );
  
      if (!loggedAdmin) {
        throw new Unauthorized("You are not logged in", "INVALID_TOKEN");
      }
  
      res.ok({ message: "Logged Out Successfully" });
    } else {
      throw new Error("Invalid account type provided");
    }

  }



  async loggedInAccount(req: Request, res: Response) {
    const loggedInAccount = req.loggedInAccount;

    let formattedAccount;
    if (loggedInAccount.accountType === "Buyer") {
      formattedAccount = _.pick(loggedInAccount, buyerFields);
    } else if (loggedInAccount.accountType === "Business") {
      formattedAccount = _.pick(loggedInAccount, businessFields);
    } else {
      formattedAccount = _.pick(loggedInAccount, adminFields);
    }

    res.ok({
      loggedInAccount: formattedAccount,
      message: "Current Logged-in Credential retrieved",
    });
  }
}

export default new AuthController();

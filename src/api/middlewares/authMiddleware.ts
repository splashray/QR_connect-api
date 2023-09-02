/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { Unauthorized, Forbidden } from "../../errors/httpErrors";
import jwt from "jsonwebtoken";
import {Admin, IAdmin} from "../../db/models/admin.model";
import {Buyer, IBuyer} from "../../db/models/buyer.model";
import { Business, IBusiness } from "../../db/models/business.model";
import * as dotenv from "dotenv";
dotenv.config();

interface AuthOptions {
  accountType?: string[];
  userType?: string[];
  isAdmin?: boolean;
}

// type AccountType = "Admin" | "Buyer" | "Business";

// type UserType = "Buyer" | "Business";

// type SubscriptionStatus = "Trial" | "Subscribed" | "Deactivated";


type LoggedInAccount = IBusiness | IBuyer| IAdmin;

const auth = (options: AuthOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return next(new Unauthorized("Missing Auth header", "MISSING_AUTH_HEADER"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new Unauthorized("Malformed token", "MALFORMED_TOKEN"));
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SEC) as {
          buyerId?: string;
          businessId?: string;
          adminId?: string;
      };
    } catch (error) {
      throw new Unauthorized("Invalid or Expired Token", "INVALID_TOKEN");
    }

    let loggedInAccount: LoggedInAccount | null = null;
    if (payload.buyerId) {
      loggedInAccount = await Buyer.findById(payload.buyerId);
    } else if (payload.businessId) {
      loggedInAccount = await Business.findById(payload.businessId);
    } else if (payload.adminId) {
      loggedInAccount = await Admin.findById(payload.adminId);
    } else {
      throw new Unauthorized("User with this token no longer exists", "INVALID_TOKEN");
    }
  
    req.loggedInAccount = loggedInAccount!;

    handleAuthOptions(options, loggedInAccount!);

    substituteUserFlag(req, loggedInAccount!);

    protectUserResources(req, loggedInAccount!);

    next();
  };
};

function handleAuthOptions(options: AuthOptions, loggedInAccount:LoggedInAccount) {
  if (options.accountType) {
    if (!Array.isArray(options.accountType)) return;

    const accountTypes = options.accountType.map((accountType) =>
      accountType.toLowerCase()
    );

    if (!accountTypes.includes(loggedInAccount.accountType.toLowerCase())) {
      const message = `${loggedInAccount.accountType} ${loggedInAccount._id} does not have permission to this resource`;
      throw new Forbidden(message, "INSUFFICIENT_PERMISSIONS");
    }
  }

  if (options.userType) {
    if (!Array.isArray(options.userType)) return;

    const userTypes = options.userType.map((userType) => userType.toLowerCase());

    if (!userTypes.includes(loggedInAccount.userType.toLowerCase())) {
      const message = `${loggedInAccount.userType} ${loggedInAccount._id} does not have permission to this resource`;
      throw new Forbidden(message, "INSUFFICIENT_PERMISSIONS");
    }
  }

  if (options.isAdmin) {
    const hasAccess =
      loggedInAccount.isAdmin === true &&
      loggedInAccount.accountType.toLowerCase() === "admin";

    if (!hasAccess) {
      const message = `${loggedInAccount.accountType} ${loggedInAccount._id} does not have permission to this resource`;
      throw new Forbidden(message, "INSUFFICIENT_PERMISSIONS");
    }
  }
}

function substituteUserFlag(req: Request, loggedInAccount: LoggedInAccount) {
  const flag = "me";

  if (!req.originalUrl.includes(`/auth/${flag}`)) return;

  const results = req.path.match(/\/auth\/(\w+)/);

  if (!results) return;
  const paramName = results[1];

  req.params[paramName] = loggedInAccount._id.toString();
}

function protectUserResources(req: Request, loggedInAccount:LoggedInAccount) {
  const results = req.path.match(/\/auth\/(\w+)/);
  if (!results) return;

  const paramName = results[1];

  const canAccess =
    loggedInAccount._id.toString() === req.params[paramName] ||
    loggedInAccount.accountType.toLowerCase() === "admin";

  if (canAccess) return;

  const message = `${loggedInAccount.accountType} ${loggedInAccount._id} doesn't have permission to access User ${req.params[paramName]}`;
  throw new Forbidden(message, "ACCESS_DENIED");
}

export { auth };

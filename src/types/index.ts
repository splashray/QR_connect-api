/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
import { z } from "zod";

import { HttpErrorCode } from "../errors/httpErrors";
import { envSchema } from "../env";

type AccountType = "Admin" | "Buyer" | "Business";

type UserType = "Buyer" | "Business";

type SubscriptionStatus = "Trial" | "Subscribed" | "Deactivated";

interface Buyer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  addressBook: string;
  phoneNumber: string;

  authType: {
    password?: string;
    googleUuid?: string;
  };
  accountType: AccountType;
  userType: UserType;
  profilePicture?: string;
  isAdmin: boolean;
  finishTourGuide: boolean;
  passwordRecovery?: {
    passwordRecoveryOtp?: string;
    passwordRecoveryOtpExpiresAt?: Date;
  };
  refreshToken?: string;
  deletedAt?: Date | null;
}

interface Business {
  _id: string;
  qrcode: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessSlug: string;
  industry: string;

  authType: {
    password?: string;
    googleUuid?: string;
  };
  accountType: AccountType;
  userType: UserType;
  profilePicture?: string;
  isAdmin: boolean;
  finishTourGuide: boolean;
  subscriptionStatus: SubscriptionStatus;
  passwordRecovery?: {
    passwordRecoveryOtp?: string;
    passwordRecoveryOtpExpiresAt?: Date;
  };
  refreshToken?: string;
  deletedAt?: Date | null;
}

interface Admin {
  _id: string;
  username: string;
  email: string;
  password: string;
  accountType: AccountType;
  profilePicture?: string;
  isAdmin: boolean;
  refreshToken?: string;
  deletedAt?: Date | null;
}

declare global {
  namespace Express {
    export interface Response {
      ok(payload: any, meta?: any): Response;
      created(payload: any): Response;
      noContent(): Response;
      error(
        statusCode: number,
        message: string,
        errorCode: HttpErrorCode
      ): Response;
    }
    export interface Request {
      user?: { id: number; email: string };
      loggedInAccount: Business | Buyer | Admin;
    }
  }

  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config();
import Buyer from "../db/models/buyer.model";
import Admin from "../db/models/admin.model";
import Business from "../db/models/business.model";

import jwt from "jsonwebtoken";

import { Unauthorized } from "../errors/httpErrors";

interface AccountDetails {
  _id: string;
}

const generateAuthToken = async (
  accountDetails: AccountDetails,
  accountType: "Buyer" | "Admin" | "Business",
) => {
  try {
    let payload, accessToken, refreshToken, updatedDetails;

    if (accountType === "Buyer") {
      payload = { buyerId: accountDetails._id };
      accessToken = jwt.sign(payload, process.env.JWT_SEC!, {
        expiresIn: "24h",
      });
      refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN!, {
        expiresIn: "7d",
      });

      updatedDetails = await Buyer.findOneAndUpdate(
        { _id: accountDetails._id },
        { refreshToken, updatedAt: new Date() },
        { new: true },
      );
    } else if (accountType === "Admin") {
      payload = { adminId: accountDetails._id };
      accessToken = jwt.sign(payload, process.env.JWT_SEC!, {
        expiresIn: "1h",
      });
      refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN!, {
        expiresIn: "1d",
      });

      updatedDetails = await Admin.findOneAndUpdate(
        { _id: accountDetails._id },
        { refreshToken, updatedAt: new Date() },
        { new: true },
      );
    } else if (accountType === "Business") {
      payload = { businessId: accountDetails._id };
      accessToken = jwt.sign(payload, process.env.JWT_SEC!, {
        expiresIn: "14h",
      });
      refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN!, {
        expiresIn: "7d",
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updatedDetails = await Business.findOneAndUpdate(
        { _id: accountDetails._id },
        { refreshToken, updatedAt: new Date() },
        { new: true },
      );
    } else {
      throw new Error("Invalid type provided");
    }

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new Unauthorized(error.message, "INVALID_TOKEN");
  }
};

// Use to verify the refresh token before refreshing the access token
const verifyRefreshToken = (
  refreshToken: string,
  accountType: "Buyer" | "Admin" | "Business",
) => {
  const privateKey = process.env.REFRESH_TOKEN!;

  return new Promise((resolve, reject) => {
    if (accountType === "Buyer") {
      Buyer.findOne({ refreshToken })
        .then((doc: any) => {
          if (!doc) {
            throw new Error("Invalid refresh token");
          }

          jwt.verify(
            refreshToken,
            privateKey,
            (err: jwt.VerifyErrors | null, tokenDetails: any) => {
              if (err) {
                throw new Error("Invalid refresh token");
              }

              resolve({
                tokenDetails,
                error: false,
                message: "Valid refresh token",
              });
            },
          );
        })
        .catch((error: any) => {
          throw new Error(error.message);
        });
    } else if (accountType === "Admin") {
      Admin.findOne({ refreshToken })
        .then((doc: any) => {
          if (!doc) {
            throw new Error("Invalid refresh token");
          }

          jwt.verify(
            refreshToken,
            privateKey,
            (err: jwt.VerifyErrors | null, tokenDetails: any) => {
              if (err) {
                throw new Error("Invalid refresh token");
              }

              resolve({
                tokenDetails,
                error: false,
                message: "Valid refresh token",
              });
            },
          );
        })
        .catch((error: any) => {
          throw new Error(error.message);
        });
    } else if (accountType === "Business") {
      Business.findOne({ refreshToken })
        .then((doc: any) => {
          if (!doc) {
            throw new Error("Invalid refresh token");
          }

          jwt.verify(
            refreshToken,
            privateKey,
            (err: jwt.VerifyErrors | null, tokenDetails: any) => {
              if (err) {
                throw new Error("Invalid refresh token");
              }

              resolve({
                tokenDetails,
                error: false,
                message: "Valid refresh token",
              });
            },
          );
        })
        .catch((error: any) => {
          throw new Error(error.message);
        });
    } else {
      return reject(new Error("Invalid account type provided"));
    }
  });
};

export { generateAuthToken, verifyRefreshToken };

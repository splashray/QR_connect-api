/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

// eslint-disable-next-line
export const createBuyerValidator = (payload: any) => {
  const schema = z.object({
    firstName: z.string({
      required_error: "First name is required.",
    }),
    lastName: z.string({
      required_error: "Last name is required.",
    }),
    email: z
      .string({
        required_error: "Email is required.",
        invalid_type_error: "Please provide a valid email.",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

// eslint-disable-next-line
export const createBusinessValidator = (payload: any) => {
  const schema = z.object({
    firstName: z.string({
      required_error: "First name is required.",
    }),
    lastName: z.string({
      required_error: "Last name is required.",
    }),
    email: z
      .string({
        required_error: "Email is required.",
        invalid_type_error: "Please provide a valid email.",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
    businessName: z.string({
      required_error: "Business name is required.",
    }),
    industry: z.string({
      required_error: "Industry is required.",
    }),
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

// eslint-disable-next-line
export const loginValidator = (payload: any) => {
  const schema = z.object({
    email: z
      .string({
        required_error: "Email is required.",
        invalid_type_error: "Please provide a valid email.",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

// eslint-disable-next-line
export const createAdminValidator = (payload: any) => {
  const schema = z.object({
    username: z.string({
      required_error: "username is required.",
    }),
    email: z
      .string({
        required_error: "email is required.",
        invalid_type_error: "Please provide a valid email",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string({
        required_error: "email is required",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

// eslint-disable-next-line
export const adminValidator = (payload: any) => {
  const schema = z.object({
    email: z
      .string({
        required_error: "Email is required.",
        invalid_type_error: "Please provide a valid email.",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

export const tokenValidator = (payload: any) => {
  const schema = z.object({
    refreshToken: z.string({
      required_error: "Refresh Token is required.",
    }),
    accountType: z.enum(["Buyer", "Business"], {
      required_error: "Account Type is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};

export const oauthValidator = (payload: any) => {
  const schema = z.object({
    code: z.string({
      required_error: "code is required.",
    }),
    accountType: z.enum(["Buyer", "Business"], {
      required_error: "Account Type is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};

export const resetTokenValidator = (payload: any) => {
  const schema = z.object({
    email: z
      .string({
        required_error: "Email is required.",
        invalid_type_error: "Please provide a valid email.",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
    accountType: z.enum(["Buyer", "Business"], {
      required_error: "Account Type is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};

export const verifyTokenValidator = (payload: any) => {
  const schema = z.object({
    otp: z.string({
      required_error: "Otp is required.",
    }),
    accountType: z.enum(["Buyer", "Business"], {
      required_error: "Account Type is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};


export const verifyUserOtpAndChangePasswordValidator = (
  payload: any
) => {
  const schema = z.object({
    otp: z.string({
      required_error: "Otp is required.",
    }),
    newPassword: z.string({
      required_error: "new Password is required.",
    }),
    accountType: z.enum(["Buyer", "Business"], {
      required_error: "Account Type is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};


export const updateBuyerValidator = (payload: any) => {
  const schema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    addressBook: z.string().optional(),
    phoneNumber: z.string().optional(),
  });

  return validateRequestBody(schema, payload);
};

export const updateBusinessValidator = (payload: any) => {
  const schema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    finishTourGuide: z.boolean().optional(),
    phoneNumber: z.string().optional(),
  });

  return validateRequestBody(schema, payload);
};

export const updateNewBusinessValidator = (payload: any) => {
  const schema = z.object({
    businessName: z.string({
      required_error: "business Name is required.",
    }),
    industry: z.string({
      required_error: "industry is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};



export const changePasswordValidator = (
  payload: any
) => {
  const schema = z.object({
    oldPassword: z.string({
      required_error: "new Password is required.",
    }),
    newPassword: z.string({
      required_error: "new Password is required.",
    }),
  });

  return validateRequestBody(schema, payload);
};

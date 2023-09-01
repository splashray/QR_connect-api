import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

interface CreateBuyerPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

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
interface CreateBusinessPayload {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  industry: string;
  password: string;
}
export const createBusinessValidator = (payload: CreateBusinessPayload) => {
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
interface LoginPayload {
  email: string;
  password: string;
}

export const loginValidator = (payload: LoginPayload) => {
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

interface CreateAdminPayload {
  username: string;
  email: string;
  password: string;
}

export const createAdminValidator = (payload: CreateAdminPayload) => {
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

interface AdminPayload {
  email: string;
  password: string;
}

export const adminValidator = (payload: AdminPayload) => {
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

interface TokenPayload {
  refreshToken: string;
  accountType: "Buyer" | "Business";
}

export const tokenValidator = (payload: TokenPayload) => {
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

interface ResetTokenPayload {
  email: string;
  accountType: "Buyer" | "Business";
}

export const resetTokenValidator = (payload: ResetTokenPayload) => {
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
interface VerifyTokenPayload {
  otp: string;
  accountType: "Buyer" | "Business";
}

export const verifyTokenValidator = (payload: VerifyTokenPayload) => {
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

interface VerifyUserOtpAndChangePasswordPayload {
  otp: string;
  newPassword: string;
  accountType: "Buyer" | "Business";
}

export const verifyUserOtpAndChangePasswordValidator = (
  payload: VerifyUserOtpAndChangePasswordPayload
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

interface UpdateBuyerValidatorPayload {
  firstName: string;
  lastName: string;
  addressBook: string;
  phoneNumber: string;
}

export const updateBuyerValidator = (payload: UpdateBuyerValidatorPayload) => {
  const schema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    addressBook: z.string().optional(),
    phoneNumber: z.string().optional(),
  });

  return validateRequestBody(schema, payload);
};

interface ChangePasswordValidatorPayload {
  oldPassword: string;
  newPassword: string;
}

export const changePasswordValidator = (
  payload: ChangePasswordValidatorPayload
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

// export const createBuyerValidator = (payload: any) => {
//   const schema = z.object({
//     firstName: z.string({
//       required_error: "First name is required.",
//     }),
//     lastName: z.string({
//       required_error: "Last name is required.",
//     }),
//     email: z.string({
//       required_error: "Email is required.",
//       invalid_type_error: "Please provide a valid email.",
//     }),
//     addressBook: z.string().optional(),
//     phoneNumber: z.string().optional(),
//     authType: z.object({
//       password: z.string().optional(),
//       googleUuid: z.string().optional(),
//     }),
//     accountType: z.enum(["Buyer"]),
//     userType: z.enum(["Buyer"]),
//   });

//   return validateRequestBody(schema, payload);
// };

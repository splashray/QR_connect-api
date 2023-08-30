import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

export const createBuyerValidator = (payload: any) => {
  const schema = z.object({
    firstName: z.string({
      required_error: "First name is required.",
    }),
    lastName: z.string({
      required_error: "Last name is required.",
    }),
    email: z.string({
      required_error: "Email is required.",
      invalid_type_error: "Please provide a valid email.",
    }),
    authType: z.object({
      password: z
        .string({
          required_error: "Password is required.",
        })
        .min(8, "Password must be minimum of 8 characters."),
    }),
  });

  return validateRequestBody(schema, payload);
};

export const createBusinessValidator = (payload: any) => {
  const schema = z.object({
    firstName: z.string({
      required_error: "First name is required.",
    }),
    lastName: z.string({
      required_error: "Last name is required.",
    }),
    email: z.string({
      required_error: "Email is required.",
      invalid_type_error: "Please provide a valid email.",
    }),
    businessName: z.string({
      required_error: "business name is required.",
    }),
    industry: z.string({
      required_error: "industry is required.",
    }),
    authType: z.object({
      password: z
        .string({
          required_error: "Password is required.",
        })
        .min(8, "Password must be minimum of 8 characters."),
    }),
  });

  return validateRequestBody(schema, payload);
};

export const loginValidator = (payload: any) => {
  const schema = z.object({
    email: z.string({
      required_error: "Email is required.",
      invalid_type_error: "Please provide a valid email.",
    }),
    authType: z.object({
      password: z
        .string({
          required_error: "Password is required.",
        })
        .min(8, "Password must be minimum of 8 characters."),
    }),
  });

  return validateRequestBody(schema, payload);
};

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
      .email("Please provide a valid email address"),
    password: z
      .string({
        required_error: "email is required",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

export const adminValidator = (payload: any) => {
  const schema = z.object({
    email: z.string({
      required_error: "Email is required.",
      invalid_type_error: "Please provide a valid email.",
    }),
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

export const resetTokenValidator = (payload: any) => {
  const schema = z.object({
    email: z.string({
      required_error: "Email is required.",
      invalid_type_error: "Please provide a valid email.",
    }),
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

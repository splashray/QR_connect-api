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
    addressBook: z.string().optional(),
    phoneNumber: z.string().optional(),
    authType: z.object({
      password: z.string().optional(),
      googleUuid: z.string().optional(),
    }),
    accountType: z.enum(["Buyer"]),
    userType: z.enum(["Buyer"]),
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
      password: z.string(),
    }),
  });

  return validateRequestBody(schema, payload);
};

export const createAdminValidator = (payload: any) => {
  const schema = z.object({
    username: z.string({
      required_error: "Please provide a valid username",
      invalid_type_error: "Please provide a valid username",
    }),
    email: z
      .string({
        required_error: "Please provide a valid email",
        invalid_type_error: "Please provide a valid email",
      })
      .email("Please provide a valid email address"),
    password: z
      .string({
        required_error: "Please provide a valid email",
        invalid_type_error: "Please provide a valid email",
      })
      .min(8, "Password must be minimum of 8 characters."),
  });

  return validateRequestBody(schema, payload);
};

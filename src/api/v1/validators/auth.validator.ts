import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

export const createBuyerValidator = (payload: any) => {
  const schema = z.object(
    {
      firstName: z.string({
        required_error: "First name is required.",
      }),
      lastName: z.string({
        required_error: "Last name is required.",
      }),
      email: z.string({
        required_error: "Email is required.",
        email_format_error: "Please provide a valid email.",
      }),
      addressBook: z.string().optional(),
      phoneNumber: z.string().optional(),
      authType: z.object({
        password: z.string().optional(),
        googleUuid: z.string().optional(),
      }),
      accountType: z.enum(["Buyer"]),
      userType: z.enum(["Buyer"]),
    },
    {
      required_error: "Missing request body",
      invalid_type_error: "Please provide a valid JSON",
      email_format_error: "Please provide a valid email.",
    }
  );

  return validateRequestBody(schema, payload);
};

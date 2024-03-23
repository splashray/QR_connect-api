/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

export const walletdetails = (payload: any) => {
  const schema = z.object({
    paypalEmail: z
      .string({
        required_error: "Email is required.",
        invalid_type_error: "Please provide a valid email.",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
  });

  return validateRequestBody(schema, payload);
};

export const restrictWallet = (payload: any) => {
  const schema = z.object({
    restricted: z.boolean({
      required_error: "restricted is required.",
      invalid_type_error: "Please provide a valid restricted.",
    }),
  });

  return validateRequestBody(schema, payload);
};

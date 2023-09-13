/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

// Define the validation schema for creating a Subscription Plan
export const createSubscriptionPlanValidator = (payload: any) => {
  const schema = z.object({
    name: z.string({
      required_error: "name is required.",
    }),
    price: z.number({
      required_error: "price is required.",
    }),
    duration: z.number({
      required_error: "duration is required.",
    }),
    paypalPlanId: z.string().optional(),
  });

  return validateRequestBody(schema, payload);
};

// Define the validation schema for updating a Subscription Plan
export const updateSubscriptionPlanValidator = (payload: any) => {
  const schema = z.object({
    paypalPlanId: z.string().optional(),
    name: z.string().optional(),
    price: z.number().optional(),
    duration: z.number().optional(),
  });
  
  return validateRequestBody(schema, payload);
};
  

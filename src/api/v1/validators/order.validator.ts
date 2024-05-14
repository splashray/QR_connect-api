/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

// Define the validation schema for creating an order
export const createOrderValidator = (payload: any) => {
  const schema = z.object({
    products: z.array(
      z.object({
        productId: z.string({ required_error: "productId is required." }),
        quantity: z.number({ required_error: "quantity is required." }),
        color: z.string({ required_error: "color is required." }),
        size: z.number({ required_error: "size is required." }),
      })
    ),

    paymentDetails: z.object({
      paymentMethod: z.enum(["Stripe", "Paypal", "Cash"], {
        required_error: "paymentMethod is required.",
      }),
      shippingFee: z.number().optional(),
      tax: z.number().optional(),
    }),

    deliveryDetails: z.object({
      shippingMethod: z.enum(["Door Delivery", "Pick-up Office"], {
        required_error: "shippingMethod is required.",
      }),
      shippingAddress: z.string({
        required_error: "shippingAddress is required.",
      }),
      shippingPhoneNumber: z.string({
        required_error: "shippingPhoneNumber is required.",
      }),
      shippingCityCountry: z.string({
        required_error: "shippingCityCountry is required.",
      }),
    }),
  });

  return validateRequestBody(schema, payload);
};

// Define the validation schema for updating an order
export const updateOrderValidator = (payload: any) => {
  const schema = z.object({
    orderStatus: z
      .enum([
        "Payment Unsuccessful",
        "Out of Stock",
        "Cancelled",
        "Refund",
        "Pending Confirmation",
        "Waiting to be Shipped",
        "Out for Delivery",
        "Shipped",
        "Delivered",
        "Pending Payment",
      ])
      .optional(),

    deliveryDetails: z
      .object({
        shippingMethod: z.enum(["Door Delivery", "Pick-up Office"]).optional(),
        shippingAddress: z.string().optional(),
        shippingPhoneNumber: z.string().optional(),
        shippingCityCountry: z.string().optional(),
        expectedDeliveryStart: z.string().optional(),
        expectedDeliveryEnd: z.string().optional(),
      })
      .optional(),
  });

  return validateRequestBody(schema, payload);
};

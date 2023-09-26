/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

// Define the validation schema for creating a product
export const createProductValidator = (payload: any) => {
  const schema = z.object({
    productName: z.string({
      required_error: "Product name is required.",
    }),
    // productSlug: z.string({
    //   required_error: "Product slug is required.",
    // }),
    // productQrCode: z.string({
    //   required_error: "Product QR code is required.",
    // }),
    // businessId: z.string({
    //   required_error: "Business ID is required.",
    // }),
    productDescription: z.string({
      required_error: "Product description is required.",
    }),
    productCategory: z.string({
      required_error: "Product Category is required.",
    }),
    productAmountInStock: z.number({
      required_error: "Product amount in stock is required.",
    }),
    productPrice: z.number({
      required_error: "Product price is required.",
    }),
    productKeyFeatures: z.string().optional(),
    productSize: z.array(z.string()),
    productColors: z.array(z.string()),
    productKeySpecifications: z.string().optional(),
    productImages: z.array(z.string()),
    productAdditionalInformation: z.string({
      required_error: "Product additional information is required.",
    }),
    productDiscountCode: z.string().optional(),
    productDiscountPercentage: z.number().optional(),
    isAvailable: z.boolean().default(true),
  });

  return validateRequestBody(schema, payload);
};

// Define the validation schema for updating a product
export const updateProductValidator = (payload: any) => {
  const schema = z.object({
    productName: z.string().optional(),
    // productSlug: z.string().optional(),
    // productQrCode: z.string().optional(),
    productDescription: z.string().optional(),
    productAmountInStock: z.number().optional(),
    productCategory: z.string().optional(),
    productPrice: z.number().optional(),
    productKeyFeatures:  z.string().optional(),
    productSize: z.array(z.string()).optional(),
    productColors: z.array(z.string()).optional(),
    productKeySpecifications: z.string().optional(),
    productImages: z.array(z.string()).optional(),
    productAdditionalInformation: z.string().optional(),
    productDiscountCode: z.string().optional(),
    productDiscountPercentage: z.number().optional(),
    isAvailable: z.boolean().optional(),
  });

  return validateRequestBody(schema, payload);
};


// Define the validation schema for updating a product
export const deleteMediaProductValidator = (payload: any) => {
  const schema = z.object({
    productId: z.string({
      required_error: "Product id is required.",
    }),
    imageId: z.string({
      required_error: "image id to be deleted is required.",
    })
  });

  return validateRequestBody(schema, payload);
};
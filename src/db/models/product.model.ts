import mongoose, { Document, Model } from "mongoose";

// Define the interface for the product document
export interface IProduct extends Document {
  businessId: mongoose.Types.ObjectId;
  productName: string;
  productSlug: string;
  productQrCode: string;
  productDescription: string;
  productCategory: string;
  productAmountInStock: number;
  productPrice: number;
  productKeyFeatures: string[];
  productSize: string[];
  productColors: string[];
  productKeySpecifications: string[];
  productImages: string[];
  productAdditionalInformation: string;
  productDiscountCode?: string;
  productDiscountPercentage?: number;
  isAvailable: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define the product schema
const ProductSchema = new mongoose.Schema<IProduct>(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSlug: {
      type: String,
      required: true,
    },
    productQrCode: {
      type: String,
      required: true,
    },

    productDescription: {
      type: String,
      required: true,
    },
    productCategory: {
      type: String,
      required: true,
    },
    productAmountInStock: {
      type: Number,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productKeyFeatures: {
      type: [String],
      required: true,
    },
    productSize: {
      type: [String],
      required: true,
    },
    productColors: {
      type: [String],
      required: true,
    },
    productKeySpecifications: {
      type: [String],
      required: true,
    },
    productImages: {
      type: [String], // Array of strings (URLs or file paths)
      required: true,
    },
    productAdditionalInformation: {
      type: String,
      required: true,
    },
    productDiscountCode: {
      type: String,
    },
    productDiscountPercentage: {
      type: Number,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Define the product model
const ProductModel: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  ProductSchema
);

export default ProductModel;

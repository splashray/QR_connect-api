/* eslint-disable no-constant-condition */
import { Request, Response } from "express";
import qrcode from "qrcode";
import slugify from "slugify";
import { BadRequest, ResourceNotFound } from "../../../errors/httpErrors";
import Product, {IProduct} from "../../../db/models/product.model";
import Business from "../../../db/models/business.model";
import * as validators from "../validators/product.validator"; 
import { generateQRCode, generateRandomString } from "../../../utils/qrCodeHelpers";
import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
import mongoose from "mongoose";
import { promises as fsPromises } from "fs";
import path from "path";
import { uploadPicture, deleteImage, deleteImagesFromAWS } from "../../../services/file.service";

// import  redisClient from "../../../config/redis.config";
// const PRODUCT_CACHE_EXPIRATION = 60 * 60 * 24 * 1; // 1 day

type QueryParams = {
  startDate?: Date; 
  endDate?: Date; 
  limit?: string; 
  page?: string; 
};

class ProductController {
  // Create a new product
  async createProduct(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;

    const { error, data } = validators.createProductValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const {productName } = data;
    // Create a unique slug for the productName
    const baseSlug = slugify(productName, { lower: true });

    let productSlug = baseSlug;
    let slugSuffix = "";

    // Check if the productSlug already exists and keep appending random characters until it's unique
    while (true) {
      const existingProduct = await Product.findOne({ productSlug });
      if (!existingProduct) {
      // Slug is unique, break the loop
        break;
      }

      // Generate a random string
      slugSuffix = generateRandomString();

      // Append the random string to the baseSlug
      productSlug = `${baseSlug}-${slugSuffix}`;
    }
    const business = await Business.findById(businessId);
    const businessSlug = business?.businessSlug;

    // Generate QR code for the businessSlug
    const yourBaseURL = process.env.BASE_URL!;
    const qrCodeData = `${yourBaseURL}/shop/${businessSlug}/product/${productSlug}`;
    const qrCodeOptions: qrcode.QRCodeToDataURLOptions = {
      type: "image/png", // Set the type property to 'image/png'
    };
    const qrCodeImageURL = await generateQRCode(qrCodeData, qrCodeOptions);

    const product = new Product({
      ...data, 
      businessId,
      productSlug,
      productQrCode:qrCodeImageURL
    });
    await product.save();

    res.created(product);
  }

  // Get all products - Admin
  async getProducts(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);
  
    const products = await Product.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
    const totalProducts = await Product.countDocuments(products);

    res.ok({products, totalProducts}, { page, limit, startDate, endDate });
  }

  // Get all products - Business
  async getProductsByBusiness(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
  
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);
  

    // Filter products by businessId
    const products = await Product.find({
      businessId: businessId, // Filter by the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
  
    const totalProducts = await Product.countDocuments({
      businessId: businessId, // Count documents with the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    });
  
    res.ok({ products, totalProducts }, { page, limit, startDate, endDate });
  
  }
  

  // Get all products - General
  async getGeneralBusinessProducts(req: Request, res: Response) {
    const {businessSlug} = req.params;
    const business = await Business.findOne({businessSlug});
    if (!business) {
      throw new ResourceNotFound(
        `No products have been provided in the '${businessSlug}' store yet.`,
        "RESOURCE_NOT_FOUND"
      );
    }
    
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    // Filter products by businessId
    const products = await Product.find({
      businessId: business._id, // Filter by the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(limit * (page - 1));
  
    const totalProducts = await Product.countDocuments({
      businessId: business._id, // Filter by the specific businessId
      createdAt: { $gte: startDate, $lte: endDate },
    });
  
    res.ok({ products, totalProducts }, { page, limit, startDate, endDate });
    
  }

  // Search products - General
  async searchProducts(req: Request, res: Response) {
    const { businessSlug } = req.params;
    if (!businessSlug) {
      throw new ResourceNotFound("Wrong store name... The store you are looking for doesn't exist.", "RESOURCE_NOT_FOUND");
    }
  
    const business = await Business.findOne({ businessSlug });
  
    if (!business) {
      throw new ResourceNotFound(
        `No products have been provided in the '${businessSlug}' store yet.`,
        "RESOURCE_NOT_FOUND"
      );
    }
  
    // Get the businessId of the found business
    const businessId = business._id;
  
    // Get the query parameters and cast them to strings
    const productName: string | undefined = String(req.query.productName);
    const productCategory: string | undefined = String(req.query.productCategory);
  
    // Define the search criteria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchCriteria: any = {
      businessId, // Filter by the specific businessId
    };
  
    // Check if productName parameter is provided
    if (productName) {
      searchCriteria.productName = { $regex: new RegExp(productName, "i") }; // Case-insensitive regex search
    }
  
    // Check if productCategory parameter is provided
    if (productCategory) {
      searchCriteria.productCategory = { $regex: new RegExp(productCategory, "i") }; // Case-insensitive regex search
    }
  
    // Perform the search query
    const searchedProducts = await Product.find(searchCriteria);
  
    // Calculate the total number of searched products
    const totalSearchedProducts = searchedProducts.length;
  
    // Check if no products were found
    if (totalSearchedProducts === 0) {
      return res.ok({ message: "No products found matching the search criteria." });
    }
  
    // Return the search results
    res.ok({ searchedProducts, totalSearchedProducts });
  }
    
  // Get a product by ID
  async getProductById(req: Request, res: Response) {
    const { productId } = req.params;
    if (!productId) {
      throw new ResourceNotFound("Product id is missing.", "RESOURCE_NOT_FOUND");
    }
    const product = await Product.findById(productId);
    if (!product) {
      throw new ResourceNotFound(`Product with ID ${productId} not found.`, "RESOURCE_NOT_FOUND");
    }
    res.ok(product);
  
  }

  // Get a product by productSlug
  async getProductByproductSlug(req: Request, res: Response) {
    const { productSlug } = req.params;
    if (!productSlug) {
      throw new ResourceNotFound("product Slug is missing.", "RESOURCE_NOT_FOUND");
    }
    const product = await Product.findOne({productSlug});
    if (!product) {
      throw new ResourceNotFound(`Product with ${productSlug} not found.`, "RESOURCE_NOT_FOUND");
    }
    res.ok(product);
    
  }

  // Update a product by ID
  async updateProduct(req: Request, res: Response) {
    const { productId, businessId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(businessId as string)) {
      throw new BadRequest("businessId is not a valid ObjectId", "INVALID_REQUEST_PARAMETERS");
    }
    if (!productId || !businessId) {
      throw new ResourceNotFound("Query parameters are missing", "RESOURCE_NOT_FOUND");
    }
    const { error, data } = validators.updateProductValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const product = await Product.findById(productId);

    let productSlug: string | null = product?.productSlug || null;
    let productQrCode: string | null = null;

    console.log("productName !== data.productName", product?.productName, data.productName);
    // Check if the productName has changed
    if (data.productName && product?.productName !== data.productName) {
    // Create a unique slug for the productName
      const baseSlug = slugify(data.productName, { lower: true });
      let slugSuffix = "";

      // Check if the productSlug already exists and keep appending random characters until it's unique
      while (true) {
        const existingProduct = await Product.findOne({ productSlug });
        if (!existingProduct) {
        // Slug is unique, break the loop
          break;
        }

        // Generate a random string
        slugSuffix = generateRandomString();

        // Append the random string to the baseSlug
        productSlug = `${baseSlug}-${slugSuffix}`;
      }
      console.log("productSlug 1", productSlug);
      // Generate QR code for the updated productSlug
      const business = await Business.findById(businessId);
      const businessSlug = business?.businessSlug;
      const yourBaseURL = process.env.BASE_URL!;
      const qrCodeData = `${yourBaseURL}/shop/${businessSlug}/product/${productSlug}`;
      const qrCodeOptions: qrcode.QRCodeToDataURLOptions = {
        type: "image/png", // Set the type property to 'image/png'
      };
      productQrCode = await generateQRCode(qrCodeData, qrCodeOptions);
      console.log("productQrCode 1", productQrCode);
    }

    // Update the data object without assigning productSlug and productQrCode
    const updateData: Partial<IProduct> = {
      ...data,
      businessId: new mongoose.Types.ObjectId(businessId as string),
    };
    console.log("updateData 1", updateData);
    console.log("productSlug 2", productSlug);
    console.log("productQrCode 2", productQrCode);

    // Assign productSlug and productQrCode if they have values
    if (productSlug !== null && productQrCode !== null) {
      updateData.productSlug = productSlug;
      updateData.productQrCode = productQrCode;
      console.log("updateData 2", updateData);
    }

    // Perform the update operation using the updated data object
    const updatedProduct = await Product.findByIdAndUpdate(
      productId, updateData, {
        new: true,
      });

    if (!updatedProduct) {
      throw new BadRequest(`Product with ID ${productId} not updated.`, "INVALID_REQUEST_PARAMETERS");
    }
    res.ok(updatedProduct);
  }

  // Upload Product Images
  async uploadProductImages(req: Request, res: Response) {
    const businessId = req.loggedInAccount._id;
    if (!businessId) {
      throw new ResourceNotFound("Business not found.", "RESOURCE_NOT_FOUND");
    }
    let uploadedImages: Express.Multer.File[] = [];

    if (!req.files) {
      throw new BadRequest(
        "No images provided.",
        "MISSING_REQUIRED_FIELD"
      );
    }

    if (Array.isArray(req.files)) {
      // If req.files is an array, assign it directly
      uploadedImages = req.files as Express.Multer.File[];
    } else {
      // If req.files is an object with fieldnames, extract the files
      uploadedImages = Object.values(req.files as {
        [fieldname: string]: Express.Multer.File[];
      }).reduce((acc, files) => acc.concat(files), []);
    }
  
    if (!uploadedImages || uploadedImages.length === 0) {
      throw new BadRequest(
        "No images provided.",
        "MISSING_REQUIRED_FIELD"
      );
    }

    const uploadedUrls = [];

    for (const uploadedFile of uploadedImages) {
      const  productPictureExtension = path.extname(uploadedFile.originalname);
      const productPictureKey = await uploadPicture(
        uploadedFile.path,
        "Product-images",
        productPictureExtension
      );
      await fsPromises.unlink(uploadedFile.path);

      const key = `https://qrconnect-data.s3.amazonaws.com/${productPictureKey}`;
      uploadedUrls.push(key);
    }

    res.ok({
      message: "Product images uploaded successfully.",
      imageUrls: uploadedUrls,
    });
  }

  // Delete single media
  async deleteSingleMedia(req: Request, res: Response){
    // const {imageId, productId} = req.query;
    // console.log(imageId, productId);
    // if (!mongoose.Types.ObjectId.isValid(productId as string)) {
    //   throw new BadRequest("productId is not a valid ObjectId", "INVALID_REQUEST_PARAMETERS");
    // }
    // if (!productId || !imageId) {
    //   throw new ResourceNotFound("Query parameters are missing", "RESOURCE_NOT_FOUND");
    // }
    
    // Find the product by ID
    // const product = await Product.findById(productId);
    // console.log(product)
    // if (!product) {
    //   throw new BadRequest(`Product with ID ${productId} not found.`, "INVALID_REQUEST_PARAMETERS");
    // }
  
    // // Find the index of the mediaImage with the given imageId
    // const imageIndex = product.productImages.findIndex((img: string) => img === imageId);
    // console.log(imageIndex)
    // if (imageIndex === -1) {
    //   throw new BadRequest(`Image with ${imageId} not found in product.`,"INVALID_REQUEST_PARAMETERS");
    // }
  
    // // Get the image URL (or key) to delete from AWS
    // const imageKey = product.productImages[imageIndex];
    // console.log(imageKey)
    // // Delete the image from AWS (replace with your actual deletion logic)
    // await deleteImage(imageKey);
  
    // // Remove the mediaImage from the product's productImages array
    // product.productImages.splice(imageIndex, 1);
    // console.log(product)
    // // Update the product record in the database
    // const updateProduct = await product.save();

    // if (!updateProduct) {
    //   throw new BadRequest("Product update failed.", "INVALID_REQUEST_PARAMETERS");
    // }
  
    // return res.ok({
    //   product: updateProduct,
    //   message: `Image with ${imageId} deleted successfully`,
    // });
  }


  // Delete a product by ID
  async deleteProduct(req: Request, res: Response) {
    const { productId } = req.params;
    
    if (!productId) {
      throw new ResourceNotFound("Product ID is missing.", "RESOURCE_NOT_FOUND");
    }

    const product: IProduct | null = await Product.findById(productId);

    if (!product) {
      throw new ResourceNotFound(`Product with ID ${productId} not found.`, "RESOURCE_NOT_FOUND");
    }

    // Delete all images associated with the product from AWS
    await deleteImagesFromAWS(product.productImages);

    // Delete the product from the database
    await Product.findByIdAndDelete(productId);

    res.noContent();
  }

}

export default new ProductController();





//Todo: implement redis on the product search.

// Define a function to generate a unique cache key based on the query parameters
//  function generateCacheKey(query: any, businessId: string): string {
//   const cacheKeyParts = [businessId];
//   if (query.productName) {
//     cacheKeyParts.push(query.productName);
//   }
//   if (query.productCategory) {
//     cacheKeyParts.push(query.productCategory);
//   }
//   return cacheKeyParts.join('_');
// }

// async function getCachedSearchResults(cacheKey: string): Promise<any | null> {
//   return new Promise((resolve, reject) => {
//     redisClient.get(cacheKey, (error: any, data: string) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(data ? JSON.parse(data) : null);
//       }
//     }); 
//   });
// }

// async function cacheSearchResults(cacheKey: string, results: any) {
//   await redisClient.set(cacheKey, JSON.stringify(results), 'EX', PRODUCT_CACHE_EXPIRATION);
// }

// Your existing searchProducts controller
// async searchProducts(req: Request, res: Response) {
//   const { businessSlug } = req.params;
//   if (!businessSlug) {
//     throw new ResourceNotFound("Wrong store name... The store you are looking for doesn't exist.", "RESOURCE_NOT_FOUND");
//   }

//   const business = await Business.findOne({ businessSlug });

//   if (!business) {
//     throw new ResourceNotFound(
//       `No products have been provided in the '${businessSlug}' store yet.`,
//       "RESOURCE_NOT_FOUND"
//     );
//   }

//   // Get the businessId of the found business
//   const businessId = business._id;

//   // Get the query parameters and cast them to strings
//   const productName: string | undefined = String(req.query.productName);
//   const productCategory: string | undefined = String(req.query.productCategory);

//   // Define the search criteria
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const searchCriteria: any = {
//     businessId, // Filter by the specific businessId
//   };

//   // Check if productName parameter is provided
//   if (productName) {
//     searchCriteria.productName = { $regex: new RegExp(productName, "i") }; // Case-insensitive regex search
//   }

//   // Check if productCategory parameter is provided
//   if (productCategory) {
//     searchCriteria.productCategory = { $regex: new RegExp(productCategory, "i") }; // Case-insensitive regex search
//   }

//   // Generate a cache key based on the query and businessId
//   const cacheKey = generateCacheKey(req.query, businessId);

//   // Try to get cached search results
//   const cachedResults = await getCachedSearchResults(cacheKey);

//   if (cachedResults) {
//     // If cached results are found, return them
//     res.ok({ searchedProducts: cachedResults, totalSearchedProducts: cachedResults.length, cached: true });
//   } else {
//     // If no cached results are found, perform the search query
//     const searchedProducts = await Product.find(searchCriteria);

//     // Calculate the total number of searched products
//     const totalSearchedProducts = searchedProducts.length;

//     // Check if no products were found
//     if (totalSearchedProducts === 0) {
//       return res.ok({ message: "No products found matching the search criteria." });
//     }

//     // Cache the search results for future use
//     await cacheSearchResults(cacheKey, searchedProducts);

//     // Return the search results
//     res.ok({ searchedProducts, totalSearchedProducts, cached: false });
//   }
// }

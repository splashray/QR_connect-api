import express from "express";
import productController from "../controllers/product.controller";
import { auth } from "../../middlewares/authMiddleware";
import upload from "../../middlewares/multerMiddleware";

const productRouter = express.Router();

// Create a new product
productRouter.post("/", auth({ accountType: ["business"] }), productController.createProduct);

// picture uplaod
productRouter.post("/upload-images", auth({ accountType: ["business"] }), upload.array("images", 3), productController.uploadProductImages);

// Get all products - Admin
productRouter.get("/", auth({ accountType: ["admin"] }), productController.getProducts);

// Get all products - Business
productRouter.get("/business", auth({ accountType: ["business"] }), productController.getProductsByBusiness);

// Get products by search- General
productRouter.get("/search/:businessSlug",  productController.searchProducts);

// Get all products - General
productRouter.get("/store/:businessSlug", productController.getGeneralBusinessProducts);

// Get a product by ID
productRouter.get("/:productId", productController.getProductById);

// Get a product by productSlug
productRouter.get("/slug/:productSlug", productController.getProductByproductSlug);

// Update a product by ID
productRouter.put("/", auth({ accountType: ["business", "admin"] }), productController.updateProduct);

// Delete a product image by ID
productRouter.delete("/single", auth({ accountType: ["admin","business"] }), productController.deleteSingleMedia);

// Delete a product by ID
productRouter.delete("/:productId", auth({ accountType: ["admin","business"] }), productController.deleteProduct);



export default productRouter;


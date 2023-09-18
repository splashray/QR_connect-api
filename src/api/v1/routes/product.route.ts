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

// Delete a product by ID
productRouter.delete("/:productId", auth({ accountType: ["admin","business"] }), productController.deleteProduct);

// Delete a product image by ID
productRouter.delete("/single", auth({ accountType: ["admin","business"] }), productController.deleteSingleMedia);

export default productRouter;

// {
//     "status": "success",
//     "data": {
//         "message": "Product images uploaded successfully.",
//         "imageUrls": [
//             "https://raveboking.s3.amazonaws.com/Product-images/672dccae-3967-47ef-aa69-fb31a76cdae5.jpg",
//             "https://raveboking.s3.amazonaws.com/Product-images/0ab22547-b9d2-412c-9bfb-32759c3b11ba.jpg",
//             "https://raveboking.s3.amazonaws.com/Product-images/818b5518-776a-4980-ac69-8e1e3a057512.jpg"
//         ]
//     }
// }
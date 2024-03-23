import express from "express";
import orderController from "../controllers/order.controller";
import { auth } from "../../middlewares/authMiddleware";

const orderRouter = express.Router();

// Create a new order
orderRouter.post(
  "/paypal",
  auth({ accountType: ["buyer"] }),
  orderController.createOrder
);

export default orderRouter;

import express from "express";
import orderController from "../controllers/order.controller";
import { auth } from "../../middlewares/authMiddleware";

const orderRouter = express.Router();

// Create a new order
orderRouter.post(
  "/stripe",
  auth({ accountType: ["buyer"] }),
  orderController.createOrderStripe
);

// handle payment regeneration link by ID
orderRouter.get(
  "/regenerate",
  auth({ accountType: ["buyer"] }),
  orderController.handlePaymentTrialWithStripe
);

orderRouter.get(
  "/admin",
  auth({ accountType: ["admin"] }),
  orderController.getOrdersByAdmin
);

orderRouter.get(
  "/biz",
  auth({ accountType: ["business"] }),
  orderController.getOrdersByBusiness
);

orderRouter.get(
  "/buyer",
  auth({ accountType: ["buyer"] }),
  orderController.getOrdersByBuyer
);

// Get a order by ID
orderRouter.get(
  "/:id",
  auth({ accountType: ["business", "admin", "buyer"] }),
  orderController.getSingleOrder
);

orderRouter.patch(
  "/:id",
  auth({ accountType: ["business", "admin"] }),
  orderController.updateOrder
);

export default orderRouter;

import express from "express";

import controller from "../controllers/buyer.controller";
import { auth } from "../../middlewares/authMiddleware";
import upload from "../../middlewares/multerMiddleware";

const buyerRouter = express.Router();

//admin route
buyerRouter.get("/",
  auth({ accountType: ["admin"] }),
  controller.getBuyers);

// buyers and admin route
buyerRouter.get("/:buyerId",
  auth({ accountType: ["buyer", "admin"] }),
  controller.getBuyerById);

// buyers route
buyerRouter.put("/", auth({ accountType: ["buyer"] }), controller.updateBuyer);

buyerRouter.patch("/dp", auth({ accountType: ["buyer"] }), upload.single("profilePicture"),  controller.updateBuyerDp);

buyerRouter.patch("/password", auth({ accountType: ["buyer"] }), controller.formBuyerUpdatePassword);

buyerRouter.delete("/", auth({ accountType: ["buyer"] }), controller.deleteBuyer);

export default buyerRouter;

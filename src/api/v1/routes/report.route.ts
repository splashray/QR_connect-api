import express from "express";
import reportController from "../controllers/report.controller";
import { auth } from "../../middlewares/authMiddleware";

const reportRouter = express.Router();

// admin get all buyer/business count
reportRouter.get(
  "/users",
  auth({ accountType: ["admin"] }),
  reportController.getTotalBuyersAndBusinesses
);

export default reportRouter;

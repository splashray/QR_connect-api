import express from "express";
import transactionController from "../controllers/transaction.controller";
import { auth } from "../../middlewares/authMiddleware";

const transactionRouter = express.Router();

// admin get all transactions
transactionRouter.get(
  "/admin",
  auth({ accountType: ["admin"] }),
  transactionController.getAllTransactions
);

// buyer get all transactions
transactionRouter.get(
  "/",
  auth({ accountType: ["buyer", "admin"] }),
  transactionController.getBuyerTransactions
);

//  get a transaction by id
transactionRouter.get(
  "/one",
  auth({ accountType: ["buyer", "admin"] }),
  transactionController.getAtransactionById
);

// user get amount spent
transactionRouter.get(
  "/spent",
  auth({ accountType: ["buyer"] }),
  transactionController.getUserAmountSpent
);

export default transactionRouter;

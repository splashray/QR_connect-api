import express from "express";
import BusinessController from "../controllers/businessWallet.controller";
import { auth } from "../../middlewares/authMiddleware";

const BusinessWalletRouter = express.Router();

// Get all BusinessWallet by admin
BusinessWalletRouter.get(
  "/wallets",
  // auth({ accountType: ["admin"] }),
  BusinessController.getAllBusinesssWallets
);
// Get all transactions by admin
BusinessWalletRouter.get(
  "/transactions",
  // auth({ accountType: ["admin"] }),
  BusinessController.getAllTransactions
);
// Get all withdrawals by admin
BusinessWalletRouter.get(
  "/withdrawals",
  // auth({ accountType: ["admin"] }),
  BusinessController.getAllWithdrawals
);

// Get all transactions by business
BusinessWalletRouter.get(
  "/transactions/biz",
  auth({ accountType: ["business"] }),
  BusinessController.getTransactionsByBusiness
);

// Get all withdrawal by business
BusinessWalletRouter.get(
  "/withdrawals/biz",
  auth({ accountType: ["business"] }),
  BusinessController.getWithdrawalsByBusiness
);

// Get a BusinessWallet by ID
BusinessWalletRouter.get(
  "/:businessId",
  auth({ accountType: ["business", "admin"] }),
  BusinessController.getBusinessWalletById
);

// Update BusinessWallet details
BusinessWalletRouter.patch(
  "/payoutaccount/add",
  auth({ accountType: ["business"] }),
  BusinessController.payoutAccount
);

BusinessWalletRouter.patch(
  "/payoutaccount/restrict",
  // auth({ accountType: ["admin"] }),
  BusinessController.restrictPayoutAccount
);

BusinessWalletRouter.patch(
  "/withdrawal/settle",
  // auth({ accountType: ["admin"] }),
  BusinessController.settleWithdrawal
);

BusinessWalletRouter.post(
  "/wallet/withdrawal",
  auth({ accountType: ["business", "Admin"] }),
  BusinessController.placeWithdrawal
);

export default BusinessWalletRouter;

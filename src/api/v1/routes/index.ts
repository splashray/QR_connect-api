import express from "express";

import controller from "../controllers";
import sharedRouter from "../../shared/routes";
import authRouter from "./auth.route";
import buyerRouter from "./buyer.route";
import businessRouter from "./business.route";
import adminRouter from "./admin.route";
import productRouter from "./product.route";
import orderRouter from "./order.route";
import businessWalletRouter from "./businessWallet.route";
import subscriptionPlanRouter from "./subscriptionPlan.route";
import subscriptionLogRouter from "./subscriptionLog.route";
import subscriptionRouter from "./subscription.route";
import webhookRouter from "./webhook.route";

const router = express.Router();

// Welcome endpoint
router.get("/", controller.welcomeHandler);
router.use("/auth", authRouter);
router.use("/buyers", buyerRouter);
router.use("/business", businessRouter);
router.use("/admins", adminRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/businessWallets", businessWalletRouter);
router.use("/subscriptionPlans", subscriptionPlanRouter);
router.use("/subscriptionLogs", subscriptionLogRouter);
router.use("/subscriptions", subscriptionRouter);
router.use("/webhooks", webhookRouter);

router.use("/", sharedRouter);

export default router;

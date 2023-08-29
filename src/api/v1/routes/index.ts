import express from "express";

import controller from "../controllers";
import sharedRouter from "../../shared/routes";
import adminRouter from "./admin.route";

const router = express.Router();

// Welcome endpoint
router.get("/", controller.welcomeHandler);
router.use("/admins", adminRouter);
router.use("/", sharedRouter);

export default router;

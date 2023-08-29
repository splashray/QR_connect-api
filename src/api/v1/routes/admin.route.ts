import express from "express";

import controller from "../controllers/admin.controller";
// import { requireAuth } from "../../middlewares/authMiddleware";

const router = express.Router();

router.get("/", controller.getLoggedInAdmin);
// router.get("/", requireAuth, controller.getLoggedInAdmin);

// router.get("/teams", requireAuth, controller.getUserTeams);

export default router;

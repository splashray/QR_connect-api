import express from "express";

import controller from "../controllers/admin.controller";
import { auth } from "../../middlewares/authMiddleware";

const router = express.Router();

router.get("/:id",  
  auth({ accountType: ["Admin"] }),
  controller.getAdminById);

router.get("/all",  
  auth({ accountType: ["Admin"] }),
  controller.getAllAdmin);

export default router;

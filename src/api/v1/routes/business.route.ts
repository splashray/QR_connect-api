import express from "express";

import controller from "../controllers/business.controller";
import { auth } from "../../middlewares/authMiddleware";
import upload from "../../middlewares/multerMiddleware";

const businessRouter = express.Router();

//admin route
businessRouter.get("/",
  auth({ accountType: ["admin"] }),
  controller.getBusinesss);

// businesss and admin route
businessRouter.get("/:businessId",
  auth({ accountType: ["business", "admin"] }),
  controller.getBusinessById);

// businesss route
businessRouter.put("/", auth({ accountType: ["business"] }), controller.updateBusiness);

businessRouter.patch("/dp", auth({ accountType: ["business"] }), upload.single("profilePicture"),  controller.updateBusinessDp);

businessRouter.patch("/password", auth({ accountType: ["business"] }), controller.formBusinessUpdatePassword);

businessRouter.delete("/", auth({ accountType: ["business"] }), controller.deleteBusiness);

export default businessRouter;

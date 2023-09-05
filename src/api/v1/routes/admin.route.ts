import express from "express";

import controller from "../controllers/admin.controller";
import { auth } from "../../middlewares/authMiddleware";
import upload from "../../middlewares/multerMiddleware";

const adminRouter = express.Router();

//admin route
adminRouter.get("/",
  auth({ accountType: ["admin"] }),
  controller.getAdmins);

// admins and admin route
adminRouter.get("/:adminId",
  auth({ accountType: ["admin", "admin"] }),
  controller.getAdminById);

adminRouter.patch("/dp", auth({ accountType: ["admin"] }), upload.single("profilePicture"),  controller.updateAdminDp);

adminRouter.patch("/password", auth({ accountType: ["admin"] }), controller.formAdminUpdatePassword);

adminRouter.delete("/", auth({ accountType: ["admin"] }), controller.deleteAdmin);

export default adminRouter;

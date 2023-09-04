import express from "express";

import controller from "../controllers/auth.controller";
import { auth } from "../../middlewares/authMiddleware";

const authRouter = express.Router();

// form Auth buyer
authRouter.post("/buyer/form-register", controller.buyerFormRegister);
authRouter.post("/buyer/form-login", controller.buyerFormLogin);

// form Auth business
authRouter.post("/business/form-register", controller. businessFormRegister);
authRouter.post("/business/form-login", controller. businessFormLogin);

// Google Auth buyer/business
// authRouter.get("/google/getauthurl", controller.getGoogleConsentUrl);
// authRouter.post("/google/callback", controller.googleVerification);

//password reset and regenerate verify email token for users/owners
authRouter.post("/resetpassword/send-token", controller.sendTokenToForgetPassword);
authRouter.post("/resetpassword/verify-token", controller.verifyUserOtpResetPassword);
authRouter.post("/resetpassword/change-password", controller.verifyUserOtpAndChangePassword);


// Auth admin
authRouter.post("/admin/register", controller.adminRegister);
authRouter.post("/admin/login", controller.adminLogin);

//refresh and logout
authRouter.post("/refresh-token", controller.refreshToken);
authRouter.patch("/logout", controller.logout);

// get loggedin user/owner/admin
authRouter.get("/me", auth(), controller.loggedInAccount);

export default authRouter;


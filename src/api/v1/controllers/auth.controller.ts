import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import  _ from "lodash";
import { BadRequest, Conflict } from "../../../errors/httpErrors";
import Admin from "../../../db/models/admin.model";
import Business from "../../../db/models/business.model";
import * as validators from "../validators/auth.validator";
import { generateAuthToken } from "../../../utils/authHelpers";
import { businessFields } from "../../../utils/fieldHelpers";

class AuthController {
  async businessFormRegister(req: Request, res: Response) {

    let { firstName, lastName, email, businessName, password, industry } = req.body;

    const { data, error } = validators.createBusinessValidator(req.body);

    if (error) throw new BadRequest(error.message, error.code);

    const emailExists = await Business.findOne({ email });
    if (emailExists) {
      console.log(`${email} already exist, change the email.`);
      throw new Conflict(
        `${req.body.email} already exist, change the email.`,
        "EXISTING_USER_EMAIL",
      );
    }
    const accountType = "Business";

    const hash = await bcrypt.hash(password, 10);
    const business = await Business.create({
      ...data,
      isAdmin: true,
      accountType,
      userType: "Business",
      authType: {
        password: hash
      },
    });

    const { accessToken, refreshToken } = await generateAuthToken(business, accountType);

    const formattedBusiness = _.pick(business, businessFields);

    return res.created({
      business: formattedBusiness,
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Account created successfully",
    });

  }


}

export default new AuthController();

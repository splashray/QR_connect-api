import { Request, Response } from "express";
import Admin from "../../../db/models/admin.model";
import * as validators from "../validators/auth.validator";
import { BadRequest } from "../../../errors/httpErrors";

class AdminController {
  async getLoggedInAdmin(req: Request, res: Response) {
    const { id } = req.user!;

    const admin = await Admin.findById(id);

    res.ok({ admin });
  }

  async createAdmin(req: Request, res: Response) {
    const { id } = req.user!;

    const { data, error } = validators.createAdminValidator(req.body);

    if (error) throw new BadRequest(error.message, error.code);

    const admin = await Admin.create({
      ...data,
      isAdmin: true,
      accountType: "Admin",
    });

    res.ok({ admin });
  }
}

export default new AdminController();

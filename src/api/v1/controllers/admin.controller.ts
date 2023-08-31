import { Request, Response } from "express";
import Admin from "../../../db/models/admin.model";
// import * as validators from "../validators/auth.validator";
// import { BadRequest } from "../../../errors/httpErrors";

class AdminController {
  async getAdminById(req: Request, res: Response) {
    const { id } = req.params!;
    const admin = await Admin.findById(id);
    res.ok({ admin });
  }

  async getAllAdmin(req: Request, res: Response) {
    const admins = await Admin.find();
    res.ok({ admins });
  }

}

export default new AdminController();

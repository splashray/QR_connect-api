import { Request, Response } from "express";

class IndexController {
  welcomeHandler(req: Request, res: Response) {
    const payload = {
      message: "Welcome to QR Scanner API",
    };

    res.ok(payload);
  }
}

export default new IndexController();

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
import { z } from "zod";

import { HttpErrorCode } from "../errors/httpErrors";
import { envSchema } from "../env";
import { IBusiness } from "../db/models/business.model";
import { IBuyer} from "../db/models/buyer.model";
import { IAdmin } from "../db/models/admin.model";

declare global {
  namespace Express {
    export interface Response {
      ok(payload: any, meta?: any): Response;
      created(payload: any): Response;
      noContent(): Response;
      error(
        statusCode: number,
        message: string,
        errorCode: HttpErrorCode
      ): Response;
    }
    export interface Request {
      user?: { id: number; email: string };
      loggedInAccount: IBusiness | IBuyer | IAdmin;
    }
  }

  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

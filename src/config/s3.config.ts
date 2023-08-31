import { S3 } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3({
  forcePathStyle: false,
  region: process.env.AWS_LOCATIONCONSTRAINT!,
  credentials: {
    accessKeyId: process.env.SPACES_KEY!,
    secretAccessKey: process.env.SPACES_SECRET!,
  },
});

const s3Bucket = process.env.SPACES_S3_BUCKET!;

export { s3Client, s3Bucket };

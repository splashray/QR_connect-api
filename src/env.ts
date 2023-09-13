import { ZodError, z } from "zod";

export const envSchema = z.object({
  PORT: z.string().optional(),
  MONGODB_URI: z.string(),
  BASE_URL: z.string(),
  PAYPAL_ACCESS_TOKEN: z.string(),

  REDIS_URL: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),

  MAILGUN_API_KEY: z.string(),
  MAILGUN_DOMAIN: z.string(),
  MAILGUN_SENDER_EMAIL: z.string().email(),

  GOOGLE_CLIENT_ID :z.string(),
  GOOGLE_CLIENT_SECRET :z.string(),

  JWT_SEC: z.string(),
  REFRESH_TOKEN: z.string(),

  AWS_LOCATIONCONSTRAINT: z.string(),
  SPACES_KEY: z.string(),
  SPACES_SECRET: z.string(),
  SPACES_S3_BUCKET: z.string()
});

try {
  envSchema.parse(process.env);
} catch (error) {
  if (error instanceof ZodError) {
    const missingEnvs = error.errors
      .map((e) => e.path)
      .reduce((acc, v) => acc.concat(v), [])
      .join("\n");

    console.error(`Missing or invalid environment variables: \n${missingEnvs}`);

    process.exit(1);
  }
}

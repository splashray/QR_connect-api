import { ZodError, z } from "zod";

export const envSchema = z.object({
  PORT: z.string().optional(),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  PAYSTACK_SECRET: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  MAILGUN_API_KEY: z.string(),
  MAILGUN_DOMAIN: z.string(),
  MAILGUN_SENDER_EMAIL: z.string().email(),
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

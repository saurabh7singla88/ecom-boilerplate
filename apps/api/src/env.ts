import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  /** Local dev server port. Unused on Lambda. */
  API_PORT: z.coerce.number().int().positive().default(9000),
  /** Set on AWS (SST). When absent, events are dispatched in-process. */
  EVENTS_QUEUE_URL: z.url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

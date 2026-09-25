import { createDb } from "@ecom/db";
import { env } from "../env";

// Created once per process — i.e. once per warm Lambda container. Connects lazily on first query.
export const db = createDb({
  url: env.DATABASE_URL,
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

/**
 * Tests run against a separate database so they never touch dev data:
 * TEST_DATABASE_URL if set, otherwise DATABASE_URL with the database renamed to `<name>_test`.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env["TEST_DATABASE_URL"];
  if (explicit) return explicit;

  const base = process.env["DATABASE_URL"];
  if (!base) throw new Error("Set DATABASE_URL (or TEST_DATABASE_URL) to run API tests");

  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, "")}_test`;
  return url.toString();
}

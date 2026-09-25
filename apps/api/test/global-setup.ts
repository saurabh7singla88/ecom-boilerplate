import { execSync } from "node:child_process";
import pg from "pg";
import { testDatabaseUrl } from "./test-db";

/** Creates the test database if needed and applies all migrations to it. */
export default async function setup() {
  const url = new URL(testDatabaseUrl());
  const database = decodeURIComponent(url.pathname.slice(1));

  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const client = new pg.Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      database,
    ]);
    if (!rowCount) await client.query(`CREATE DATABASE "${database.replaceAll('"', '""')}"`);
  } finally {
    await client.end();
  }

  execSync("pnpm --filter @ecom/db exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: "inherit",
  });
}

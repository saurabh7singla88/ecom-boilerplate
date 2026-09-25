import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./test/test-db.ts";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl(),
    },
    // Test files share one database; run them one at a time.
    fileParallelism: false,
  },
});

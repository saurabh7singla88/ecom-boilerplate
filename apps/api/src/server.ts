import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

/** Local development entry point. On AWS, src/lambda.ts is used instead. */
serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`API ready on http://localhost:${info.port}/api`);
});

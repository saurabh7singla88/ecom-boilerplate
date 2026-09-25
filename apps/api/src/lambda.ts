import { handle } from "hono/aws-lambda";
import { app } from "./app";

/** AWS Lambda entry point (Function URL behind the CloudFront Router). */
export const handler = handle(app);

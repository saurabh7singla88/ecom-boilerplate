import "server-only";
import { createApiClient } from "@ecom/sdk";
import { env } from "./env";

/** Server-side API client. The storefront has no database access; all data comes through here. */
export const api = createApiClient(env.API_URL);

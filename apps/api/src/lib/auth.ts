import { createMiddleware } from "hono/factory";
import { unauthorized } from "./errors";

/**
 * Guards every /api/admin route. Admin sessions arrive with Better Auth in Phase 3;
 * until then every admin request is rejected so nothing is exposed by accident.
 */
export const requireAdmin = createMiddleware(async () => {
  throw unauthorized("Admin authentication is not available yet");
});

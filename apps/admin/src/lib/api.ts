import { createApiClient } from "@ecom/sdk";

/** Same-origin API client: /api is routed to the API by CloudFront (prod) or the Vite proxy (dev). */
export const api = createApiClient(new URL("/api", window.location.origin).toString());

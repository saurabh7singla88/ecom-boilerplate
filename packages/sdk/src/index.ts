import type { AppType } from "@ecom/api";
import type { ApiErrorBody } from "@ecom/shared";
import { hc, type ClientRequestOptions, type ClientResponse } from "hono/client";
import type { SuccessStatusCode } from "hono/utils/http-status";

/**
 * Typed client for the ecom API. Routes and payloads are inferred from apps/api —
 * no codegen. `baseUrl` points at the API root, e.g. "http://localhost:9000/api" or "/api".
 *
 *   const api = createApiClient("/api");
 *   const page = await unwrap(api.store.products.$get({ query: { sort: "newest" } }));
 */
export function createApiClient(baseUrl: string, options?: ClientRequestOptions) {
  return hc<AppType>(baseUrl, options);
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Thrown by `unwrap` for any non-2xx response. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type SuccessBody<R> =
  R extends ClientResponse<infer Body, infer Status, "json">
    ? Status extends SuccessStatusCode
      ? Body
      : never
    : never;

/** Awaits a client call and returns its JSON body, throwing `ApiError` on failure. */
export async function unwrap<R extends ClientResponse<unknown, number, "json">>(
  request: Promise<R>,
): Promise<SuccessBody<R>> {
  const res = await request;
  if (res.ok) return (await res.json()) as SuccessBody<R>;

  const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null;
  throw new ApiError(
    res.status,
    body?.error?.code ?? "unknown_error",
    body?.error?.message ?? `Request failed with status ${res.status}`,
  );
}

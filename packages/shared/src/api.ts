import { z } from "zod";

/** Body of every non-2xx API response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

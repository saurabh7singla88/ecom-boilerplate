import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "./generated/prisma/client";

export * from "./generated/prisma/client";

export type Db = PrismaClient;

export interface CreateDbOptions {
  url: string;
  /** Max pooled connections per process. Keep small on Lambda: each warm container holds its own pool. */
  maxConnections?: number;
  log?: Prisma.LogLevel[];
}

export function createDb({ url, maxConnections = 5, log = ["error"] }: CreateDbOptions): Db {
  const adapter = new PrismaPg({ connectionString: url, max: maxConnections });
  return new PrismaClient({ adapter, log });
}

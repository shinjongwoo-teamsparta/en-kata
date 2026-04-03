import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { env } from "~/env";
import type { DB } from "../../generated/kysely/types";
import { PrismaClient } from "../../generated/prisma";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const createKysely = () =>
  new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: env.DATABASE_URL }),
    }),
  });

const globalForDb = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  kysely: Kysely<DB> | undefined;
};

export const db = globalForDb.prisma ?? createPrismaClient();
export const kysely = globalForDb.kysely ?? createKysely();

if (env.NODE_ENV !== "production") {
  globalForDb.prisma = db;
  globalForDb.kysely = kysely;
}

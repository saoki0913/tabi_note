import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as typeof globalThis & {
  __tabiNoteDbClient?: ReturnType<typeof createClient>;
  __tabiNoteDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const client =
  globalForDb.__tabiNoteDbClient ??
  createClient(
    env.tursoAuthToken
      ? {
          url: env.tursoDatabaseUrl,
          authToken: env.tursoAuthToken,
        }
      : {
          url: env.tursoDatabaseUrl,
        },
  );

if (!globalForDb.__tabiNoteDbClient) {
  globalForDb.__tabiNoteDbClient = client;
}

export const db =
  globalForDb.__tabiNoteDb ?? drizzle(client, { schema, casing: "snake_case" });

if (!globalForDb.__tabiNoteDb) {
  globalForDb.__tabiNoteDb = db;
}

export * as dbSchema from "@/db/schema";

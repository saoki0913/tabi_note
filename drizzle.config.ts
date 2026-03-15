import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? "file:tabi-note-dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default authToken
  ? defineConfig({
      out: "./drizzle",
      schema: "./src/db/schema.ts",
      dialect: "turso",
      dbCredentials: {
        url,
        authToken,
      },
    })
  : defineConfig({
      out: "./drizzle",
      schema: "./src/db/schema.ts",
      dialect: "sqlite",
      dbCredentials: {
        url,
      },
    });

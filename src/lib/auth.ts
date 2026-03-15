import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env, hasGoogleAuthConfig } from "@/lib/env";

export const auth = betterAuth({
  appName: "たびNote",
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: hasGoogleAuthConfig
    ? {
        google: {
          clientId: env.googleClientId!,
          clientSecret: env.googleClientSecret!,
        },
      }
    : {},
  trustedOrigins: [env.appUrl],
  plugins: [nextCookies()],
});

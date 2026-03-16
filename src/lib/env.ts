const stringOrUndefined = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const vercelUrl = stringOrUndefined(process.env.VERCEL_URL);
const deploymentUrl = vercelUrl ? `https://${vercelUrl}` : undefined;
const configuredAppUrl =
  stringOrUndefined(process.env.NEXT_PUBLIC_APP_URL) ??
  stringOrUndefined(process.env.BETTER_AUTH_URL);

export const env = {
  appUrl:
    configuredAppUrl ??
    deploymentUrl ??
    "http://localhost:3000",
  betterAuthSecret:
    stringOrUndefined(process.env.BETTER_AUTH_SECRET) ??
    "tabi-note-dev-secret-please-change-me-32chars",
  betterAuthUrl:
    stringOrUndefined(process.env.BETTER_AUTH_URL) ??
    configuredAppUrl ??
    deploymentUrl ??
    "http://localhost:3000",
  googleClientId: stringOrUndefined(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: stringOrUndefined(process.env.GOOGLE_CLIENT_SECRET),
  tursoDatabaseUrl:
    stringOrUndefined(process.env.TURSO_DATABASE_URL) ?? "file:tabi-note-dev.db",
  tursoAuthToken: stringOrUndefined(process.env.TURSO_AUTH_TOKEN),
  stripeSecretKey: stringOrUndefined(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: stringOrUndefined(process.env.STRIPE_WEBHOOK_SECRET),
  stripeMonthlyPriceId: stringOrUndefined(process.env.STRIPE_MONTHLY_PRICE_ID),
  stripeYearlyPriceId: stringOrUndefined(process.env.STRIPE_YEARLY_PRICE_ID),
  stripePublicKey: stringOrUndefined(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  posthogKey: stringOrUndefined(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  posthogHost:
    stringOrUndefined(process.env.NEXT_PUBLIC_POSTHOG_HOST) ??
    "https://app.posthog.com",
  r2AccountId: stringOrUndefined(process.env.R2_ACCOUNT_ID),
  r2Bucket: stringOrUndefined(process.env.R2_BUCKET),
  r2AccessKeyId: stringOrUndefined(process.env.R2_ACCESS_KEY_ID),
  r2SecretAccessKey: stringOrUndefined(process.env.R2_SECRET_ACCESS_KEY),
  r2PublicBaseUrl: stringOrUndefined(process.env.R2_PUBLIC_BASE_URL),
};

export const hasGoogleAuthConfig = Boolean(
  env.googleClientId && env.googleClientSecret,
);
export const hasStripeConfig = Boolean(env.stripeSecretKey);
export const hasR2Config = Boolean(
  env.r2AccountId &&
    env.r2Bucket &&
    env.r2AccessKeyId &&
    env.r2SecretAccessKey,
);

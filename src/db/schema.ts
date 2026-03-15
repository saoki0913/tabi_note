import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
};

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  ...timestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
  }),
);

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ...timestamps,
});

export const booklets = sqliteTable("booklets", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => user.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  transportText: text("transport_text").notNull().default(""),
  notes: text("notes").notNull().default(""),
  templateType: text("template_type").notNull(),
  formatType: text("format_type").notNull(),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).notNull().default(true),
  aiTone: text("ai_tone").notNull().default("casual"),
  membersJson: text("members_json").notNull(),
  lodgingsJson: text("lodgings_json").notNull(),
  wantItemsJson: text("want_items_json").notNull(),
  dayPlansJson: text("day_plans_json").notNull(),
  aiContentJson: text("ai_content_json"),
  shareToken: text("share_token"),
  coverPreviewKey: text("cover_preview_key"),
  coverPreviewDataUrl: text("cover_preview_data_url"),
  status: text("status").notNull().default("draft"),
  ...timestamps,
});

export const bookletPages = sqliteTable(
  "booklet_pages",
  {
    id: text("id").primaryKey(),
    bookletId: text("booklet_id")
      .notNull()
      .references(() => booklets.id, { onDelete: "cascade" }),
    mode: text("mode").notNull(),
    label: text("label").notNull(),
    day: integer("day"),
    pageNumber: integer("page_number").notNull(),
    totalPages: integer("total_pages").notNull(),
    variantId: text("variant_id"),
    variantName: text("variant_name"),
    mimeType: text("mime_type").notNull(),
    prompt: text("prompt"),
    assetKey: text("asset_key"),
    previewKey: text("preview_key"),
    originalAssetKey: text("original_asset_key"),
    fallbackBase64: text("fallback_base64"),
    editableTextLinesJson: text("editable_text_lines_json"),
    fullModeStyleJson: text("full_mode_style_json"),
    isEdited: integer("is_edited", { mode: "boolean" }).notNull().default(false),
    revision: integer("revision").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    bookletPageIdx: uniqueIndex("booklet_pages_booklet_page_idx").on(
      table.bookletId,
      table.pageNumber,
    ),
  }),
);

export const usageMeters = sqliteTable(
  "usage_meters",
  {
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    monthKey: text("month_key").notNull(),
    generationCount: integer("generation_count").notNull().default(0),
    pageRegenerationCount: integer("page_regeneration_count")
      .notNull()
      .default(0),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.subjectType, table.subjectId, table.monthKey],
    }),
  }),
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("free"),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId] }),
    customerIdx: uniqueIndex("subscriptions_customer_idx").on(
      table.stripeCustomerId,
    ),
    subscriptionIdx: uniqueIndex("subscriptions_subscription_idx").on(
      table.stripeSubscriptionId,
    ),
  }),
);

export const shareLinks = sqliteTable(
  "share_links",
  {
    token: text("token").primaryKey(),
    bookletId: text("booklet_id")
      .notNull()
      .references(() => booklets.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    bookletIdx: uniqueIndex("share_links_booklet_idx").on(table.bookletId),
  }),
);

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  event: text("event").notNull(),
  distinctId: text("distinct_id").notNull(),
  userId: text("user_id"),
  bookletId: text("booklet_id"),
  propertiesJson: text("properties_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

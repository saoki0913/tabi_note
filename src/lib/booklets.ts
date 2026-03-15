import { and, desc, eq } from "drizzle-orm";
import { db, dbSchema } from "@/db";
import { resolveEntitlements } from "@/lib/entitlements";
import { downloadObjectBase64, uploadBase64Object } from "@/lib/r2";
import { getMonthKey } from "@/lib/visitor";
import type {
  AiContent,
  EditableTextLine,
  FullModePageStyle,
  Trip,
  TripDesignPage,
} from "@/types/trip";

type SubjectType = "guest" | "user";

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const asIso = (value: number | Date | null | undefined) => {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
};

const buildPageStorageKey = (tripId: string, pageId: string, kind: "current" | "original") =>
  `booklets/${tripId}/pages/${pageId}/${kind}.png`;

const now = () => new Date();

const hydratePage = async (
  row: typeof dbSchema.bookletPages.$inferSelect,
): Promise<TripDesignPage> => {
  const base64 =
    row.fallbackBase64 ??
    (await downloadObjectBase64(row.assetKey).catch(() => null)) ??
    "";

  return {
    id: row.id,
    mode: row.mode as TripDesignPage["mode"],
    label: row.label,
    day: row.day ?? undefined,
    pageNumber: row.pageNumber,
    totalPages: row.totalPages,
    variantId: row.variantId ?? undefined,
    variantName: row.variantName ?? undefined,
    mimeType: row.mimeType,
    prompt: row.prompt ?? undefined,
    createdAt: asIso(row.createdAt),
    editableTextLines: parseJson<EditableTextLine[]>(
      row.editableTextLinesJson,
      [],
    ),
    fullModeStyle: parseJson<FullModePageStyle>(row.fullModeStyleJson, {}),
    isEdited: row.isEdited,
    assetKey: row.assetKey ?? undefined,
    previewKey: row.previewKey ?? undefined,
    originalAssetKey: row.originalAssetKey ?? undefined,
    revision: row.revision,
    base64,
  };
};

export const saveTripForUser = async (trip: Trip, ownerId: string) => {
  const timestamp = now();
  const firstPage = trip.design?.pages?.[0];
  const coverPreviewDataUrl = firstPage
    ? `data:${firstPage.mimeType};base64,${firstPage.base64}`
    : trip.coverPreviewDataUrl ?? null;

  await db
    .insert(dbSchema.booklets)
    .values({
      id: trip.id,
      ownerId,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      transportText: trip.transportText,
      notes: trip.notes,
      templateType: trip.templateType,
      formatType: trip.formatType,
      aiEnabled: trip.aiEnabled,
      aiTone: trip.aiTone,
      membersJson: JSON.stringify(trip.members),
      lodgingsJson: JSON.stringify(trip.lodgings),
      wantItemsJson: JSON.stringify(trip.wantItems),
      dayPlansJson: JSON.stringify(trip.dayPlans),
      aiContentJson: trip.aiContent ? JSON.stringify(trip.aiContent) : null,
      shareToken: trip.shareToken ?? null,
      coverPreviewDataUrl,
      status: trip.status ?? "draft",
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: dbSchema.booklets.id,
      set: {
        ownerId,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        transportText: trip.transportText,
        notes: trip.notes,
        templateType: trip.templateType,
        formatType: trip.formatType,
        aiEnabled: trip.aiEnabled,
        aiTone: trip.aiTone,
        membersJson: JSON.stringify(trip.members),
        lodgingsJson: JSON.stringify(trip.lodgings),
        wantItemsJson: JSON.stringify(trip.wantItems),
        dayPlansJson: JSON.stringify(trip.dayPlans),
        aiContentJson: trip.aiContent ? JSON.stringify(trip.aiContent) : null,
        shareToken: trip.shareToken ?? null,
        coverPreviewDataUrl,
        status: trip.status ?? "draft",
        updatedAt: timestamp,
      },
    });

  const pages = trip.design?.pages ?? [];
  for (const page of pages) {
    const currentKey =
      page.assetKey ?? buildPageStorageKey(trip.id, page.id, "current");
    const originalKey =
      page.originalAssetKey ?? buildPageStorageKey(trip.id, page.id, "original");

    if (page.base64) {
      await uploadBase64Object({
        key: currentKey,
        base64: page.base64,
        contentType: page.mimeType,
      }).catch(() => null);

      if (!page.originalAssetKey) {
        await uploadBase64Object({
          key: originalKey,
          base64: page.base64,
          contentType: page.mimeType,
        }).catch(() => null);
      }
    }

    await db
      .insert(dbSchema.bookletPages)
      .values({
        id: page.id,
        bookletId: trip.id,
        mode: page.mode,
        label: page.label,
        day: page.day ?? null,
        pageNumber: page.pageNumber,
        totalPages: page.totalPages,
        variantId: page.variantId ?? null,
        variantName: page.variantName ?? null,
        mimeType: page.mimeType,
        prompt: page.prompt ?? null,
        assetKey: currentKey,
        previewKey: page.previewKey ?? currentKey,
        originalAssetKey: originalKey,
        fallbackBase64: page.base64 ?? null,
        editableTextLinesJson: page.editableTextLines
          ? JSON.stringify(page.editableTextLines)
          : null,
        fullModeStyleJson: page.fullModeStyle
          ? JSON.stringify(page.fullModeStyle)
          : null,
        isEdited: page.isEdited ?? false,
        revision: page.revision ?? 0,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: dbSchema.bookletPages.id,
        set: {
          mode: page.mode,
          label: page.label,
          day: page.day ?? null,
          pageNumber: page.pageNumber,
          totalPages: page.totalPages,
          variantId: page.variantId ?? null,
          variantName: page.variantName ?? null,
          mimeType: page.mimeType,
          prompt: page.prompt ?? null,
          assetKey: currentKey,
          previewKey: page.previewKey ?? currentKey,
          originalAssetKey: page.originalAssetKey ?? originalKey,
          fallbackBase64: page.base64 ?? null,
          editableTextLinesJson: page.editableTextLines
            ? JSON.stringify(page.editableTextLines)
            : null,
          fullModeStyleJson: page.fullModeStyle
            ? JSON.stringify(page.fullModeStyle)
            : null,
          isEdited: page.isEdited ?? false,
          revision: page.revision ?? 0,
          updatedAt: timestamp,
        },
      });
  }

  return getTripById(trip.id, ownerId);
};

export const getTripById = async (tripId: string, ownerId?: string | null) => {
  const booklet = await db.query.booklets.findFirst({
    where: ownerId
      ? and(eq(dbSchema.booklets.id, tripId), eq(dbSchema.booklets.ownerId, ownerId))
      : eq(dbSchema.booklets.id, tripId),
  });

  if (!booklet) return null;

  const pages = await db.query.bookletPages.findMany({
    where: eq(dbSchema.bookletPages.bookletId, tripId),
    orderBy: [dbSchema.bookletPages.pageNumber],
  });

  const hydratedPages = await Promise.all(pages.map(hydratePage));

  const trip: Trip = {
    id: booklet.id,
    ownerId: booklet.ownerId,
    title: booklet.title,
    destination: booklet.destination,
    startDate: booklet.startDate,
    endDate: booklet.endDate,
    transportText: booklet.transportText,
    notes: booklet.notes,
    members: parseJson(booklet.membersJson, []),
    lodgings: parseJson(booklet.lodgingsJson, []),
    wantItems: parseJson(booklet.wantItemsJson, []),
    dayPlans: parseJson(booklet.dayPlansJson, []),
    templateType: booklet.templateType as Trip["templateType"],
    formatType: booklet.formatType as Trip["formatType"],
    aiEnabled: booklet.aiEnabled,
    aiTone: booklet.aiTone as Trip["aiTone"],
    aiContent: parseJson<AiContent | undefined>(booklet.aiContentJson, undefined),
    shareToken: booklet.shareToken ?? undefined,
    coverPreviewDataUrl: booklet.coverPreviewDataUrl ?? undefined,
    status: (booklet.status as Trip["status"]) ?? "draft",
    design: {
      style: booklet.templateType as Trip["templateType"],
      format: booklet.formatType as Trip["formatType"],
      renderMode: "full",
      pages: hydratedPages,
      updatedAt: asIso(booklet.updatedAt),
    },
    createdAt: asIso(booklet.createdAt),
    updatedAt: asIso(booklet.updatedAt),
  };

  return trip;
};

export const listTripsForUser = async (ownerId: string) => {
  const booklets = await db.query.booklets.findMany({
    where: eq(dbSchema.booklets.ownerId, ownerId),
    orderBy: [desc(dbSchema.booklets.updatedAt)],
  });

  return booklets.map((booklet) => ({
    id: booklet.id,
    title: booklet.title,
    destination: booklet.destination,
    startDate: booklet.startDate,
    endDate: booklet.endDate,
    templateType: booklet.templateType,
    coverPreviewDataUrl: booklet.coverPreviewDataUrl,
    updatedAt: asIso(booklet.updatedAt),
    shareToken: booklet.shareToken,
  }));
};

export const getTripByShareToken = async (token: string) => {
  const link = await db.query.shareLinks.findFirst({
    where: and(
      eq(dbSchema.shareLinks.token, token),
      eq(dbSchema.shareLinks.isActive, true),
    ),
  });
  if (!link) return null;
  return getTripById(link.bookletId, null);
};

export const ensureShareLink = async ({
  bookletId,
  userId,
}: {
  bookletId: string;
  userId: string;
}) => {
  const existing = await db.query.shareLinks.findFirst({
    where: eq(dbSchema.shareLinks.bookletId, bookletId),
  });
  if (existing) return existing.token;

  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  await db.insert(dbSchema.shareLinks).values({
    token,
    bookletId,
    createdByUserId: userId,
  });
  await db
    .update(dbSchema.booklets)
    .set({
      shareToken: token,
      updatedAt: now(),
      status: "shared",
    })
    .where(eq(dbSchema.booklets.id, bookletId));
  return token;
};

export const getUsageSnapshot = async ({
  subjectType,
  subjectId,
}: {
  subjectType: SubjectType;
  subjectId: string;
}) => {
  const monthKey = getMonthKey();
  const usage = await db.query.usageMeters.findFirst({
    where: and(
      eq(dbSchema.usageMeters.subjectType, subjectType),
      eq(dbSchema.usageMeters.subjectId, subjectId),
      eq(dbSchema.usageMeters.monthKey, monthKey),
    ),
  });
  return {
    monthKey,
    usage,
  };
};

export const bumpUsage = async ({
  subjectType,
  subjectId,
  kind,
}: {
  subjectType: SubjectType;
  subjectId: string;
  kind: "generation" | "page-regeneration";
}) => {
  const { monthKey, usage } = await getUsageSnapshot({ subjectType, subjectId });
  const generationCount =
    kind === "generation"
      ? (usage?.generationCount ?? 0) + 1
      : usage?.generationCount ?? 0;
  const pageRegenerationCount =
    kind === "page-regeneration"
      ? (usage?.pageRegenerationCount ?? 0) + 1
      : usage?.pageRegenerationCount ?? 0;

  await db
    .insert(dbSchema.usageMeters)
    .values({
      subjectType,
      subjectId,
      monthKey,
      generationCount,
      pageRegenerationCount,
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: [
        dbSchema.usageMeters.subjectType,
        dbSchema.usageMeters.subjectId,
        dbSchema.usageMeters.monthKey,
      ],
      set: {
        generationCount,
        pageRegenerationCount,
        updatedAt: now(),
      },
    });

  return {
    generationCount,
    pageRegenerationCount,
  };
};

export const getSubscriptionForUser = async (userId: string) => {
  return (
    (await db.query.subscriptions.findFirst({
      where: eq(dbSchema.subscriptions.userId, userId),
    })) ?? null
  );
};

export const resolveEntitlementsForSubject = async ({
  userId,
  visitorId,
}: {
  userId?: string | null;
  visitorId?: string | null;
}) => {
  const subscription = userId ? await getSubscriptionForUser(userId) : null;
  const subjectType: SubjectType = userId ? "user" : "guest";
  const subjectId = userId ?? visitorId ?? "anonymous";
  const { usage } = await getUsageSnapshot({ subjectType, subjectId });

  return resolveEntitlements({
    generationCount: usage?.generationCount ?? 0,
    subscriptionStatus: subscription?.status,
    isLoggedIn: Boolean(userId),
  });
};

export const upsertSubscription = async ({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  stripePriceId,
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  plan: string;
  status: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) => {
  await db
    .insert(dbSchema.subscriptions)
    .values({
      userId,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
      stripePriceId: stripePriceId ?? null,
      plan,
      status,
      currentPeriodEnd: currentPeriodEnd ?? null,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: dbSchema.subscriptions.userId,
      set: {
        stripeCustomerId: stripeCustomerId ?? null,
        stripeSubscriptionId: stripeSubscriptionId ?? null,
        stripePriceId: stripePriceId ?? null,
        plan,
        status,
        currentPeriodEnd: currentPeriodEnd ?? null,
        cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
        updatedAt: now(),
      },
    });
};

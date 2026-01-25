"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  CheckSquare2,
  ClipboardList,
  Info,
  MapPin,
  Plane,
  StickyNote,
  Users,
} from "lucide-react";
import type {
  DesignMode,
  TemplateType,
  Trip,
  TripDesignImage,
} from "../types/trip";

interface PreviewProps {
  trip: Trip;
}

type Theme = {
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  line: string;
  paper: string;
};

const templateThemes: Record<TemplateType, Theme> = {
  minimal: {
    ink: "#1f2933",
    muted: "#6b7280",
    accent: "#111827",
    accentSoft: "#f3f4f6",
    line: "#d1d5db",
    paper: "#ffffff",
  },
  pop: {
    ink: "#1f2933",
    muted: "#6b7280",
    accent: "#f97316",
    accentSoft: "#ffedd5",
    line: "#fdba74",
    paper: "#fffaf3",
  },
  photo: {
    ink: "#111827",
    muted: "#4b5563",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
    line: "#93c5fd",
    paper: "#f8fafc",
  },
  retro: {
    ink: "#3f2f1e",
    muted: "#7c6a58",
    accent: "#b45309",
    accentSoft: "#fde68a",
    line: "#f59e0b",
    paper: "#fff7ed",
  },
  romantic: {
    ink: "#4b2c38",
    muted: "#9f7a8f",
    accent: "#ec4899",
    accentSoft: "#fde2e8",
    line: "#f9a8d4",
    paper: "#fff5f7",
  },
  modern: {
    ink: "#111827",
    muted: "#6b7280",
    accent: "#1f2937",
    accentSoft: "#e5e7eb",
    line: "#d1d5db",
    paper: "#f9fafb",
  },
  nature: {
    ink: "#1f2d20",
    muted: "#6b7c6e",
    accent: "#15803d",
    accentSoft: "#dcfce7",
    line: "#86efac",
    paper: "#f7fbf5",
  },
  adventure: {
    ink: "#0f2c3f",
    muted: "#5f7b8b",
    accent: "#0ea5e9",
    accentSoft: "#dbeafe",
    line: "#93c5fd",
    paper: "#f0f8ff",
  },
};

const formatDate = (date: string) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`;
};

const buildBackgroundStyle = (
  assetUrl: string | null,
  overlay: string,
  theme: Theme,
): CSSProperties => {
  if (!assetUrl) {
    return { backgroundColor: theme.paper };
  }
  return {
    backgroundColor: theme.paper,
    backgroundImage: `${overlay}, url(${assetUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
};

type PageFrameProps = {
  children: ReactNode;
  backgroundStyle: CSSProperties;
  theme: Theme;
  delay?: number;
  className?: string;
  pageNumber?: number;
  totalPages?: number;
};

const PageFrame = ({
  children,
  backgroundStyle,
  theme,
  delay = 0,
  className,
  pageNumber,
  totalPages,
}: PageFrameProps) => (
  <motion.section
    className={`relative mx-auto w-full max-w-4xl aspect-[210/297] overflow-hidden rounded-[28px] border-[2px] shadow-[0_18px_45px_rgba(27,26,23,0.15)] ${
      className ?? ""
    }`}
    style={{ ...backgroundStyle, borderColor: theme.line }}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
  >
    <div className="relative z-10 flex h-full flex-col p-8 md:p-12">
      {children}
    </div>
    {pageNumber && totalPages ? (
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs z-10"
        style={{ color: theme.muted }}
      >
        {pageNumber}/{totalPages}
      </div>
    ) : null}
  </motion.section>
);

type HeaderProps = {
  title: string;
  subtitle?: string;
  icon: typeof BookOpen;
  theme: Theme;
};

const PageHeader = ({ title, subtitle, icon: Icon, theme }: HeaderProps) => (
  <div className="flex items-start justify-between gap-6">
    <div>
      <p
        className="text-xs uppercase tracking-[0.4em]"
        style={{ color: theme.accent }}
      >
        TRAVEL NOTES
      </p>
      <h2
        className="mt-3 text-3xl md:text-4xl font-semibold"
        style={{ color: theme.ink }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm" style={{ color: theme.muted }}>
          {subtitle}
        </p>
      )}
    </div>
    <div
      className="rounded-full border-2 p-3"
      style={{ borderColor: theme.line, color: theme.accent }}
    >
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

export function TripPreview({ trip }: PreviewProps) {
  const theme = templateThemes[trip.templateType];
  const renderMode = trip.design?.renderMode ?? "full";
  const sortedPages = trip.design?.pages?.length
    ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
    : null;
  const fullPages = renderMode === "full" ? sortedPages : null;
  const backgroundPages = renderMode === "background" ? sortedPages : null;

  const assetUrl = (mode: DesignMode) => {
    const legacyDesign = trip.design as
      | (Trip["design"] & {
          cover?: TripDesignImage;
          page?: TripDesignImage;
        })
      | undefined;
    const asset = legacyDesign?.assets?.[mode];
    const legacyAsset =
      asset || !legacyDesign
        ? null
        : mode === "cover"
          ? legacyDesign.cover
          : legacyDesign.page;
    const resolvedAsset = asset ?? legacyAsset;
    if (!resolvedAsset?.base64) return null;
    return `data:${resolvedAsset.mimeType};base64,${resolvedAsset.base64}`;
  };

  const resolveBackgroundUrl = (mode: DesignMode, day?: number) => {
    if (backgroundPages) {
      if (typeof day === "number") {
        const dayMatch = backgroundPages.find(
          (page) => page.mode === mode && page.day === day,
        );
        if (dayMatch) {
          return `data:${dayMatch.mimeType};base64,${dayMatch.base64}`;
        }
      }
      const fallback = backgroundPages.find((page) => page.mode === mode);
      if (fallback) {
        return `data:${fallback.mimeType};base64,${fallback.base64}`;
      }
    }
    return assetUrl(mode);
  };

  if (fullPages) {
    return (
      <div className="space-y-12">
        {fullPages.map((page) => (
          <motion.section
            key={page.id}
            className="relative mx-auto w-full max-w-4xl aspect-[210/297] overflow-hidden rounded-[28px] shadow-[0_18px_45px_rgba(27,26,23,0.15)] border border-[var(--line)] bg-white/80"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={`data:${page.mimeType};base64,${page.base64}`}
              alt={`${trip.title} ${page.label}`}
              className="h-full w-full object-contain"
            />
          </motion.section>
        ))}
      </div>
    );
  }

  const coverStyle = buildBackgroundStyle(
    resolveBackgroundUrl("cover"),
    "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.45))",
    theme,
  );
  const overviewStyle = buildBackgroundStyle(
    resolveBackgroundUrl("overview"),
    "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.92))",
    theme,
  );
  const checklistStyle = buildBackgroundStyle(
    resolveBackgroundUrl("checklist"),
    "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.95))",
    theme,
  );
  const infoStyle = buildBackgroundStyle(
    resolveBackgroundUrl("info"),
    "linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.95))",
    theme,
  );
  const memoStyle = buildBackgroundStyle(
    resolveBackgroundUrl("memo"),
    "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.98))",
    theme,
  );

  const packingItems =
    trip.aiEnabled && trip.aiContent?.packingSuggestions
      ? trip.aiContent.packingSuggestions
      : [];
  const wantItems = trip.wantItems.map((item) => item.text);

  const hasChecklist = packingItems.length > 0 || wantItems.length > 0;
  const hasInfo =
    trip.lodgings.length > 0 ||
    Boolean(trip.transportText) ||
    Boolean(trip.aiContent?.cautionsText) ||
    Boolean(trip.notes);
  const totalPages =
    3 +
    trip.dayPlans.length +
    (hasChecklist ? 1 : 0) +
    (hasInfo ? 1 : 0);
  const showPageNumbers = !fullPages;
  const checklistPageNumber = hasChecklist
    ? 3 + trip.dayPlans.length
    : null;
  const infoPageNumber = hasInfo
    ? 3 + trip.dayPlans.length + (hasChecklist ? 1 : 0)
    : null;
  const memoPageNumber =
    3 + trip.dayPlans.length + (hasChecklist ? 1 : 0) + (hasInfo ? 1 : 0);

  return (
    <div className="space-y-12">
      <PageFrame
        backgroundStyle={coverStyle}
        theme={theme}
        pageNumber={showPageNumbers ? 1 : undefined}
        totalPages={showPageNumbers ? totalPages : undefined}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5" style={{ color: theme.accent }} />
              <span
                className="text-xs uppercase tracking-[0.5em]"
                style={{ color: theme.accent }}
              >
                TRAVEL NOTE
              </span>
            </div>
            <h1
              className="mt-6 text-4xl md:text-6xl font-semibold"
              style={{ color: theme.ink }}
            >
              {trip.title || "旅のしおり"}
            </h1>
            {trip.aiEnabled && trip.aiContent?.coverCopy && (
              <p
                className="mt-4 text-lg md:text-xl italic"
                style={{ color: theme.muted }}
              >
                &quot;{trip.aiContent.coverCopy}&quot;
              </p>
            )}
            <div
              className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: theme.accentSoft, color: theme.ink }}
            >
              <MapPin className="h-4 w-4" />
              {trip.destination || "行き先"}
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="h-[2px] w-20 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="flex items-center gap-2" style={{ color: theme.ink }}>
                <Calendar className="h-4 w-4" style={{ color: theme.accent }} />
                {formatDate(trip.startDate)} 〜 {formatDate(trip.endDate)}
              </div>
              {trip.members.length > 0 && (
                <div
                  className="flex items-center gap-2"
                  style={{ color: theme.ink }}
                >
                  <Users className="h-4 w-4" style={{ color: theme.accent }} />
                  {trip.members.map((member) => member.name).join(" ・ ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageFrame>

      <PageFrame
        backgroundStyle={overviewStyle}
        theme={theme}
        delay={0.05}
        pageNumber={showPageNumbers ? 2 : undefined}
        totalPages={showPageNumbers ? totalPages : undefined}
      >
        <PageHeader
          title="PLAN"
          subtitle="旅のプラン"
          icon={BookOpen}
          theme={theme}
        />
        <div className="mt-8 grid flex-1 gap-6 md:grid-cols-2">
          <div
            className="rounded-3xl border-2 border-dashed p-6"
            style={{ borderColor: theme.line, backgroundColor: "rgba(255,255,255,0.8)" }}
          >
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: theme.accent }}
            >
              OVERVIEW
            </p>
            <p
              className="mt-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: theme.ink }}
            >
              {trip.aiEnabled && trip.aiContent?.overviewText
                ? trip.aiContent.overviewText
                : "旅の目的や雰囲気をここにまとめましょう。"}
            </p>
            <div className="mt-4 space-y-2 text-sm" style={{ color: theme.muted }}>
              <div>目的地: {trip.destination || "-"}</div>
              <div>
                日程: {formatDate(trip.startDate)} 〜 {formatDate(trip.endDate)}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div
              className="rounded-3xl border-2 border-dashed p-6"
              style={{ borderColor: theme.line, backgroundColor: "rgba(255,255,255,0.8)" }}
            >
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: theme.accent }}
              >
                TRANSPORT
              </p>
              <p className="mt-3 text-sm whitespace-pre-wrap" style={{ color: theme.ink }}>
                {trip.transportText || "移動手段を入力するとここに表示されます。"}
              </p>
            </div>
            <div
              className="rounded-3xl border-2 border-dashed p-6"
              style={{ borderColor: theme.line, backgroundColor: "rgba(255,255,255,0.8)" }}
            >
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: theme.accent }}
              >
                LODGING
              </p>
              {trip.lodgings.length > 0 ? (
                <div className="mt-3 space-y-2 text-sm" style={{ color: theme.ink }}>
                  {trip.lodgings.slice(0, 2).map((lodging) => (
                    <div key={lodging.id}>
                      <p className="font-semibold">{lodging.name}</p>
                      <p className="text-xs" style={{ color: theme.muted }}>
                        {lodging.address || "住所未入力"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm" style={{ color: theme.ink }}>
                  宿泊情報を入力するとここに表示されます。
                </p>
              )}
            </div>
          </div>
        </div>
      </PageFrame>

      {trip.dayPlans.map((plan, index) => {
        const scheduleStyle = buildBackgroundStyle(
          resolveBackgroundUrl("schedule", plan.day),
          "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.92))",
          theme,
        );
        return (
          <PageFrame
            key={plan.day}
            backgroundStyle={scheduleStyle}
            theme={theme}
            delay={0.1 + index * 0.05}
            pageNumber={showPageNumbers ? 3 + index : undefined}
            totalPages={showPageNumbers ? totalPages : undefined}
          >
          <PageHeader
            title={`DAY ${plan.day}`}
            subtitle={plan.date}
            icon={Calendar}
            theme={theme}
          />
          <div className="mt-8 grid flex-1 gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="relative pl-6">
              <div
                className="absolute left-2 top-0 h-full w-px"
                style={{ backgroundColor: theme.line }}
              />
              <div className="space-y-4">
                {plan.activities.length > 0 ? (
                  plan.activities.map((activity, idx) => (
                    <div key={`${plan.day}-${idx}`} className="flex gap-4">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: theme.accentSoft,
                          color: theme.ink,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: theme.ink }}
                        >
                          {activity}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: theme.muted }}>
                    予定がまだ登録されていません。
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div
                className="rounded-3xl border-2 border-dashed p-5"
                style={{
                  borderColor: theme.line,
                  backgroundColor: "rgba(255,255,255,0.85)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: theme.accent }}
                >
                  HIGHLIGHTS
                </p>
                <p className="mt-3 text-sm whitespace-pre-wrap" style={{ color: theme.ink }}>
                  {trip.aiEnabled && trip.aiContent?.daySummaries[plan.day]
                    ? trip.aiContent.daySummaries[plan.day]
                    : "印象に残るポイントをメモしておきましょう。"}
                </p>
              </div>
              <div
                className="flex flex-1 flex-col rounded-3xl border-2 border-dashed p-5"
                style={{
                  borderColor: theme.line,
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: theme.accent }}
                >
                  PHOTO SLOT
                </p>
                <div
                  className="mt-4 flex-1 rounded-2xl border border-dashed"
                  style={{ borderColor: theme.line }}
                />
              </div>
            </div>
          </div>
          </PageFrame>
        );
      })}

      {hasChecklist && (
        <PageFrame
          backgroundStyle={checklistStyle}
          theme={theme}
          delay={0.2}
          pageNumber={showPageNumbers ? checklistPageNumber ?? undefined : undefined}
          totalPages={showPageNumbers ? totalPages : undefined}
        >
          <PageHeader
            title="CHECK LIST"
            subtitle="持ち物・やりたいこと"
            icon={ClipboardList}
            theme={theme}
          />
          <div className="mt-8 grid flex-1 gap-6 md:grid-cols-2">
            <div
              className="rounded-3xl border-2 border-dashed p-6"
              style={{
                borderColor: theme.line,
                backgroundColor: "rgba(255,255,255,0.85)",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckSquare2 className="h-4 w-4" style={{ color: theme.accent }} />
                <span
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: theme.accent }}
                >
                  PACKING
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm" style={{ color: theme.ink }}>
                {packingItems.length > 0 ? (
                  packingItems.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span
                        className="mt-1 h-4 w-4 border"
                        style={{ borderColor: theme.line }}
                      />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: theme.muted }}>
                    持ち物リストがまだありません。
                  </p>
                )}
              </div>
            </div>
            <div
              className="rounded-3xl border-2 border-dashed p-6"
              style={{
                borderColor: theme.line,
                backgroundColor: "rgba(255,255,255,0.85)",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckSquare2 className="h-4 w-4" style={{ color: theme.accent }} />
                <span
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: theme.accent }}
                >
                  WISH LIST
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm" style={{ color: theme.ink }}>
                {wantItems.length > 0 ? (
                  wantItems.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span
                        className="mt-1 h-4 w-4 border"
                        style={{ borderColor: theme.line }}
                      />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: theme.muted }}>
                    やりたいことがまだありません。
                  </p>
                )}
              </div>
            </div>
          </div>
        </PageFrame>
      )}

      {hasInfo && (
        <PageFrame
          backgroundStyle={infoStyle}
          theme={theme}
          delay={0.25}
          pageNumber={showPageNumbers ? infoPageNumber ?? undefined : undefined}
          totalPages={showPageNumbers ? totalPages : undefined}
        >
          <PageHeader
            title="INFORMATION"
            subtitle="集合・注意事項"
            icon={Info}
            theme={theme}
          />
          <div className="mt-8 grid flex-1 gap-6 md:grid-cols-2">
            <div
              className="rounded-3xl border-2 border-dashed p-6"
              style={{
                borderColor: theme.line,
                backgroundColor: "rgba(255,255,255,0.85)",
              }}
            >
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: theme.accent }}
              >
                LODGING
              </p>
              {trip.lodgings.length > 0 ? (
                <div className="mt-4 space-y-4 text-sm" style={{ color: theme.ink }}>
                  {trip.lodgings.map((lodging) => (
                    <div key={lodging.id}>
                      <p className="font-semibold">{lodging.name}</p>
                      <p className="text-xs" style={{ color: theme.muted }}>
                        {lodging.address || "住所未入力"}
                      </p>
                      {(lodging.checkin || lodging.checkout) && (
                        <p className="text-xs" style={{ color: theme.muted }}>
                          IN {lodging.checkin || "-"} / OUT {lodging.checkout || "-"}
                        </p>
                      )}
                      {lodging.phone && (
                        <p className="text-xs" style={{ color: theme.muted }}>
                          TEL: {lodging.phone}
                        </p>
                      )}
                      {lodging.url && (
                        <p
                          className="text-xs break-all"
                          style={{ color: theme.muted }}
                        >
                          {lodging.url}
                        </p>
                      )}
                      {lodging.memo && (
                        <p
                          className="text-xs whitespace-pre-wrap"
                          style={{ color: theme.muted }}
                        >
                          {lodging.memo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm" style={{ color: theme.muted }}>
                  宿泊情報を入力するとここに表示されます。
                </p>
              )}
            </div>
            <div
              className="rounded-3xl border-2 border-dashed p-6"
              style={{
                borderColor: theme.line,
                backgroundColor: "rgba(255,255,255,0.85)",
              }}
            >
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: theme.accent }}
              >
                NOTES
              </p>
              <div className="mt-4 space-y-3 text-sm" style={{ color: theme.ink }}>
                {trip.transportText && (
                  <p className="whitespace-pre-wrap">移動: {trip.transportText}</p>
                )}
                {trip.aiEnabled && trip.aiContent?.cautionsText && (
                  <p className="whitespace-pre-wrap">
                    {trip.aiContent.cautionsText}
                  </p>
                )}
                {trip.notes && (
                  <p className="whitespace-pre-wrap">{trip.notes}</p>
                )}
                {!trip.transportText &&
                  !(trip.aiEnabled && trip.aiContent?.cautionsText) &&
                  !trip.notes && (
                    <p style={{ color: theme.muted }}>
                      注意事項がここに表示されます。
                    </p>
                  )}
              </div>
            </div>
          </div>
        </PageFrame>
      )}

      <PageFrame
        backgroundStyle={memoStyle}
        theme={theme}
        delay={0.3}
        pageNumber={showPageNumbers ? memoPageNumber : undefined}
        totalPages={showPageNumbers ? totalPages : undefined}
      >
        <PageHeader
          title="MEMO"
          subtitle="自由記入スペース"
          icon={StickyNote}
          theme={theme}
        />
        <div
          className="mt-8 flex-1 rounded-3xl border-2 border-dashed p-6"
          style={{
            borderColor: theme.line,
            backgroundColor: "rgba(255,255,255,0.9)",
            backgroundImage: `linear-gradient(to bottom, transparent 28px, ${theme.line} 29px)`,
            backgroundSize: "100% 30px",
          }}
        />
      </PageFrame>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, ExternalLink, Loader2, Save, Share2, Sparkles } from "lucide-react";
import { PricingCards } from "@/components/PricingCards";
import { TripForm } from "@/components/TripForm";
import { TripPreview } from "@/components/TripPreview";
import { FullModeLineEditor } from "@/components/editor/FullModeLineEditor";
import { authClient } from "@/lib/auth-client";
import { extractTextLinesFromTrip, editableLinesToTextLines } from "@/lib/layers/extractTextLines";
import { requestDesignAsset } from "@/lib/design/requestDesign";
import { generateId } from "@/lib/ids";
import { posthog } from "@/lib/posthog";
import type {
  AiContent,
  EditableTextLine,
  FullModePageStyle,
  Trip,
  TripDesignPage,
} from "@/types/trip";

type Entitlements = {
  isPremium: boolean;
  canExportPdf: boolean;
  canShare: boolean;
  canGenerate: boolean;
  canSave: boolean;
  canRegeneratePage: boolean;
  generationsRemaining: number;
};

const defaultEntitlements: Entitlements = {
  isPremium: false,
  canExportPdf: false,
  canShare: false,
  canGenerate: true,
  canSave: false,
  canRegeneratePage: false,
  generationsRemaining: 3,
};

const pageRequestsForTrip = (trip: Trip) => {
  const requests: Array<{ mode: TripDesignPage["mode"]; label: string; day?: number }> = [
    { mode: "cover", label: "表紙" },
    { mode: "overview", label: "旅の概要" },
    ...trip.dayPlans.map((plan) => ({
      mode: "schedule" as const,
      label: `Day ${plan.day}`,
      day: plan.day,
    })),
  ];

  if ((trip.aiContent?.packingSuggestions?.length ?? 0) > 0 || trip.wantItems.length > 0) {
    requests.push({ mode: "checklist", label: "持ち物" });
  }

  if (trip.lodgings.length > 0 || trip.transportText || trip.notes) {
    requests.push({ mode: "info", label: "インフォメーション" });
  }

  requests.push({ mode: "memo", label: "メモ" });
  return requests;
};

const sortPages = (trip: Trip) =>
  [...(trip.design?.pages ?? [])].sort((left, right) => left.pageNumber - right.pageNumber);

export function BuilderApp() {
  const searchParams = useSearchParams();
  const bookletId = searchParams.get("booklet");
  const { data: session } = authClient.useSession();
  const [entitlements, setEntitlements] = useState<Entitlements>(defaultEntitlements);
  const [savedTrips, setSavedTrips] = useState<
    Array<{
      id: string;
      title: string;
      destination: string;
      startDate: string;
      endDate: string;
      templateType: string;
      coverPreviewDataUrl?: string | null;
      updatedAt: string;
      shareToken?: string | null;
    }>
  >([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [quickEditPageId, setQuickEditPageId] = useState<string | null>(null);
  const [quickEditLines, setQuickEditLines] = useState<EditableTextLine[]>([]);
  const [quickEditStyle, setQuickEditStyle] = useState<FullModePageStyle>({});
  const [quickEditBaseline, setQuickEditBaseline] = useState<{
    lines: EditableTextLine[];
    style: FullModePageStyle;
  } | null>(null);
  const [isRegeneratingPage, setIsRegeneratingPage] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const refreshLibrary = useCallback(async () => {
    const response = await fetch("/api/booklets", { cache: "no-store" });
    const payload = (await response.json()) as {
      entitlements?: Entitlements;
      trips?: typeof savedTrips;
    };
    setEntitlements(payload.entitlements ?? defaultEntitlements);
    setSavedTrips(payload.trips ?? []);
  }, []);

  useEffect(() => {
    refreshLibrary().catch(() => undefined);
  }, [refreshLibrary, session?.user?.id]);

  useEffect(() => {
    if (!bookletId || !session?.user?.id) return;
    setIsLoadingTrip(true);
    fetch(`/api/booklets/${bookletId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("読み込みに失敗しました");
        return (await response.json()) as { trip: Trip };
      })
      .then((payload) => setCurrentTrip(payload.trip))
      .catch((error) => {
        console.error(error);
        setBlockMessage("保存済みしおりの読み込みに失敗しました。");
      })
      .finally(() => setIsLoadingTrip(false));
  }, [bookletId, session?.user?.id]);

  const requestAiContent = async (trip: Trip): Promise<AiContent> => {
    const response = await fetch("/api/ai/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip }),
    });

    if (!response.ok) {
      throw new Error("AI文章生成に失敗しました。");
    }

    const payload = (await response.json()) as { aiContent: AiContent };
    return payload.aiContent;
  };

  const reserveGeneration = async () => {
    const response = await fetch("/api/booklets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reserve-generation" }),
    });

    const payload = (await response.json()) as {
      entitlements?: Entitlements;
      error?: string;
    };

    if (payload.entitlements) {
      setEntitlements(payload.entitlements);
    }

    if (!response.ok) {
      setPaywallOpen(true);
      throw new Error(payload.error ?? "free_limit_reached");
    }
  };

  const persistTrip = async (trip: Trip) => {
    if (!session?.user?.id) return trip;

    const response = await fetch("/api/booklets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        trip,
      }),
    });

    if (!response.ok) {
      throw new Error("保存に失敗しました。");
    }

    const payload = (await response.json()) as { trip: Trip };
    await refreshLibrary();
    return payload.trip;
  };

  const generatePages = async (trip: Trip) => {
    const requests = pageRequestsForTrip(trip);
    const pages: TripDesignPage[] = [];

    for (let index = 0; index < requests.length; index += 1) {
      const request = requests[index];
      const pageNumber = index + 1;
      const editableTextLines = extractTextLinesFromTrip(trip, request.mode, {
        day: request.day,
        pageNumber,
        totalPages: requests.length,
        appendPageLabel: true,
      });

      const asset = await requestDesignAsset(trip, request.mode, {
        renderMode: "full",
        pageNumber,
        totalPages: requests.length,
        day: request.day,
        textLines: editableLinesToTextLines(editableTextLines),
      });

      pages.push({
        id: generateId(),
        mode: request.mode,
        label: request.label,
        day: request.day,
        pageNumber,
        totalPages: requests.length,
        mimeType: asset.mimeType,
        base64: asset.base64,
        prompt: asset.prompt,
        createdAt: asset.createdAt,
        variantId: asset.variantId,
        variantName: asset.variantName,
        editableTextLines,
        fullModeStyle: {},
        isEdited: false,
        revision: 0,
      });
    }

    return pages;
  };

  const handleCreate = async (trip: Trip) => {
    setIsBusy(true);
    setBlockMessage("無料枠を確認しています。");
    posthog.capture("generation_started", {
      destination: trip.destination,
      days: trip.dayPlans.length,
      templateType: trip.templateType,
    });
    try {
      await reserveGeneration();

      let nextTrip = trip;
      if (trip.aiEnabled) {
        setBlockMessage("AIが文章を補完しています。");
        const aiContent = await requestAiContent(trip);
        nextTrip = {
          ...trip,
          aiContent,
        };
      }

      setBlockMessage("しおりページを生成しています。");
      const pages = await generatePages(nextTrip);
      const generatedTrip: Trip = {
        ...nextTrip,
        design: {
          style: nextTrip.templateType,
          format: nextTrip.formatType,
          renderMode: "full",
          pages,
          updatedAt: new Date().toISOString(),
        },
        coverPreviewDataUrl: `data:${pages[0].mimeType};base64,${pages[0].base64}`,
        status: "ready",
        updatedAt: new Date().toISOString(),
      };

      const persisted = await persistTrip(generatedTrip).catch(() => generatedTrip);
      setCurrentTrip(persisted);
      setPaywallOpen(false);
      setBlockMessage(null);
      posthog.capture("generation_succeeded", {
        bookletId: persisted.id,
        pageCount: persisted.design?.pages?.length ?? 0,
      });
    } catch (error) {
      console.error(error);
      if ((error as Error).message !== "free_limit_reached") {
        setBlockMessage("生成に失敗しました。もう一度お試しください。");
        posthog.capture("generation_failed");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartQuickEdit = (pageId: string) => {
    if (!currentTrip?.design?.pages?.length) return;
    const page = currentTrip.design.pages.find((item) => item.id === pageId);
    if (!page) return;
    const lines =
      page.editableTextLines && page.editableTextLines.length > 0
        ? page.editableTextLines
        : extractTextLinesFromTrip(currentTrip, page.mode, {
            day: page.day,
            pageNumber: page.pageNumber,
            totalPages: page.totalPages,
          });

    setQuickEditPageId(page.id);
    setQuickEditLines(lines.map((line) => ({ ...line })));
    setQuickEditStyle({ ...(page.fullModeStyle ?? {}) });
    setQuickEditBaseline({
      lines: lines.map((line) => ({ ...line })),
      style: { ...(page.fullModeStyle ?? {}) },
    });
  };

  const quickEditPage = useMemo(
    () =>
      quickEditPageId
        ? currentTrip?.design?.pages?.find((item) => item.id === quickEditPageId) ?? null
        : null,
    [currentTrip?.design?.pages, quickEditPageId],
  );

  const quickEditHasChanges = useMemo(() => {
    if (!quickEditBaseline) return false;
    return (
      JSON.stringify(quickEditBaseline.lines) !== JSON.stringify(quickEditLines) ||
      JSON.stringify(quickEditBaseline.style) !== JSON.stringify(quickEditStyle)
    );
  }, [quickEditBaseline, quickEditLines, quickEditStyle]);

  const handleSaveQuickEdit = async () => {
    if (!currentTrip || !quickEditPage) return;
    setIsRegeneratingPage(true);
    try {
      const gate = await fetch(
        `/api/booklets/${currentTrip.id}/pages/${quickEditPage.id}/regenerate`,
        { method: "POST" },
      );
      if (!gate.ok) {
        setPaywallOpen(true);
        posthog.capture("paywall_viewed", {
          reason: "page_regeneration",
        });
        throw new Error("premium_required");
      }

      const asset = await requestDesignAsset(currentTrip, quickEditPage.mode, {
        renderMode: "full",
        pageNumber: quickEditPage.pageNumber,
        totalPages: quickEditPage.totalPages,
        day: quickEditPage.day,
        variantId: quickEditPage.variantId,
        textLines: editableLinesToTextLines(quickEditLines),
        styleOverride: quickEditStyle,
      });

      const updatedTrip: Trip = {
        ...currentTrip,
        design: {
          ...currentTrip.design!,
          pages: sortPages(currentTrip).map((page) =>
            page.id === quickEditPage.id
              ? {
                  ...page,
                  base64: asset.base64,
                  mimeType: asset.mimeType,
                  prompt: asset.prompt,
                  variantId: asset.variantId ?? page.variantId,
                  variantName: asset.variantName ?? page.variantName,
                  editableTextLines: quickEditLines,
                  fullModeStyle: quickEditStyle,
                  isEdited: true,
                  revision: (page.revision ?? 0) + 1,
                }
              : page,
          ),
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      const persisted = await persistTrip(updatedTrip).catch(() => updatedTrip);
      setCurrentTrip(persisted);
      setQuickEditPageId(null);
      setQuickEditBaseline(null);
      posthog.capture("page_regenerated", {
        bookletId: persisted.id,
        pageId: quickEditPage.id,
      });
    } catch (error) {
      console.error(error);
      setBlockMessage("ページの再生成に失敗しました。");
    } finally {
      setIsRegeneratingPage(false);
    }
  };

  const handleSaveCloud = async () => {
    if (!currentTrip) return;
    if (!session?.user) {
      posthog.capture("login_required_shown", {
        reason: "save_trip",
      });
      window.location.href = "/sign-in";
      return;
    }

    setIsBusy(true);
    try {
      const persisted = await persistTrip(currentTrip);
      setCurrentTrip(persisted);
      setBlockMessage("クラウドに保存しました。");
      posthog.capture("trip_saved", {
        bookletId: persisted.id,
      });
    } catch (error) {
      console.error(error);
      setBlockMessage("保存に失敗しました。");
    } finally {
      setIsBusy(false);
    }
  };

  const handleShare = async () => {
    if (!currentTrip) return;
    if (!session?.user?.id) {
      setPaywallOpen(true);
      posthog.capture("paywall_viewed", {
        reason: "share_requires_login",
      });
      return;
    }
    const response = await fetch(`/api/booklets/${currentTrip.id}/share`, {
      method: "POST",
    });
    if (!response.ok) {
      setPaywallOpen(true);
      posthog.capture("paywall_viewed", {
        reason: "share_requires_premium",
      });
      return;
    }
    const payload = (await response.json()) as { shareUrl: string };
    await navigator.clipboard.writeText(payload.shareUrl);
    setBlockMessage("共有リンクをコピーしました。");
    posthog.capture("share_created", {
      bookletId: currentTrip.id,
    });
    await refreshLibrary();
  };

  const handleExportPdf = async () => {
    if (!currentTrip || !session?.user?.id) {
      setPaywallOpen(true);
      posthog.capture("paywall_viewed", {
        reason: "pdf_requires_login",
      });
      return;
    }

    const response = await fetch(`/api/booklets/${currentTrip.id}/export/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperSize: "a4", orientation: "portrait" }),
    });

    if (!response.ok) {
      setPaywallOpen(true);
      posthog.capture("paywall_viewed", {
        reason: "pdf_requires_premium",
      });
      return;
    }

    const payload = (await response.json()) as { pdf: string; filename: string };
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${payload.pdf}`;
    link.download = payload.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    posthog.capture("pdf_exported", {
      bookletId: currentTrip.id,
    });
  };

  const handleCheckout = async (billingCycle: "monthly" | "yearly") => {
    setIsCheckingOut(true);
    try {
      posthog.capture("checkout_started", {
        billingCycle,
      });
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });
      const payload = (await response.json()) as { url?: string };
      if (payload.url) {
        window.location.href = payload.url;
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    if (!paywallOpen) return;
    posthog.capture("paywall_viewed", {
      hasTrip: Boolean(currentTrip),
      isLoggedIn: Boolean(session?.user?.id),
    });
  }, [currentTrip, paywallOpen, session?.user?.id]);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8">
      <section className="paper-card rounded-3xl p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="title-tag">Builder</p>
            <h1 className="mt-4 font-display text-4xl text-ink">旅のしおりをつくる</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
              まずは無料で3件まで。Googleログインで保存、PremiumでPDF・共有・ページ修正までまとめて使えます。
            </p>
          </div>
          <div className="rounded-2xl bg-paper-100 px-5 py-4 text-sm text-ink-soft">
            {entitlements.isPremium
              ? "Premium: PDF・共有・ページ修正が有効です。"
              : `Free: 今月あと${Number.isFinite(entitlements.generationsRemaining) ? entitlements.generationsRemaining : "∞"}件`}
          </div>
        </div>
      </section>

      {savedTrips.length > 0 && (
        <section className="paper-card rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl text-ink">保存済みしおり</h2>
              <p className="text-sm text-ink-soft">Googleログイン済みならここから再開できます。</p>
            </div>
            <a href="/account" className="btn btn-ghost text-sm">
              ライブラリを見る
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {savedTrips.slice(0, 3).map((trip) => (
              <a key={trip.id} href={`/app?booklet=${trip.id}`} className="note-card overflow-hidden rounded-2xl p-4">
                {trip.coverPreviewDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={trip.coverPreviewDataUrl}
                    alt={`${trip.title}の表紙`}
                    className="mb-3 h-48 w-full rounded-xl object-cover"
                  />
                )}
                <div className="font-ui text-sm text-ink-soft">{trip.destination}</div>
                <div className="font-display text-xl text-ink">{trip.title}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {currentTrip ? (
        <div className={`grid gap-6 ${quickEditPage ? "xl:grid-cols-[minmax(0,1fr),360px]" : ""}`}>
          <div className="space-y-6">
            <section className="paper-card rounded-3xl p-6">
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleSaveCloud} className="btn btn-soft btn-pill px-5 py-3 text-sm">
                  <Save className="mr-2 inline h-4 w-4" />
                  {session?.user ? "クラウド保存" : "Googleで保存"}
                </button>
                <button type="button" onClick={handleShare} className="btn btn-secondary btn-pill px-5 py-3 text-sm">
                  <Share2 className="mr-2 inline h-4 w-4" />
                  共有リンク
                </button>
                <button type="button" onClick={handleExportPdf} className="btn btn-primary btn-pill px-5 py-3 text-sm">
                  <Download className="mr-2 inline h-4 w-4" />
                  PDFを書き出す
                </button>
              </div>
            </section>

            <TripPreview
              trip={currentTrip}
              quickEdit={{
                activePageId: quickEditPageId,
                regeneratingPageId: isRegeneratingPage ? quickEditPageId : null,
                onStartEdit: handleStartQuickEdit,
              }}
            />
          </div>

          {quickEditPage && (
            <div className="xl:sticky xl:top-24 xl:h-[calc(100vh-120px)]">
              <FullModeLineEditor
                lines={quickEditLines}
                style={quickEditStyle}
                pageName={quickEditPage.label}
                onLinesChange={setQuickEditLines}
                onStyleChange={setQuickEditStyle}
                onSave={handleSaveQuickEdit}
                isSaving={isRegeneratingPage}
                onCancel={() => setQuickEditPageId(null)}
                canSave={quickEditHasChanges}
              />
            </div>
          )}
        </div>
      ) : (
        <TripForm
          onSave={handleCreate}
          onCancel={() => {
            window.location.href = "/";
          }}
          isBusy={isBusy}
          busyLabel={blockMessage ?? "しおりを生成中..."}
        />
      )}

      {isLoadingTrip && (
        <div className="paper-card rounded-3xl p-8 text-center text-ink-soft">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
          保存済みしおりを読み込んでいます。
        </div>
      )}

      {blockMessage && !isBusy && (
        <div className="note-callout rounded-2xl p-5 text-sm text-ink-soft">
          {blockMessage}
        </div>
      )}

      {paywallOpen && (
        <section className="paper-card rounded-3xl p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full hero-badge">
              <Sparkles className="h-5 w-5 text-paper" />
            </div>
            <div>
              <h2 className="font-display text-3xl text-ink">Premiumで本番運用へ</h2>
              <p className="text-sm text-ink-soft">
                無料枠は導線確認用。共有・PDF・ページ修正はPremiumで開放します。
              </p>
            </div>
          </div>
          <PricingCards compact onCheckout={handleCheckout} isBusy={isCheckingOut} />
        </section>
      )}

      {!currentTrip && (
        <section className="paper-card rounded-3xl p-8">
          <div className="mb-4 flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-accent-sky" />
            <h2 className="font-display text-2xl text-ink">先に見たい人向け</h2>
          </div>
          <PricingCards compact onCheckout={handleCheckout} isBusy={isCheckingOut} />
        </section>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  Download,
  Edit,
  Feather,
  Loader2,
  Map,
  MapPin,
  Share2,
  Trash2,
  Pencil,
} from "lucide-react";
import type {
  DesignMode,
  DesignRenderMode,
  Trip,
  TripDesignImage,
  TripDesignPage,
} from "../types/trip";
import { generateAiContent } from "../lib/ai";
import { generateId, generateShareToken, storage } from "../lib/storage";
import { Header } from "./Header";
import { PdfExport } from "./PdfExport";
import { ShioriShowcase } from "./ShioriShowcase";
import { TripForm } from "./TripForm";
import { TripPreview } from "./TripPreview";

// Dynamic import for DesignEditor (no longer needs SSR disable since it doesn't use Konva)
const DesignEditor = dynamic(
  () => import("./editor/DesignEditor").then((mod) => mod.DesignEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

type View = "home" | "create" | "preview" | "editor";
type ProgressState = { current: number; total: number } | null;

type BlockState = {
  active: boolean;
  title: string;
  message?: string;
  progress?: ProgressState;
};

const CircleDecoration = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <circle
      cx="50"
      cy="50"
      r="48"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="4 4"
      opacity="0.3"
    />
    <circle
      cx="50"
      cy="50"
      r="35"
      stroke="currentColor"
      strokeWidth="0.5"
      opacity="0.2"
    />
  </svg>
);

export function TabiNoteApp() {
  const [view, setView] = useState<View>("home");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [showPdfExport, setShowPdfExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [blockState, setBlockState] = useState<BlockState>({
    active: false,
    title: "",
  });

  const refreshTrips = async () => {
    const nextTrips = await storage.getTrips();
    setTrips(nextTrips);
  };

  useEffect(() => {
    let active = true;
    const loadTrips = async () => {
      const nextTrips = await storage.getTrips();
      if (!active) return;
      setTrips(nextTrips);
    };
    loadTrips();
    return () => {
      active = false;
    };
  }, []);

  const requestDesign = async (
    trip: Trip,
    mode: DesignMode,
    options?: {
      pageNumber?: number;
      totalPages?: number;
      day?: number;
      renderMode?: "background" | "full" | "layered";
    },
  ): Promise<TripDesignImage & { renderType?: "legacy" | "layered"; textLayers?: TripDesignPage["textLayers"] }> => {
    const tripPayload: Trip = {
      ...trip,
      design: undefined,
    };
    const response = await fetch("/api/design", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trip: tripPayload,
        mode,
        renderMode: options?.renderMode ?? "layered",
        pageNumber: options?.pageNumber,
        totalPages: options?.totalPages,
        day: options?.day,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Design generation failed.");
    }

    const payload = (await response.json()) as {
      base64: string;
      mimeType: string;
      prompt?: string;
      mode: DesignMode;
      renderType?: "legacy" | "layered";
      textLayers?: TripDesignPage["textLayers"];
    };

    return {
      base64: payload.base64,
      mimeType: payload.mimeType,
      prompt: payload.prompt,
      createdAt: new Date().toISOString(),
      renderType: payload.renderType,
      textLayers: payload.textLayers,
    };
  };

  const safeSaveTrip = async (trip: Trip) => {
    try {
      return await storage.saveTrip(trip);
    } catch (error) {
      console.error("Failed to save trip:", error);
      return trip;
    }
  };

  const generateDesignPages = async (
    trip: Trip,
    onProgress?: (current: number, total: number) => void,
    renderMode: "background" | "full" | "layered" = "layered",
  ) => {
    const pageRequests: Array<{
      mode: DesignMode;
      label: string;
      day?: number;
    }> = [
      { mode: "cover", label: "表紙" },
      { mode: "overview", label: "概要" },
      ...trip.dayPlans.map((plan) => ({
        mode: "schedule" as const,
        label: `Day ${plan.day}`,
        day: plan.day,
      })),
    ];

    const hasChecklist =
      (trip.aiContent?.packingSuggestions?.length ?? 0) > 0 ||
      trip.wantItems.length > 0;
    if (hasChecklist) {
      pageRequests.push({ mode: "checklist", label: "持ち物" });
    }

    const hasInfo =
      trip.lodgings.length > 0 ||
      Boolean(trip.transportText) ||
      Boolean(trip.aiContent?.cautionsText) ||
      Boolean(trip.notes);
    if (hasInfo) {
      pageRequests.push({ mode: "info", label: "情報" });
    }

    pageRequests.push({ mode: "memo", label: "メモ" });

    const totalPages = pageRequests.length;
    const pages: TripDesignPage[] = [];

    for (let index = 0; index < pageRequests.length; index += 1) {
      const request = pageRequests[index];
      const current = index + 1;
      onProgress?.(current, totalPages);
      // eslint-disable-next-line no-await-in-loop
      const asset = await requestDesign(trip, request.mode, {
        pageNumber: current,
        totalPages,
        day: request.day,
        renderMode,
      });
      pages.push({
        id: generateId(),
        mode: request.mode,
        label: request.label,
        day: request.day,
        pageNumber: current,
        totalPages,
        mimeType: asset.mimeType,
        base64: asset.base64,
        prompt: asset.prompt,
        createdAt: asset.createdAt,
        // layeredモードの場合はrenderTypeとtextLayersを保存
        renderType: asset.renderType,
        textLayers: asset.textLayers,
      });
    }

    return pages;
  };

  const needsDesignPages = (trip: Trip) => {
    if (!trip.design) return true;
    if (trip.design.renderMode !== "layered") return true;
    if (!trip.design.pages || trip.design.pages.length === 0) return true;
    return false;
  };

  const ensureDesignPages = async (trip: Trip) => {
    if (!needsDesignPages(trip)) return trip;
    setBlockState({
      active: true,
      title: "デザインを生成中",
      message: "レイアウト素材を作成しています。",
      progress: { current: 0, total: 6 },
    });

    try {
      const renderMode: "background" | "full" | "layered" = "layered";
      const pages = await generateDesignPages(
        trip,
        (current, total) => {
          setBlockState({
            active: true,
            title: "デザインを生成中",
            message: `レイアウト素材を作成しています。(${current}/${total})`,
            progress: { current, total },
          });
        },
        renderMode,
      );
      const nextTrip: Trip = {
        ...trip,
        design: {
          style: trip.templateType,
          format: trip.formatType,
          renderMode,
          pages,
          updatedAt: new Date().toISOString(),
        },
      };
      const savedTrip = await safeSaveTrip(nextTrip);
      await refreshTrips();
      return savedTrip;
    } catch (error) {
      console.error(error);
      alert("デザイン生成に失敗しました。もう一度お試しください。");
      return trip;
    } finally {
      setBlockState({ active: false, title: "" });
    }
  };

  const handleCreateNew = () => {
    setCurrentTrip(null);
    setView("create");
  };

  const handleScrollToList = () => {
    const listSection = document.getElementById("trip-list");
    if (listSection) {
      listSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSaveTrip = async (trip: Trip, renderMode?: DesignRenderMode) => {
    const selectedRenderMode = renderMode ?? "full";
    setBlockState({
      active: true,
      title: "しおりを作成中",
      message: "入力内容を保存しています。",
    });
    const nextTrip = trip.aiEnabled
      ? { ...trip, aiContent: generateAiContent(trip) }
      : { ...trip, aiContent: undefined };
    const savedTrip = await safeSaveTrip(nextTrip);
    setBlockState({
      active: true,
      title: "しおりを作成中",
      message: "デザインを生成しています。",
      progress: { current: 0, total: 6 },
    });
    let finalTrip = savedTrip;
    try {
      const pages = await generateDesignPages(
        savedTrip,
        (current, total) => {
          setBlockState({
            active: true,
            title: "しおりを作成中",
            message: `デザインを生成しています。(${current}/${total})`,
            progress: { current, total },
          });
        },
        selectedRenderMode,
      );
      const withDesign: Trip = {
        ...savedTrip,
        design: {
          style: savedTrip.templateType,
          format: savedTrip.formatType,
          renderMode: selectedRenderMode,
          pages,
          updatedAt: new Date().toISOString(),
        },
      };
      finalTrip = await safeSaveTrip(withDesign);
    } catch (error) {
      console.error(error);
      alert("デザイン生成に失敗しました。再度お試しください。");
    } finally {
      setBlockState({ active: false, title: "" });
    }
    await refreshTrips();
    setCurrentTrip(finalTrip);
    setShowPdfExport(false);
    setView("preview");
  };

  const handleEditTrip = (trip: Trip) => {
    setCurrentTrip(trip);
    setView("create");
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm("このしおりを削除しますか？")) {
      return;
    }
    await storage.deleteTrip(id);
    await refreshTrips();
  };

  const handleViewTrip = async (trip: Trip) => {
    const ensuredTrip = await ensureDesignPages(trip);
    setCurrentTrip(ensuredTrip);
    setView("preview");
  };

  const handleShareTrip = async (trip: Trip) => {
    let updatedTrip = trip;
    if (!trip.shareToken) {
      updatedTrip = { ...trip, shareToken: generateShareToken() };
      updatedTrip = await storage.saveTrip(updatedTrip);
      await refreshTrips();
      if (currentTrip?.id === trip.id) {
        setCurrentTrip(updatedTrip);
      }
    }

    if (!updatedTrip.shareToken) {
      return;
    }

    const shareUrl = `${window.location.origin}/share/${updatedTrip.shareToken}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert(`共有リンクをコピーしました！\n\n${shareUrl}`);
      return;
    }

    prompt("共有リンク（コピーしてください）:", shareUrl);
  };

  const handleBackToHome = () => {
    setView("home");
    setCurrentTrip(null);
    setShowPdfExport(false);
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const templateLabels: Record<Trip["templateType"], string> = {
    minimal: "ミニマル",
    pop: "ポップ",
    photo: "写真多め",
    retro: "レトロ",
    romantic: "ロマンチック",
    modern: "モダン",
    nature: "ナチュラル",
    adventure: "アドベンチャー",
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTrips = trips.filter((trip) => {
    if (!normalizedQuery) return true;
    const haystack = [
      trip.title,
      trip.destination,
      trip.members.map((member) => member.name).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const visibleTrips = [...filteredTrips].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return sortOrder === "recent" ? bTime - aTime : aTime - bTime;
  });

  const renderBlockingOverlay = () => {
    if (!blockState.active) return null;
    const progress = blockState.progress;
    const percent = progress
      ? Math.round((progress.current / progress.total) * 100)
      : 0;
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="paper-card rounded-2xl px-8 py-7 max-w-sm w-full">
          <div className="flex items-center gap-3 text-ink">
            <div className="w-9 h-9 rounded-full hero-badge flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-paper animate-spin" />
            </div>
            <span className="text-base font-semibold font-ui">
              {blockState.title}
            </span>
          </div>
          {blockState.message && (
            <p className="mt-3 text-sm text-ink-soft">{blockState.message}</p>
          )}
          {progress && (
            <div className="mt-5">
              <div className="h-2 w-full rounded-full bg-paper-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-coral to-accent-sun transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                {progress.current}/{progress.total}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (view === "home") {
    return (
      <div className="min-h-screen ink-wash overflow-hidden relative">
        <Header
          onCreateNew={handleCreateNew}
          onViewList={handleScrollToList}
          currentView={view}
        />

        <motion.div
          className="absolute top-20 right-10 w-32 h-32 text-accent-coral opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <CircleDecoration />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-10 w-24 h-24 text-accent-sky opacity-20"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <CircleDecoration />
        </motion.div>

        <motion.section
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-6 py-8 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
              <motion.div
                className="relative"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <motion.h1
                  className="font-display text-5xl md:text-6xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="gradient-text-warm font-black">たび</span>
                  <span className="text-ink font-black">Note</span>
                </motion.h1>
                <p className="font-body text-base text-ink-soft mt-3 max-w-md">
                  旅のしおりを5分で作れる。AIが旅行の内容に合わせたしおりを簡単に自動生成します。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <motion.button
                    onClick={handleCreateNew}
                    className="px-7 py-3 btn btn-primary btn-pill text-base flex items-center gap-2"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                  >
                    <Feather className="w-4 h-4" strokeWidth={2.5} />
                    新しいしおりを作成
                  </motion.button>
                  <motion.button
                    onClick={handleScrollToList}
                    className="px-6 py-3 btn btn-ghost text-ink text-base"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                  >
                    作成したしおりを見る
                  </motion.button>
                </div>

                {/* 3ステップで完成セクション */}
                <motion.div
                  className="mt-8 paper-card rounded-2xl p-6 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <span className="stamp-mark stamp-mini">FLOW</span>

                  <h3 className="font-display text-xl md:text-2xl font-bold text-ink mb-4 mt-2">
                    3ステップで完成
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border border-accent-coral text-accent-coral flex items-center justify-center flex-shrink-0 font-hand text-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
                        1
                      </div>
                      <div>
                        <p className="font-hand text-base text-ink">
                          入力
                        </p>
                        <p className="text-xs text-ink-soft">
                          旅程やメンバーをまとめて整理。
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border border-accent-coral text-accent-coral flex items-center justify-center flex-shrink-0 font-hand text-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
                        2
                      </div>
                      <div>
                        <p className="font-hand text-base text-ink">
                          デザイン
                        </p>
                        <p className="text-xs text-ink-soft">
                          AIがしおり用レイアウトを生成。
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border border-accent-coral text-accent-coral flex items-center justify-center flex-shrink-0 font-hand text-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
                        3
                      </div>
                      <div>
                        <p className="font-hand text-base text-ink">
                          共有
                        </p>
                        <p className="text-xs text-ink-soft">
                          URL共有やPDFで配布。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 下部のカードイメージ */}
                  <div className="mt-5 flex justify-center items-end gap-2">
                    <motion.div
                      className="w-16 h-20 bg-paper-50 rounded-lg border border-paper-300 shadow-md p-1.5 -rotate-6"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <p className="text-[6px] text-ink-soft uppercase tracking-wider mb-1">
                        Cover
                      </p>
                      <div className="w-full h-6 rounded bg-gradient-to-br from-accent-coral/20 to-accent-sun/20" />
                    </motion.div>
                    <motion.div
                      className="w-20 h-24 bg-paper-50 rounded-lg border border-paper-300 shadow-lg p-1.5 z-10"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <p className="text-[6px] text-ink-soft uppercase tracking-wider mb-1">
                        Schedule
                      </p>
                      <div className="space-y-1">
                        <div className="w-full h-1 rounded bg-paper-300" />
                        <div className="w-3/4 h-1 rounded bg-paper-300" />
                        <div className="w-full h-1 rounded bg-paper-300" />
                        <div className="w-2/3 h-1 rounded bg-paper-300" />
                      </div>
                    </motion.div>
                    <motion.div
                      className="w-16 h-20 bg-paper-50 rounded-lg border border-paper-300 shadow-md p-1.5 rotate-6"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      <p className="text-[6px] text-ink-soft uppercase tracking-wider mb-1">
                        Check
                      </p>
                      <div className="space-y-1">
                        <div className="w-full h-1 rounded bg-paper-300" />
                        <div className="w-full h-1 rounded bg-paper-300" />
                        <div className="w-3/4 h-1 rounded bg-paper-300" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <ShioriShowcase />
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="container mx-auto px-6 py-16 max-w-6xl relative z-10">
          <motion.section
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="handwritten-label">できること</span>
              <h2 className="font-display text-3xl text-ink">
                旅のしおりをで簡単に作成
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="paper-card rounded-2xl p-6 relative">
                <span className="tape tape-mini tape-top-left" />
                <span className="stamp-mark stamp-mini">EDIT</span>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full hero-badge flex items-center justify-center">
                    <Edit className="w-5 h-5 text-paper" />
                  </div>
                  <h3 className="font-display text-xl text-ink">自由に編集</h3>
                </div>
                <p className="text-sm text-ink-soft">
                  AIがあなたの好みに合わせたデザインのしおりを自動生成。簡単に美しい旅のしおりが作れます。
                </p>
              </div>
              <div className="paper-card rounded-2xl p-6 relative">
                <span className="tape tape-mini tape-top-left" />
                <span className="stamp-mark stamp-mini">PDF</span>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full hero-badge flex items-center justify-center">
                    <Download className="w-5 h-5 text-paper" />
                  </div>
                  <h3 className="font-display text-xl text-ink">PDFにする</h3>
                </div>
                <p className="text-sm text-ink-soft">
                  印刷して旅のお守りに。冊子もしおりサイズもワンクリックで作成。
                </p>
              </div>
              <div className="paper-card rounded-2xl p-6 relative">
                <span className="tape tape-mini tape-top-left" />
                <span className="stamp-mark stamp-mini">SHARE</span>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full hero-badge flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-paper" />
                  </div>
                  <h3 className="font-display text-xl text-ink">リンクで共有</h3>
                </div>
                <p className="text-sm text-ink-soft">
                  旅仲間にURLで共有。遠くにいても一緒に計画できる。
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="trip-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex flex-col items-center mb-10">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px flex-1 max-w-[100px] section-rule" />
                <h2 className="font-display text-3xl section-title text-ink flex items-center gap-3">
                  <Map className="w-7 h-7 text-accent-coral" />
                  <span>作成したしおり</span>
                </h2>
                <div className="h-px flex-1 max-w-[100px] section-rule section-rule-reverse" />
              </div>
            </div>

            <div className="paper-card rounded-2xl p-4 mb-8">
              <div className="trip-toolbar">
                <div>
                  <p className="font-ui text-xs text-ink-soft">
                    {searchQuery
                      ? `${visibleTrips.length}冊が見つかりました`
                      : `全${trips.length}冊`}
                  </p>
                  <p className="font-display text-2xl text-ink">しおり一覧</p>
                </div>
                <div className="trip-toolbar-actions">
                  <div className="trip-toolbar-search">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="input-paper font-body"
                      placeholder="タイトル・目的地・メンバーで検索"
                    />
                    {searchQuery ? (
                      <motion.button
                        onClick={() => setSearchQuery("")}
                        className="btn btn-ghost px-4 py-2 text-xs"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                      >
                        クリア
                      </motion.button>
                    ) : null}
                  </div>
                  <div className="trip-toolbar-sort">
                    <motion.button
                      onClick={() => setSortOrder("recent")}
                      className={`choice-pill px-4 py-2 text-xs ${
                        sortOrder === "recent" ? "is-selected" : ""
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                    >
                      新しい順
                    </motion.button>
                    <motion.button
                      onClick={() => setSortOrder("oldest")}
                      className={`choice-pill px-4 py-2 text-xs ${
                        sortOrder === "oldest" ? "is-selected" : ""
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                    >
                      古い順
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {trips.length === 0 ? (
              <motion.div
                className="paper-card paper-stack rounded-2xl p-16 text-center max-w-lg mx-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BookOpen
                    className="w-16 h-16 mx-auto mb-6 text-accent-coral opacity-40"
                    strokeWidth={1.5}
                  />
                </motion.div>
                <p className="text-xl text-ink font-body mb-2">
                  まだしおりがありません
                </p>
                <p className="text-ink-soft text-sm">
                  上のボタンから最初のしおりを作成しましょう
                </p>
              </motion.div>
            ) : visibleTrips.length === 0 ? (
              <motion.div
                className="paper-card rounded-2xl p-12 text-center max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-display text-2xl text-ink mb-2">
                  一致するしおりがありません
                </p>
                <p className="text-sm text-ink-soft mb-6">
                  検索条件を変えてみてください。
                </p>
                <motion.button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost px-6 py-3 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                >
                  検索をクリア
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence>
                  {visibleTrips.map((trip, index) => {
                    const dayCount = trip.dayPlans.length;
                    const memberCount = trip.members.length;
                    return (
                      <motion.article
                        key={trip.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.06 }}
                        className="group paper-card paper-stack rounded-2xl p-5 relative"
                      >
                        <span className="tape tape-mini tape-top-left" />
                        <span className="tape tape-mini tape-bottom-right" />

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-ui text-xs text-ink-soft">
                              更新 {formatDate(trip.updatedAt)}
                            </p>
                            <h3 className="font-display text-2xl text-ink mt-1 line-clamp-2">
                              {trip.title}
                            </h3>
                          </div>
                          <span className="handwritten-label tilt-right is-compact">
                            {templateLabels[trip.templateType]}
                          </span>
                        </div>

                        <div className="note-card p-3 mt-3 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-ink">
                            <MapPin className="w-4 h-4 text-accent-coral" />
                            <span className="line-clamp-1">
                              {trip.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-ink">
                            <Calendar className="w-4 h-4 text-accent-sun" />
                            <span>
                              {formatDate(trip.startDate)} —
                              {" "}
                              {formatDate(trip.endDate)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="tag-pill text-xs px-3 py-1 font-ui">
                            メンバー {memberCount}名
                          </span>
                          <span className="tag-pill text-xs px-3 py-1 font-ui">
                            日程 {dayCount}日
                          </span>
                          {trip.aiEnabled && (
                            <span className="tag-pill text-xs px-3 py-1 font-ui">
                              AI
                            </span>
                          )}
                          {trip.shareToken && (
                            <span className="tag-pill text-xs px-3 py-1 font-ui">
                              共有中
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <motion.button
                            onClick={() => handleViewTrip(trip)}
                            className="btn btn-primary btn-pill px-6 py-2.5 text-sm"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                          >
                            開く
                          </motion.button>
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => handleEditTrip(trip)}
                              className="action-chip"
                              aria-label="編集"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleShareTrip(trip)}
                              className="action-chip"
                              aria-label="共有"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                            >
                              <Share2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="action-chip danger"
                              aria-label="削除"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.section>
        </div>

        <motion.footer
          className="footer-ink py-8 mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Feather className="w-5 h-5 text-accent-sun" />
              <span className="font-display text-lg text-paper">
                たびNote
              </span>
            </div>
            <p className="text-sm font-ui">旅の思い出を、あなたらしく</p>
          </div>
        </motion.footer>
        {renderBlockingOverlay()}
      </div>
    );
  }

  if (view === "create") {
    return (
      <motion.div
        className="min-h-screen ink-wash py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full hero-badge flex items-center justify-center">
                <Feather className="w-6 h-6 text-paper" />
              </div>
            </div>
            <h1 className="font-display text-4xl text-ink">
              {currentTrip ? "しおりを編集" : "新しいしおりを作成"}
            </h1>
            <div className="decorative-line mx-auto mt-4" />
          </motion.div>

          <TripForm
            initialTrip={currentTrip || undefined}
            onSave={handleSaveTrip}
            onCancel={handleBackToHome}
            isBusy={blockState.active}
            busyLabel={blockState.message}
          />
        </div>
        {renderBlockingOverlay()}
      </motion.div>
    );
  }

  if (view === "preview" && currentTrip) {
    return (
      <motion.div
        className="min-h-screen ink-wash py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            className="paper-card rounded-xl p-6 mb-8"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <motion.button
                onClick={handleBackToHome}
                className="px-6 py-3 btn btn-ghost btn-pill flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
              >
                <span>←</span>
                <span>ホームに戻る</span>
              </motion.button>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={() => handleEditTrip(currentTrip)}
                  className="flex items-center gap-2 px-6 py-3 btn btn-soft btn-pill"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                >
                  <Edit className="w-5 h-5" strokeWidth={2} />
                  編集
                </motion.button>
                <motion.button
                  onClick={() => setView("editor")}
                  className="flex items-center gap-2 px-6 py-3 btn btn-soft btn-pill"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                >
                  <Pencil className="w-5 h-5" strokeWidth={2} />
                  デザイン編集
                </motion.button>
                <motion.button
                  onClick={() => handleShareTrip(currentTrip)}
                  className="flex items-center gap-2 px-6 py-3 btn btn-secondary btn-pill"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                >
                  <Share2 className="w-5 h-5" strokeWidth={2} />
                  共有
                </motion.button>
                <motion.button
                  onClick={() => setShowPdfExport(!showPdfExport)}
                  className="flex items-center gap-2 px-6 py-3 btn btn-primary btn-pill"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                >
                  <Download className="w-5 h-5" strokeWidth={2} />
                  PDF書き出し
                </motion.button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showPdfExport && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <PdfExport trip={currentTrip} />
              </motion.div>
            )}
          </AnimatePresence>

          <TripPreview trip={currentTrip} />
        </div>
        {renderBlockingOverlay()}
      </motion.div>
    );
  }

  if (view === "editor" && currentTrip) {
    const handleRegenerateDesign = async (renderMode: DesignRenderMode) => {
      setBlockState({
        active: true,
        title: "デザインを再生成中",
        message: "レイアウト素材を再作成しています。",
        progress: { current: 0, total: 6 },
      });

      try {
        const pages = await generateDesignPages(
          currentTrip,
          (current, total) => {
            setBlockState({
              active: true,
              title: "デザインを再生成中",
              message: `レイアウト素材を再作成しています。(${current}/${total})`,
              progress: { current, total },
            });
          },
          renderMode,
        );
        const nextTrip: Trip = {
          ...currentTrip,
          design: {
            style: currentTrip.templateType,
            format: currentTrip.formatType,
            renderMode,
            pages,
            updatedAt: new Date().toISOString(),
          },
        };
        const savedTrip = await safeSaveTrip(nextTrip);
        setCurrentTrip(savedTrip);
        await refreshTrips();
      } catch (error) {
        console.error(error);
        alert("デザイン再生成に失敗しました。もう一度お試しください。");
      } finally {
        setBlockState({ active: false, title: "" });
      }
    };

    return (
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <DesignEditor
          trip={currentTrip}
          onSave={async (updatedTrip) => {
            const saved = await safeSaveTrip(updatedTrip);
            setCurrentTrip(saved);
            await refreshTrips();
          }}
          onBack={() => setView("preview")}
          onRegenerate={handleRegenerateDesign}
        />
        {renderBlockingOverlay()}
      </motion.div>
    );
  }

  return null;
}

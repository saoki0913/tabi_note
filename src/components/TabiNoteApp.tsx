"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  Download,
  Edit,
  Eye,
  Loader2,
  Palette,
  MapPin,
  Plane,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  DesignMode,
  Trip,
  TripDesignImage,
  TripDesignPage,
} from "../types/trip";
import { generateAiContent } from "../lib/ai";
import { generateId, generateShareToken, storage } from "../lib/storage";
import { PdfExport } from "./PdfExport";
import { TripForm } from "./TripForm";
import { TripPreview } from "./TripPreview";

type View = "home" | "create" | "preview";
type ProgressState = { current: number; total: number } | null;
type BlockState = {
  active: boolean;
  title: string;
  message?: string;
  progress?: ProgressState;
};

const formatDate = (date: string) => {
  if (!date) return "";
  const parsed = new Date(date);
  return `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`;
};

export function TabiNoteApp() {
  const [view, setView] = useState<View>("home");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [showPdfExport, setShowPdfExport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [designProgress, setDesignProgress] = useState<ProgressState>(null);
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
      setIsLoading(true);
      const nextTrips = await storage.getTrips();
      if (!active) return;
      setTrips(nextTrips);
      setIsLoading(false);
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
      renderMode?: "background" | "full";
    },
  ): Promise<TripDesignImage> => {
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
        renderMode: options?.renderMode ?? "full",
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
    };

    return {
      base64: payload.base64,
      mimeType: payload.mimeType,
      prompt: payload.prompt,
      createdAt: new Date().toISOString(),
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
    renderMode: "background" | "full" = "background",
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
      });
    }

    return pages;
  };

  const handleGenerateDesign = async () => {
    if (!currentTrip) return;
    setIsGeneratingDesign(true);
    setDesignProgress(null);
    setBlockState({
      active: true,
      title: "デザインを生成中",
      message: "レイアウト素材を作成しています。",
      progress: { current: 0, total: 6 },
    });

    try {
      const renderMode: "background" | "full" = "background";
      const pages = await generateDesignPages(
        currentTrip,
        (current, total) => {
          setDesignProgress({ current, total });
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
      await refreshTrips();
      setCurrentTrip(savedTrip);
      alert("デザインテンプレートを生成しました。");
    } catch (error) {
      console.error(error);
      alert("デザイン生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGeneratingDesign(false);
      setDesignProgress(null);
      setBlockState({ active: false, title: "" });
    }
  };

  const handleCreateNew = () => {
    setCurrentTrip(null);
    setView("create");
  };

  const handleSaveTrip = async (trip: Trip) => {
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
      const renderMode: "background" | "full" = "background";
      const pages = await generateDesignPages(
        savedTrip,
        (current, total) => {
          setDesignProgress({ current, total });
          setBlockState({
            active: true,
            title: "しおりを作成中",
            message: `デザインを生成しています。(${current}/${total})`,
            progress: { current, total },
          });
        },
        renderMode,
      );
      const withDesign: Trip = {
        ...savedTrip,
        design: {
          style: savedTrip.templateType,
          format: savedTrip.formatType,
          renderMode,
          pages,
          updatedAt: new Date().toISOString(),
        },
      };
      finalTrip = await safeSaveTrip(withDesign);
    } catch (error) {
      console.error(error);
      alert("デザイン生成に失敗しました。再度お試しください。");
    } finally {
      setDesignProgress(null);
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

  const handleViewTrip = (trip: Trip) => {
    setCurrentTrip(trip);
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

  const renderBlockingOverlay = () => {
    if (!blockState.active) return null;
    const progress = blockState.progress;
    const percent = progress
      ? Math.round((progress.current / progress.total) * 100)
      : 0;
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,18,14,0.55)] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="paper-card px-8 py-7 max-w-sm w-full">
          <div className="flex items-center gap-3 text-[var(--ink)]">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            <span className="text-base font-semibold">{blockState.title}</span>
          </div>
          {blockState.message && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              {blockState.message}
            </p>
          )}
          {progress && (
            <div className="mt-5">
              <div className="h-2 w-full rounded-full bg-[var(--line)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--sage)] transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
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
      <div className="app-shell text-[var(--ink)]">
        <motion.div
          className="pointer-events-none absolute top-24 right-10 text-[var(--accent)]/25"
          animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          <Plane className="h-12 w-12" />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute bottom-24 left-16 text-[var(--ocean)]/25"
          animate={{ y: [0, 18, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 0.4 }}
        >
          <MapPin className="h-10 w-10" />
        </motion.div>

        <motion.header
          className="relative"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-6 pt-16 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 shadow-sm">
                  <BookOpen className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="section-kicker">Travel note maker</p>
                  <p className="text-sm text-[var(--muted)]">
                    旅のしおりをサクッと
                  </p>
                </div>
              </div>
              <div className="badge-outline">since 2024</div>
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="sticker">AIレイアウト</span>
                  <span className="sticker teal">共有リンク</span>
                  <span className="sticker sun">PDF</span>
                </div>
                <h1 className="section-title">たびNote</h1>
                <p className="mt-5 text-lg text-[var(--muted)] text-balance">
                  予定・メンバー・持ち物をまとめて、カラフルに仕上げる旅のしおり。
                  伝えたい情報を、かわいく読みやすくまとめます。
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <motion.button
                    onClick={handleCreateNew}
                    className="btn-primary inline-flex items-center gap-3"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                  >
                    <Plus className="h-5 w-5" />
                    新しいしおりを作る
                  </motion.button>
                  <span className="badge-solid">5分で完成</span>
                </div>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                  <span className="chip">入力</span>
                  <span className="chip">デザイン生成</span>
                  <span className="chip">共有・PDF</span>
                </div>
              </div>

              <motion.div
                className="paper-card p-6 md:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <p className="section-kicker">Flow</p>
                  <Plane className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
                  3ステップで完成
                </h3>
                <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
                  {[
                    {
                      title: "入力",
                      body: "旅程やメンバーをまとめて整理。",
                    },
                    {
                      title: "デザイン",
                      body: "AIがしおり用レイアウトを生成。",
                    },
                    {
                      title: "共有",
                      body: "URL共有やPDFで配布。",
                    },
                  ].map((item, index) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-white text-sm font-semibold text-[var(--accent-strong)]">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {item.title}
                        </p>
                        <p>{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative mt-6 h-40">
                  <div className="absolute left-0 top-4 w-36 rounded-2xl border-2 border-[var(--line)] bg-white/90 p-3 shadow-md rotate-[-6deg]">
                    <div className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--muted)]">
                      Cover
                    </div>
                    <div className="mt-2 h-16 rounded-xl bg-gradient-to-br from-[var(--accent-soft)] to-white" />
                    <div className="mt-2 h-2 w-12 rounded-full bg-[var(--accent)]/80" />
                  </div>
                  <div className="absolute left-20 top-0 w-36 rounded-2xl border-2 border-[var(--line)] bg-white/90 p-3 shadow-md rotate-[4deg]">
                    <div className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--muted)]">
                      Schedule
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="h-2 w-full rounded-full bg-[var(--line)]" />
                      <div className="h-2 w-4/5 rounded-full bg-[var(--line)]" />
                      <div className="h-2 w-3/5 rounded-full bg-[var(--line)]" />
                    </div>
                    <div className="mt-3 h-6 rounded-lg bg-[var(--sky)]/40" />
                  </div>
                  <div className="absolute right-0 top-10 w-32 rounded-2xl border-2 border-[var(--line)] bg-white/90 p-3 shadow-md rotate-[10deg]">
                    <div className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--muted)]">
                      Check
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="h-2 w-3/4 rounded-full bg-[var(--line)]" />
                      <div className="h-2 w-2/3 rounded-full bg-[var(--line)]" />
                      <div className="h-2 w-1/2 rounded-full bg-[var(--line)]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <main className="container mx-auto px-6 pb-16 max-w-6xl relative z-10">
          <section className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="section-kicker">Library</p>
                <h2 className="text-3xl md:text-4xl font-semibold text-[var(--ink)]">
                  作成したしおり
                </h2>
              </div>
              {!isLoading && (
                <p className="text-sm text-[var(--muted)]">
                  全 {trips.length} 件
                </p>
              )}
            </div>

            {isLoading ? (
              <motion.div
                className="paper-card p-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="flex items-center justify-center mb-4 text-[var(--accent)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-12 h-12" />
                </motion.div>
                <p className="text-lg text-[var(--muted)]">
                  しおりを読み込み中...
                </p>
              </motion.div>
            ) : trips.length === 0 ? (
              <motion.div
                className="paper-card p-12 text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-[var(--accent)]/60" />
                <p className="text-xl font-semibold text-[var(--ink)]">
                  まだしおりがありません
                </p>
                <p className="text-sm text-[var(--muted)] mt-2">
                  上のボタンから作成を始めましょう。
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {trips.map((trip, index) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -6 }}
                      className="paper-card overflow-hidden"
                    >
                      <div className="border-b border-[var(--line)] p-6 bg-white/80">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="section-kicker">Trip</p>
                            <h3 className="mt-3 text-2xl font-semibold line-clamp-2 text-[var(--ink)]">
                              {trip.title}
                            </h3>
                          </div>
                          <Plane className="w-5 h-5 text-[var(--accent)]/60" />
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[var(--accent)]" />
                            <span className="line-clamp-1">
                              {trip.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[var(--accent)]" />
                            <span>
                              {formatDate(trip.startDate)} 〜{" "}
                              {formatDate(trip.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-5">
                        <div className="flex flex-wrap gap-2">
                          {trip.members.slice(0, 3).map((member) => (
                            <span key={member.id} className="chip">
                              {member.name}
                            </span>
                          ))}
                          {trip.members.length > 3 && (
                            <span className="chip text-[var(--muted)]">
                              +{trip.members.length - 3}人
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            onClick={() => handleViewTrip(trip)}
                            className="btn-outline flex items-center justify-center gap-2 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                          >
                            <Eye className="w-4 h-4" />
                            表示
                          </motion.button>
                          <motion.button
                            onClick={() => handleShareTrip(trip)}
                            className="btn-outline flex items-center justify-center gap-2 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                          >
                            <Share2 className="w-4 h-4" />
                            共有
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditTrip(trip)}
                            className="btn-ghost flex items-center justify-center gap-2 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                          >
                            <Edit className="w-4 h-4" />
                            編集
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="btn-danger flex items-center justify-center gap-2 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                            削除
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </main>

        <footer className="border-t border-[var(--line)] py-8">
          <div className="container mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-[var(--accent)]" />
              たびNote
            </div>
            <span>思い出に残る旅のしおりを簡単に作成</span>
          </div>
        </footer>
        {renderBlockingOverlay()}
      </div>
    );
  }

  if (view === "create") {
    return (
      <motion.div
        className="app-shell py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <p className="section-kicker">Create</p>
            <h1 className="section-title mt-3">
              {currentTrip ? "しおりを編集" : "新しいしおりを作成"}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              入力内容に合わせて、しおりのデザインを整えます。
            </p>
          </motion.div>

          <TripForm
            initialTrip={currentTrip || undefined}
            onSave={handleSaveTrip}
            onCancel={handleBackToHome}
            isBusy={blockState.active}
            busyLabel={blockState.active ? blockState.message || blockState.title : ""}
          />
        </div>
        {renderBlockingOverlay()}
      </motion.div>
    );
  }

  if (view === "preview" && currentTrip) {
    return (
      <motion.div
        className="app-shell py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            className="paper-card p-6 md:p-8 mb-8"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <motion.button
                onClick={handleBackToHome}
                className="btn-outline flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
              >
                ← ホームに戻る
              </motion.button>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={handleGenerateDesign}
                  className={`btn-primary flex items-center gap-2 ${
                    isGeneratingDesign ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  whileHover={isGeneratingDesign ? {} : { scale: 1.03 }}
                  whileTap={isGeneratingDesign ? {} : { scale: 0.96 }}
                  disabled={isGeneratingDesign}
                  type="button"
                >
                  <Palette className="w-5 h-5" />
                  {isGeneratingDesign
                    ? `デザイン生成中...${
                        designProgress
                          ? ` (${designProgress.current}/${designProgress.total})`
                          : ""
                      }`
                    : currentTrip.design
                      ? "デザイン再生成"
                      : "デザイン生成"}
                </motion.button>
                <motion.button
                  onClick={() => handleEditTrip(currentTrip)}
                  className="btn-outline flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                >
                  <Edit className="w-5 h-5" />
                  編集
                </motion.button>
                <motion.button
                  onClick={() => handleShareTrip(currentTrip)}
                  className="btn-outline flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                >
                  <Share2 className="w-5 h-5" />
                  共有リンク
                </motion.button>
                <motion.button
                  onClick={() => setShowPdfExport((prev) => !prev)}
                  className="btn-secondary flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                >
                  <Download className="w-5 h-5" />
                  PDF書き出し
                </motion.button>
              </div>
            </div>
            {currentTrip.design &&
              (currentTrip.design.style !== currentTrip.templateType ||
                currentTrip.design.format !== currentTrip.formatType) && (
                <div className="mt-4 text-sm text-[var(--accent-strong)] font-semibold">
                  現在のスタイル/フォーマットと生成済みデザインが一致しません。再生成がおすすめです。
                </div>
              )}
          </motion.div>

            {showPdfExport && (
              <div className="mb-8">
                <PdfExport trip={currentTrip} />
              </div>
            )}

          <TripPreview trip={currentTrip} />
        </div>
        {renderBlockingOverlay()}
      </motion.div>
    );
  }

  return null;
}

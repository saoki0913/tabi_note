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
import type { DesignMode, Trip, TripDesignPage } from "../types/trip";
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
  ) => {
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
        renderMode: "full",
      });
      pages.push({
        id: generateId(),
        mode: request.mode,
        label: request.label,
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
      const pages = await generateDesignPages(currentTrip, (current, total) => {
        setDesignProgress({ current, total });
        setBlockState({
          active: true,
          title: "デザインを生成中",
          message: `レイアウト素材を作成しています。(${current}/${total})`,
          progress: { current, total },
        });
      });
      const nextTrip: Trip = {
        ...currentTrip,
        design: {
          style: currentTrip.templateType,
          format: currentTrip.formatType,
          renderMode: "full",
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
      const pages = await generateDesignPages(savedTrip, (current, total) => {
        setDesignProgress({ current, total });
        setBlockState({
          active: true,
          title: "しおりを作成中",
          message: `デザインを生成しています。(${current}/${total})`,
          progress: { current, total },
        });
      });
      const withDesign: Trip = {
        ...savedTrip,
        design: {
          style: savedTrip.templateType,
          format: savedTrip.formatType,
          renderMode: "full",
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-pink-200 px-10 py-8 text-center max-w-sm w-full">
          <div className="flex items-center justify-center gap-3 text-pink-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-bold">{blockState.title}</span>
          </div>
          {blockState.message && (
            <p className="mt-3 text-sm text-gray-600">{blockState.message}</p>
          )}
          {progress && (
            <div className="mt-6">
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
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
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-orange-100 overflow-hidden relative">
        <motion.div
          className="absolute top-20 left-10 text-pink-400 opacity-20"
          animate={{ y: [0, -20, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Plane className="w-16 h-16" />
        </motion.div>
        <motion.div
          className="absolute top-40 right-20 text-purple-400 opacity-20"
          animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}
        >
          <MapPin className="w-14 h-14" />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-1/4 text-orange-300 opacity-30"
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        >
          <Sparkles className="w-12 h-12" />
        </motion.div>

        <motion.header
          className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white py-12 shadow-2xl relative overflow-hidden"
          initial={{ y: -120 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 90 }}
        >
          <div className="absolute inset-0 bg-white opacity-10">
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:50px_50px]"
              animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="flex items-center justify-center gap-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <BookOpen className="w-16 h-16 drop-shadow-lg" />
              </motion.div>
              <div className="text-center">
                <motion.h1
                  className="text-6xl font-bold drop-shadow-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  たびNote
                </motion.h1>
                <motion.p
                  className="text-2xl mt-2 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  ✨ 5分でできる旅のしおり ✨
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        <main className="container mx-auto px-4 py-16 max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white rounded-3xl shadow-2xl text-2xl font-bold relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              type="button"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Plus className="relative z-10 w-8 h-8" />
              <span className="relative z-10">新しいしおりを作る</span>
              <Sparkles className="relative z-10 w-7 h-7" />
            </motion.button>
          </motion.div>

          <section>
            <div className="flex items-center gap-4 justify-center mb-8">
              <Calendar className="w-10 h-10 text-pink-600" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
                作成したしおり
              </h2>
            </div>

            {isLoading ? (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-16 text-center border-4 border-pink-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="flex items-center justify-center mb-6 text-pink-300"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-16 h-16" />
                </motion.div>
                <p className="text-2xl text-gray-600 font-bold">
                  しおりを読み込み中...
                </p>
              </motion.div>
            ) : trips.length === 0 ? (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-16 text-center border-4 border-pink-300"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <BookOpen className="w-24 h-24 mx-auto mb-6 text-pink-300" />
                <p className="text-2xl text-gray-600 font-bold">
                  まだしおりがありません
                </p>
                <p className="text-gray-500 mt-3 text-lg">
                  上のボタンから作成を始めましょう！
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
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-pink-300 hover:border-pink-400 hover:shadow-2xl transition-all"
                    >
                      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white p-8 relative overflow-hidden">
                        <motion.div
                          className="absolute top-0 right-0 text-white/30"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        >
                          <Plane className="w-14 h-14" />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-3 line-clamp-2 relative z-10">
                          {trip.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm opacity-90 relative z-10">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{trip.destination}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm opacity-90 mt-2 relative z-10">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(trip.startDate)} 〜{" "}
                            {formatDate(trip.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-wrap gap-2 mb-5">
                          {trip.members.slice(0, 3).map((member) => (
                            <span
                              key={member.id}
                              className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-4 py-2 rounded-full font-medium shadow-sm"
                            >
                              {member.name}
                            </span>
                          ))}
                          {trip.members.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-medium">
                              +{trip.members.length - 3}人
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            onClick={() => handleViewTrip(trip)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition text-sm font-bold shadow-md"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                          >
                            <Eye className="w-4 h-4" />
                            表示
                          </motion.button>
                          <motion.button
                            onClick={() => handleShareTrip(trip)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition text-sm font-bold shadow-md"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                          >
                            <Share2 className="w-4 h-4" />
                            共有
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditTrip(trip)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition text-sm font-bold shadow-md"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                          >
                            <Edit className="w-4 h-4" />
                            編集
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition text-sm font-bold shadow-md"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
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

        <footer className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white py-8 mt-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl font-medium flex items-center justify-center gap-3">
              <Plane className="w-6 h-6" />
              たびNote - 思い出に残る旅のしおりを簡単に作成
              <BookOpen className="w-6 h-6" />
            </p>
          </div>
        </footer>
        {renderBlockingOverlay()}
      </div>
    );
  }

  if (view === "create") {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-orange-100 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-8"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-5xl font-bold text-gray-800 flex items-center justify-center gap-4">
              <BookOpen className="w-12 h-12 text-pink-500" />
              <span className="bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
                {currentTrip ? "しおりを編集" : "新しいしおりを作成"}
              </span>
            </h1>
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
        className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-orange-100 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-pink-300"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <motion.button
                onClick={handleBackToHome}
                className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition font-bold shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
              >
                ← ホームに戻る
              </motion.button>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={handleGenerateDesign}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl transition font-bold shadow-lg ${
                    isGeneratingDesign
                      ? "bg-gray-200 text-gray-500"
                      : "bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 text-white hover:shadow-2xl"
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
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition font-bold shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                >
                  <Edit className="w-5 h-5" />
                  編集
                </motion.button>
                <motion.button
                  onClick={() => handleShareTrip(currentTrip)}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition font-bold shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                >
                  <Share2 className="w-5 h-5" />
                  共有リンク
                </motion.button>
                <motion.button
                  onClick={() => setShowPdfExport((prev) => !prev)}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white rounded-xl hover:shadow-2xl transition font-bold shadow-lg"
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
                <div className="mt-4 text-sm text-amber-600 font-semibold">
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

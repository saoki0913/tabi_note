"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Share2 } from "lucide-react";
import type { Trip } from "@/types/trip";
import { storage } from "@/lib/storage";
import { TripPreview } from "@/components/TripPreview";

interface SharePageProps {
  params: {
    token: string;
  };
}

export default function SharePage({ params }: SharePageProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTrip = async () => {
      setIsLoading(true);
      const sharedTrip = await storage.getTripByShareToken(params.token);
      if (!active) return;
      setTrip(sharedTrip);
      setIsLoading(false);
    };
    loadTrip();
    return () => {
      active = false;
    };
  }, [params.token]);

  return (
    <div className="app-shell py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          className="paper-card p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--line)] bg-white/80">
              <BookOpen className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--ink)]">たびNote</p>
              <p className="text-sm text-[var(--muted)]">
                共有しおりプレビュー
              </p>
            </div>
          </div>
          <div className="sticker teal">
            <Share2 className="w-4 h-4" />
            閲覧専用
          </div>
        </motion.div>

        {isLoading && (
          <motion.div
            className="paper-card p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-lg font-semibold text-[var(--muted)]">
              共有しおりを読み込み中...
            </p>
          </motion.div>
        )}

        {!isLoading && !trip && (
          <motion.div
            className="paper-card p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xl font-semibold text-[var(--ink)]">
              共有リンクが見つかりませんでした
            </p>
            <p className="text-sm text-[var(--muted)] mt-3">
              リンクが正しいか確認してください。
            </p>
          </motion.div>
        )}

        {!isLoading && trip && <TripPreview trip={trip} />}
      </div>
    </div>
  );
}

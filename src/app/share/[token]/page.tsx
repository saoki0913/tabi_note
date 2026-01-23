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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-orange-100 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-pink-300 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-pink-500" />
            <div>
              <p className="text-xl font-bold text-gray-800">たびNote</p>
              <p className="text-sm text-gray-500">共有しおりプレビュー</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border-2 border-pink-200 px-4 py-2 text-sm font-semibold text-pink-600 bg-white">
            <Share2 className="w-4 h-4" />
            閲覧専用
          </div>
        </motion.div>

        {isLoading && (
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-16 text-center border-4 border-pink-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-2xl font-bold text-gray-600">
              共有しおりを読み込み中...
            </p>
          </motion.div>
        )}

        {!isLoading && !trip && (
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-16 text-center border-4 border-pink-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-2xl font-bold text-gray-600">
              共有リンクが見つかりませんでした
            </p>
            <p className="text-gray-500 mt-3">
              リンクが正しいか確認してください。
            </p>
          </motion.div>
        )}

        {!isLoading && trip && <TripPreview trip={trip} />}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar,
  Check,
  Home,
  MapPin,
  Package,
  Plane,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { DayPlan, Lodging, Trip, WantItem } from "../types/trip";
import { generateId } from "../lib/storage";

interface TripFormProps {
  initialTrip?: Trip;
  onSave: (trip: Trip) => Promise<void> | void;
  onCancel: () => void;
  isBusy?: boolean;
  busyLabel?: string;
}

const createBlankTrip = (): Trip => ({
  id: generateId(),
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  transportText: "",
  notes: "",
  members: [],
  lodgings: [],
  wantItems: [],
  dayPlans: [],
  templateType: "minimal",
  formatType: "classic",
  aiEnabled: true,
  aiTone: "casual",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const templateOptions = [
  {
    value: "minimal",
    label: "シンプル",
    description: "すっきり見やすい",
    emoji: "🧾",
    active: "border-slate-500 bg-slate-100 scale-105",
    inactive: "border-slate-300 hover:border-slate-400 bg-white",
  },
  {
    value: "pop",
    label: "ポップ",
    description: "明るく元気に",
    emoji: "🎨",
    active: "border-pink-500 bg-pink-100 scale-105",
    inactive: "border-gray-300 hover:border-pink-400 bg-white",
  },
  {
    value: "retro",
    label: "レトロ",
    description: "ヴィンテージ感",
    emoji: "📻",
    active: "border-amber-500 bg-amber-100 scale-105",
    inactive: "border-gray-300 hover:border-amber-400 bg-white",
  },
  {
    value: "romantic",
    label: "ロマンチック",
    description: "甘くやさしい",
    emoji: "💐",
    active: "border-rose-400 bg-rose-100 scale-105",
    inactive: "border-gray-300 hover:border-rose-300 bg-white",
  },
  {
    value: "photo",
    label: "写真多め",
    description: "アルバム風",
    emoji: "📸",
    active: "border-blue-500 bg-blue-100 scale-105",
    inactive: "border-gray-300 hover:border-blue-400 bg-white",
  },
  {
    value: "modern",
    label: "モダン",
    description: "洗練された印象",
    emoji: "🧊",
    active: "border-indigo-500 bg-indigo-100 scale-105",
    inactive: "border-gray-300 hover:border-indigo-400 bg-white",
  },
  {
    value: "nature",
    label: "ナチュラル",
    description: "自然で穏やか",
    emoji: "🌿",
    active: "border-emerald-500 bg-emerald-100 scale-105",
    inactive: "border-gray-300 hover:border-emerald-400 bg-white",
  },
  {
    value: "adventure",
    label: "アドベンチャー",
    description: "旅情あふれる",
    emoji: "🧭",
    active: "border-sky-500 bg-sky-100 scale-105",
    inactive: "border-gray-300 hover:border-sky-400 bg-white",
  },
] as const;

const formatOptions = [
  {
    value: "classic",
    label: "スタンダード",
    description: "情報整理を重視",
    emoji: "📘",
    active: "border-gray-700 bg-gray-100 scale-105",
    inactive: "border-gray-300 hover:border-gray-500 bg-white",
  },
  {
    value: "collage",
    label: "コラージュ",
    description: "写真や素材を重ねる",
    emoji: "🧷",
    active: "border-orange-500 bg-orange-100 scale-105",
    inactive: "border-gray-300 hover:border-orange-400 bg-white",
  },
  {
    value: "notebook",
    label: "ノート",
    description: "手帳風の余白",
    emoji: "📓",
    active: "border-lime-500 bg-lime-100 scale-105",
    inactive: "border-gray-300 hover:border-lime-400 bg-white",
  },
  {
    value: "timeline",
    label: "タイムライン",
    description: "時系列を強調",
    emoji: "🕒",
    active: "border-teal-500 bg-teal-100 scale-105",
    inactive: "border-gray-300 hover:border-teal-400 bg-white",
  },
] as const;

export function TripForm({
  initialTrip,
  onSave,
  onCancel,
  isBusy,
  busyLabel,
}: TripFormProps) {
  const [trip, setTrip] = useState<Trip>(() =>
    initialTrip
      ? { ...initialTrip, formatType: initialTrip.formatType ?? "classic" }
      : createBlankTrip(),
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [newMemberName, setNewMemberName] = useState("");
  const [newWantItem, setNewWantItem] = useState("");
  const [editingLodging, setEditingLodging] = useState<Partial<Lodging>>({});
  const [isSaving, setIsSaving] = useState(false);
  const isBlocked = isSaving || Boolean(isBusy);
  const submitLabel = isBlocked
    ? busyLabel || "作成中..."
    : "しおりを作成";

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setTrip({
      ...trip,
      members: [
        ...trip.members,
        { id: generateId(), name: newMemberName.trim() },
      ],
    });
    setNewMemberName("");
  };

  const handleRemoveMember = (id: string) => {
    setTrip({
      ...trip,
      members: trip.members.filter((member) => member.id !== id),
    });
  };

  const handleAddWantItem = () => {
    if (!newWantItem.trim()) return;
    const nextItem: WantItem = {
      id: generateId(),
      text: newWantItem.trim(),
      sortOrder: trip.wantItems.length,
    };
    setTrip({
      ...trip,
      wantItems: [...trip.wantItems, nextItem],
    });
    setNewWantItem("");
  };

  const handleRemoveWantItem = (id: string) => {
    setTrip({
      ...trip,
      wantItems: trip.wantItems.filter((item) => item.id !== id),
    });
  };

  const handleAddLodging = () => {
    if (!editingLodging.name?.trim()) return;
    const nextLodging: Lodging = {
      id: generateId(),
      name: editingLodging.name || "",
      address: editingLodging.address || "",
      checkin: editingLodging.checkin || "",
      checkout: editingLodging.checkout || "",
      url: editingLodging.url || "",
      phone: editingLodging.phone || "",
      memo: editingLodging.memo || "",
    };
    setTrip({
      ...trip,
      lodgings: [...trip.lodgings, nextLodging],
    });
    setEditingLodging({});
  };

  const handleRemoveLodging = (id: string) => {
    setTrip({
      ...trip,
      lodgings: trip.lodgings.filter((lodging) => lodging.id !== id),
    });
  };

  const generateDayPlans = () => {
    if (!trip.startDate || !trip.endDate) return;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const plans: DayPlan[] = [];
    for (let i = 0; i < diffDays; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const existingPlan = trip.dayPlans.find((plan) => plan.day === i + 1);
      plans.push({
        day: i + 1,
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        activities: existingPlan?.activities || [],
      });
    }
    setTrip({ ...trip, dayPlans: plans });
  };

  const handleAddActivity = (dayIndex: number) => {
    const activity = prompt("予定を入力してください:");
    if (!activity?.trim()) return;
    const nextPlans = [...trip.dayPlans];
    nextPlans[dayIndex].activities.push(activity.trim());
    setTrip({ ...trip, dayPlans: nextPlans });
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    const nextPlans = [...trip.dayPlans];
    nextPlans[dayIndex].activities.splice(activityIndex, 1);
    setTrip({ ...trip, dayPlans: nextPlans });
  };

  const handleNext = () => {
    if (isBlocked) return;
    if (currentStep === 1 && trip.startDate && trip.endDate) {
      generateDayPlans();
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    if (isBlocked) return;
    if (!trip.title || !trip.destination || !trip.startDate || !trip.endDate) {
      alert("タイトル、目的地、日程は必須です");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...trip, updatedAt: new Date().toISOString() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-10 flex items-center justify-center gap-3">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <motion.div
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                currentStep === step
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white scale-110"
                  : currentStep > step
                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                    : "bg-white border-4 border-gray-300 text-gray-400"
              }`}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {currentStep > step ? <Check className="w-7 h-7" /> : step}
            </motion.div>
            {step < 4 && (
              <div
                className={`w-16 h-2 rounded-full mx-2 ${
                  currentStep > step ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-pink-300"
        layout
      >
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              className="space-y-6"
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 bg-clip-text text-transparent">
                基本情報を入力 ✨
              </h2>

              <div>
                <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                  📝 旅のタイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trip.title}
                  onChange={(event) =>
                    setTrip({ ...trip, title: event.target.value })
                  }
                  className="w-full px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none text-lg shadow-sm transition"
                  placeholder="例: 沖縄3泊4日の旅"
                />
              </div>

              <div>
                <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-pink-500" />
                  目的地 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trip.destination}
                  onChange={(event) =>
                    setTrip({ ...trip, destination: event.target.value })
                  }
                  className="w-full px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none text-lg shadow-sm transition"
                  placeholder="例: 沖縄県那覇市"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-pink-500" />
                    出発日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={trip.startDate}
                    onChange={(event) =>
                      setTrip({ ...trip, startDate: event.target.value })
                    }
                    className="w-full px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none shadow-sm transition"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-pink-500" />
                    帰着日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={trip.endDate}
                    onChange={(event) =>
                      setTrip({ ...trip, endDate: event.target.value })
                    }
                    className="w-full px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none shadow-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                  <Plane className="w-6 h-6 text-pink-500" />
                  移動手段
                </label>
                <input
                  type="text"
                  value={trip.transportText}
                  onChange={(event) =>
                    setTrip({ ...trip, transportText: event.target.value })
                  }
                  className="w-full px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none text-lg shadow-sm transition"
                  placeholder="例: 飛行機、レンタカー"
                />
              </div>

              <div>
                <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  メンバー
                </label>
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(event) => setNewMemberName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddMember();
                      }
                    }}
                    className="flex-1 px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none shadow-sm transition"
                    placeholder="名前を入力"
                  />
                  <motion.button
                    onClick={handleAddMember}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl hover:from-pink-600 hover:to-pink-700 transition flex items-center justify-center gap-2 font-bold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                  >
                    <Plus className="w-5 h-5" />
                    追加
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence>
                    {trip.members.map((member) => (
                      <motion.div
                        key={member.id}
                        className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-6 py-3 rounded-full flex items-center gap-3 shadow-md"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="font-medium">{member.name}</span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="hover:text-pink-900 transition"
                          type="button"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              className="space-y-6"
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 bg-clip-text text-transparent">
                日程と予定 📅
              </h2>

              {trip.dayPlans.map((plan, dayIndex) => (
                <motion.div
                  key={plan.day}
                  className="border-2 border-pink-300 rounded-2xl p-8 bg-gradient-to-br from-pink-50 via-yellow-50 to-orange-50 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIndex * 0.1 }}
                >
                  <h3 className="text-3xl font-bold mb-5 text-pink-600">
                    Day {plan.day} - {plan.date}
                  </h3>
                  <div className="space-y-3 mb-5">
                    <AnimatePresence>
                      {plan.activities.map((activity, activityIndex) => (
                        <motion.div
                          key={`${plan.day}-${activityIndex}`}
                          className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <span className="flex-shrink-0 w-9 h-9 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                            {activityIndex + 1}
                          </span>
                          <span className="flex-1 text-lg">{activity}</span>
                          <motion.button
                            onClick={() =>
                              handleRemoveActivity(dayIndex, activityIndex)
                            }
                            className="text-red-500 hover:text-red-700 transition"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                          >
                            <X className="w-6 h-6" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    onClick={() => handleAddActivity(dayIndex)}
                    className="w-full py-4 border-2 border-dashed border-pink-400 rounded-xl text-pink-600 hover:bg-pink-100 transition flex items-center justify-center gap-3 font-bold text-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                  >
                    <Plus className="w-6 h-6" />
                    予定を追加
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              className="space-y-8"
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 bg-clip-text text-transparent">
                やりたいこと・宿泊先 🏨
              </h2>

              <div>
                <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                  <Package className="w-6 h-6 text-pink-500" />
                  やりたいことリスト
                </label>
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    value={newWantItem}
                    onChange={(event) => setNewWantItem(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddWantItem();
                      }
                    }}
                    className="flex-1 px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none shadow-sm transition"
                    placeholder="やりたいことを入力"
                  />
                  <motion.button
                    onClick={handleAddWantItem}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl hover:from-pink-600 hover:to-pink-700 transition flex items-center justify-center gap-2 font-bold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                  >
                    <Plus className="w-5 h-5" />
                    追加
                  </motion.button>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {trip.wantItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-pink-50 p-4 rounded-xl border-2 border-pink-200 shadow-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <span className="text-pink-500 text-2xl">✓</span>
                        <span className="flex-1 text-lg">{item.text}</span>
                        <motion.button
                          onClick={() => handleRemoveWantItem(item.id)}
                          className="text-red-500 hover:text-red-700 transition"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-3 text-xl flex items-center gap-2">
                  <Home className="w-6 h-6 text-pink-500" />
                  宿泊施設
                </label>

                <div className="space-y-4 mb-5">
                  <AnimatePresence>
                    {trip.lodgings.map((lodging) => (
                      <motion.div
                        key={lodging.id}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-2xl border-l-4 border-blue-500 shadow-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-xl text-blue-700">
                            {lodging.name}
                          </h4>
                          <motion.button
                            onClick={() => handleRemoveLodging(lodging.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                          >
                            <X className="w-6 h-6" />
                          </motion.button>
                        </div>
                        {lodging.address && (
                          <p className="text-sm text-gray-600 mb-1">
                            📍 {lodging.address}
                          </p>
                        )}
                        {lodging.checkin && (
                          <p className="text-sm">
                            チェックイン: {lodging.checkin}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 space-y-3 bg-blue-50/30">
                  <input
                    type="text"
                    value={editingLodging.name || ""}
                    onChange={(event) =>
                      setEditingLodging({
                        ...editingLodging,
                        name: event.target.value,
                      })
                    }
                    className="w-full px-5 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="宿泊施設名"
                  />
                  <input
                    type="text"
                    value={editingLodging.address || ""}
                    onChange={(event) =>
                      setEditingLodging({
                        ...editingLodging,
                        address: event.target.value,
                      })
                    }
                    className="w-full px-5 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="住所"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={editingLodging.checkin || ""}
                      onChange={(event) =>
                        setEditingLodging({
                          ...editingLodging,
                          checkin: event.target.value,
                        })
                      }
                      className="px-5 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="チェックイン"
                    />
                    <input
                      type="time"
                      value={editingLodging.checkout || ""}
                      onChange={(event) =>
                        setEditingLodging({
                          ...editingLodging,
                          checkout: event.target.value,
                        })
                      }
                      className="px-5 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="チェックアウト"
                    />
                  </div>
                  <input
                    type="tel"
                    value={editingLodging.phone || ""}
                    onChange={(event) =>
                      setEditingLodging({
                        ...editingLodging,
                        phone: event.target.value,
                      })
                    }
                    className="w-full px-5 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="電話番号"
                  />
                  <input
                    type="url"
                    value={editingLodging.url || ""}
                    onChange={(event) =>
                      setEditingLodging({
                        ...editingLodging,
                        url: event.target.value,
                      })
                    }
                    className="w-full px-5 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="URL"
                  />
                  <motion.button
                    onClick={handleAddLodging}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2 font-bold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                  >
                    <Plus className="w-5 h-5" />
                    宿泊施設を追加
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-3 text-xl">メモ・その他</label>
                <textarea
                  value={trip.notes}
                  onChange={(event) =>
                    setTrip({ ...trip, notes: event.target.value })
                  }
                  className="w-full px-6 py-4 border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none shadow-sm transition"
                  rows={4}
                  placeholder="その他のメモや注意事項など"
                />
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              className="space-y-8"
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 bg-clip-text text-transparent">
                デザインとAI設定 🎨
              </h2>

              <div>
                <label className="block font-bold mb-5 text-xl">
                  デザインスタイルを選択
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {templateOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() =>
                        setTrip({ ...trip, templateType: option.value })
                      }
                      className={`p-6 border-4 rounded-2xl transition shadow-lg ${
                        trip.templateType === option.value
                          ? option.active
                          : option.inactive
                      }`}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                    >
                      <div className="text-4xl mb-3">{option.emoji}</div>
                      <h3 className="font-bold text-lg mb-1">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-5 text-xl">
                  フォーマットを選択
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() =>
                        setTrip({ ...trip, formatType: option.value })
                      }
                      className={`p-6 border-4 rounded-2xl transition shadow-lg text-left ${
                        trip.formatType === option.value
                          ? option.active
                          : option.inactive
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{option.emoji}</span>
                        <div>
                          <h3 className="font-bold text-lg">
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div
                className="border-4 border-purple-300 rounded-2xl p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 shadow-lg"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                  <h3 className="text-2xl font-bold text-purple-700">
                    AI補完機能
                  </h3>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <input
                    type="checkbox"
                    checked={trip.aiEnabled}
                    onChange={(event) =>
                      setTrip({ ...trip, aiEnabled: event.target.checked })
                    }
                    className="w-7 h-7 accent-purple-500"
                  />
                  <label className="text-xl font-medium">
                    AIで文章を補完する
                  </label>
                </div>

                {trip.aiEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className="block font-bold mb-3 text-lg">
                      文章のトーン
                    </label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <motion.button
                        onClick={() => setTrip({ ...trip, aiTone: "polite" })}
                        className={`flex-1 py-4 px-6 rounded-xl border-2 transition font-bold text-lg shadow-md ${
                          trip.aiTone === "polite"
                            ? "border-purple-500 bg-purple-200 scale-105"
                            : "border-gray-300 hover:border-purple-400 bg-white"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                      >
                        丁寧
                      </motion.button>
                      <motion.button
                        onClick={() => setTrip({ ...trip, aiTone: "casual" })}
                        className={`flex-1 py-4 px-6 rounded-xl border-2 transition font-bold text-lg shadow-md ${
                          trip.aiTone === "casual"
                            ? "border-purple-500 bg-purple-200 scale-105"
                            : "border-gray-300 hover:border-purple-400 bg-white"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                      >
                        カジュアル
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <p className="text-sm text-gray-700 mt-6 bg-white/50 p-4 rounded-xl">
                  💡 AIが表紙コピー、概要文、見どころ要約などを自動生成します。入力内容は変更されません。
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row justify-between gap-4 mt-10 pt-8 border-t-4 border-pink-200">
          {currentStep > 1 ? (
            <motion.button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className={`px-10 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl transition font-bold text-lg shadow-lg ${
                isBlocked
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:from-gray-600 hover:to-gray-700"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isBlocked}
              type="button"
            >
              ← 戻る
            </motion.button>
          ) : (
            <motion.button
              onClick={onCancel}
              className={`px-10 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl transition font-bold text-lg shadow-lg ${
                isBlocked
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:from-gray-500 hover:to-gray-600"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isBlocked}
              type="button"
            >
              キャンセル
            </motion.button>
          )}

          {currentStep < 4 ? (
            <motion.button
              onClick={handleNext}
              className={`px-10 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white rounded-2xl transition font-bold text-lg shadow-lg ${
                isBlocked ? "opacity-60 cursor-not-allowed" : "hover:shadow-2xl"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isBlocked}
              type="button"
            >
              次へ →
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              className={`px-12 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-2xl transition font-bold text-xl shadow-lg flex items-center justify-center gap-3 ${
                isBlocked ? "opacity-60 cursor-not-allowed" : "hover:shadow-2xl"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isBlocked}
              type="button"
            >
              <Sparkles className="w-6 h-6" />
              {submitLabel}
              <Sparkles className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

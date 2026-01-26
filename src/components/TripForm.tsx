"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  Check,
  Circle,
  Clock,
  Compass,
  Feather,
  Heart,
  Home,
  Image,
  Leaf,
  MapPin,
  Minus,
  NotebookPen,
  Package,
  Paperclip,
  Plane,
  Plus,
  Sparkles,
  Square,
  Star,
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
  templateType: "pop",
  formatType: "classic",
  aiEnabled: true,
  aiTone: "casual",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const templateChoices = [
  { type: "minimal", label: "シンプル", desc: "シンプルで見やすい" },
  { type: "pop", label: "ポップ", desc: "カラフルで楽しい" },
  { type: "retro", label: "レトロ", desc: "ヴィンテージ感" },
  { type: "romantic", label: "ロマンチック", desc: "甘くやさしい" },
  { type: "photo", label: "写真多め", desc: "アルバム風" },
  { type: "modern", label: "モダン", desc: "洗練された印象" },
  { type: "nature", label: "ナチュラル", desc: "自然で穏やか" },
  { type: "adventure", label: "アドベンチャー", desc: "旅情あふれる" },
] as const;

const templateIcons: Record<string, React.ReactNode> = {
  minimal: <Minus className="w-6 h-6" strokeWidth={2.5} />,
  pop: <Star className="w-6 h-6" strokeWidth={2} />,
  retro: <Circle className="w-6 h-6" strokeWidth={2} />,
  romantic: <Heart className="w-6 h-6" strokeWidth={2} />,
  photo: <Image className="w-6 h-6" strokeWidth={2} />,
  modern: <Square className="w-6 h-6" strokeWidth={2} />,
  nature: <Leaf className="w-6 h-6" strokeWidth={2} />,
  adventure: <Compass className="w-6 h-6" strokeWidth={2} />,
};

const formatChoices = [
  { type: "classic", label: "スタンダード", desc: "情報整理を重視" },
  { type: "collage", label: "コラージュ", desc: "写真や素材を重ねる" },
  { type: "notebook", label: "ノート", desc: "手帳風の余白" },
  { type: "timeline", label: "タイムライン", desc: "時系列を強調" },
] as const;

const formatIcons: Record<string, React.ReactNode> = {
  classic: <BookOpen className="w-6 h-6" strokeWidth={2} />,
  collage: <Paperclip className="w-6 h-6" strokeWidth={2} />,
  notebook: <NotebookPen className="w-6 h-6" strokeWidth={2} />,
  timeline: <Clock className="w-6 h-6" strokeWidth={2} />,
};

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

    const newDayPlans = [...trip.dayPlans];
    newDayPlans[dayIndex].activities.push(activity.trim());
    setTrip({ ...trip, dayPlans: newDayPlans });
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    const newDayPlans = [...trip.dayPlans];
    newDayPlans[dayIndex].activities.splice(activityIndex, 1);
    setTrip({ ...trip, dayPlans: newDayPlans });
  };

  const handleNext = () => {
    if (isBlocked) return;
    if (currentStep === 1 && trip.startDate && trip.endDate) {
      generateDayPlans();
    }
    setCurrentStep(currentStep + 1);
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

  const stepLabels = ["基本情報", "日程", "詳細", "仕上げ"];
  const submitLabel = isBlocked ? busyLabel || "作成中..." : "しおりを作成";

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-10 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <motion.div
              className={`step-dot ${
                currentStep === step
                  ? "is-active"
                  : currentStep > step
                    ? "is-done"
                    : ""
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {currentStep > step ? <Check className="w-5 h-5" /> : step}
            </motion.div>
            {step < 4 && (
              <div
                className={`step-line mx-1 ${
                  currentStep > step ? "is-done" : ""
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-8 flex justify-center">
        <span className="font-body text-lg text-ink">
          Step {currentStep}: {stepLabels[currentStep - 1]}
        </span>
      </div>

      <motion.div
        className="paper-card paper-stack ring-holes rounded-2xl p-8 md:p-10"
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
              <div>
                <label className="block font-ui font-medium mb-2 text-ink flex items-center gap-2">
                  <Feather className="w-4 h-4 text-accent-coral" />
                  旅のタイトル <span className="text-accent-berry">*</span>
                </label>
                <input
                  type="text"
                  value={trip.title}
                  onChange={(event) =>
                    setTrip({ ...trip, title: event.target.value })
                  }
                  className="input-paper w-full font-body"
                  placeholder="例: 沖縄3泊4日の旅"
                />
              </div>

              <div>
                <label className="block font-ui font-medium mb-2 text-ink flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-coral" />
                  目的地 <span className="text-accent-berry">*</span>
                </label>
                <input
                  type="text"
                  value={trip.destination}
                  onChange={(event) =>
                    setTrip({ ...trip, destination: event.target.value })
                  }
                  className="input-paper w-full font-body"
                  placeholder="例: 沖縄県那覇市"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-ui font-medium mb-2 text-ink flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent-coral" />
                    出発日 <span className="text-accent-berry">*</span>
                  </label>
                  <input
                    type="date"
                    value={trip.startDate}
                    onChange={(event) =>
                      setTrip({ ...trip, startDate: event.target.value })
                    }
                    className="input-paper w-full font-body"
                  />
                </div>
                <div>
                  <label className="block font-ui font-medium mb-2 text-ink flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent-coral" />
                    帰着日 <span className="text-accent-berry">*</span>
                  </label>
                  <input
                    type="date"
                    value={trip.endDate}
                    onChange={(event) =>
                      setTrip({ ...trip, endDate: event.target.value })
                    }
                    className="input-paper w-full font-body"
                  />
                </div>
              </div>

              <div>
                <label className="block font-ui font-medium mb-2 text-ink flex items-center gap-2">
                  <Plane className="w-4 h-4 text-accent-coral" />
                  移動手段
                </label>
                <input
                  type="text"
                  value={trip.transportText}
                  onChange={(event) =>
                    setTrip({ ...trip, transportText: event.target.value })
                  }
                  className="input-paper w-full font-body"
                  placeholder="例: 飛行機、レンタカー"
                />
              </div>

              <div>
                <label className="block font-ui font-medium mb-2 text-ink flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent-coral" />
                  メンバー
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(event) => setNewMemberName(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && handleAddMember()
                    }
                    className="input-paper flex-1 font-body"
                    placeholder="名前を入力"
                  />
                  <motion.button
                    onClick={handleAddMember}
                    className="px-5 py-3 btn btn-primary flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    追加
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {trip.members.map((member) => (
                      <motion.div
                        key={member.id}
                        className="tag-pill px-4 py-2 flex items-center gap-2 font-ui text-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <span>{member.name}</span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="icon-button text-accent-berry"
                          type="button"
                        >
                          <X className="w-4 h-4" />
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
              {trip.dayPlans.map((plan, dayIndex) => (
                <motion.div
                  key={plan.day}
                  className="note-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIndex * 0.1 }}
                >
                  <h3 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 badge-number rounded-full flex items-center justify-center text-sm font-ui">
                      {plan.day}
                    </span>
                    Day {plan.day} — {plan.date}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <AnimatePresence>
                      {plan.activities.map((activity, activityIndex) => (
                        <motion.div
                          key={activityIndex}
                          className="list-item flex items-center gap-3 p-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <span className="w-6 h-6 badge-number rounded-full flex items-center justify-center text-xs font-ui">
                            {activityIndex + 1}
                          </span>
                          <span className="flex-1 font-body">{activity}</span>
                          <motion.button
                            onClick={() =>
                              handleRemoveActivity(dayIndex, activityIndex)
                            }
                            className="icon-button text-accent-berry"
                            whileHover={{ scale: 1.1 }}
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    onClick={() => handleAddActivity(dayIndex)}
                    className="w-full py-3 btn btn-dashed flex items-center justify-center gap-2 font-ui"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
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
              <div>
                <label className="block font-ui font-medium mb-3 text-ink flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent-coral" />
                  やりたいことリスト
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newWantItem}
                    onChange={(event) => setNewWantItem(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && handleAddWantItem()
                    }
                    className="input-paper flex-1 font-body"
                    placeholder="やりたいことを入力"
                  />
                  <motion.button
                    onClick={handleAddWantItem}
                    className="px-5 py-3 btn btn-primary flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    追加
                  </motion.button>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {trip.wantItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className="list-item flex items-center gap-3 p-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                      >
                        <Check className="w-5 h-5 text-accent-leaf" />
                        <span className="flex-1 font-body">{item.text}</span>
                        <motion.button
                          onClick={() => handleRemoveWantItem(item.id)}
                          className="icon-button text-accent-berry"
                          whileHover={{ scale: 1.1 }}
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block font-ui font-medium mb-3 text-ink flex items-center gap-2">
                  <Home className="w-4 h-4 text-accent-coral" />
                  宿泊施設
                </label>

                <div className="space-y-3 mb-4">
                  <AnimatePresence>
                    {trip.lodgings.map((lodging) => (
                      <motion.div
                        key={lodging.id}
                        className="note-card accent-strip p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-body font-medium text-ink">
                            {lodging.name}
                          </h4>
                          <motion.button
                            onClick={() => handleRemoveLodging(lodging.id)}
                            className="icon-button text-accent-berry"
                            whileHover={{ scale: 1.1 }}
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                        {lodging.address && (
                          <p className="text-sm text-ink-soft">
                            {lodging.address}
                          </p>
                        )}
                        {lodging.checkin && (
                          <p className="text-sm text-ink-soft">
                            チェックイン: {lodging.checkin}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="dashed-panel p-4 space-y-3">
                  <input
                    type="text"
                    value={editingLodging.name || ""}
                    onChange={(event) =>
                      setEditingLodging({
                        ...editingLodging,
                        name: event.target.value,
                      })
                    }
                    className="input-paper input-paper-sm w-full font-body"
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
                    className="input-paper input-paper-sm w-full font-body"
                    placeholder="住所"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={editingLodging.checkin || ""}
                      onChange={(event) =>
                        setEditingLodging({
                          ...editingLodging,
                          checkin: event.target.value,
                        })
                      }
                      className="input-paper input-paper-sm font-body"
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
                      className="input-paper input-paper-sm font-body"
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
                    className="input-paper input-paper-sm w-full font-body"
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
                    className="input-paper input-paper-sm w-full font-body"
                    placeholder="URL"
                  />
                  <motion.button
                    onClick={handleAddLodging}
                    className="w-full py-2.5 btn btn-secondary flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    宿泊施設を追加
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="block font-ui font-medium mb-2 text-ink">
                  メモ・その他
                </label>
                <textarea
                  value={trip.notes}
                  onChange={(event) =>
                    setTrip({ ...trip, notes: event.target.value })
                  }
                  className="input-paper note-lines w-full font-body"
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
              <div>
                <label className="block font-ui font-medium mb-4 text-ink">
                  テンプレートを選択
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {templateChoices.map((template) => (
                    <motion.button
                      key={template.type}
                      onClick={() =>
                        setTrip({
                          ...trip,
                          templateType: template.type as Trip["templateType"],
                        })
                      }
                      className={`choice-card p-5 text-left ${
                        trip.templateType === template.type ? "is-selected" : ""
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                    >
                      <div className="mb-3 text-accent-coral">
                        {templateIcons[template.type]}
                      </div>
                      <h3 className="font-ui font-medium text-ink mb-1">
                        {template.label}
                      </h3>
                      <p className="text-xs text-ink-soft">
                        {template.desc}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-ui font-medium mb-4 text-ink">
                  フォーマットを選択
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formatChoices.map((format) => (
                    <motion.button
                      key={format.type}
                      onClick={() =>
                        setTrip({
                          ...trip,
                          formatType: format.type as Trip["formatType"],
                        })
                      }
                      className={`choice-card p-4 text-left ${
                        trip.formatType === format.type ? "is-selected" : ""
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                    >
                      <div className="mb-3 text-accent-coral">
                        {formatIcons[format.type]}
                      </div>
                      <h3 className="font-ui font-medium text-ink mb-1">
                        {format.label}
                      </h3>
                      <p className="text-xs text-ink-soft">{format.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div className="paper-card accent-panel rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 hero-badge rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-paper" />
                  </div>
                  <h3 className="font-display text-xl text-ink">AI補完機能</h3>
                </div>

                <label className="flex items-center gap-3 mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trip.aiEnabled}
                    onChange={(event) =>
                      setTrip({ ...trip, aiEnabled: event.target.checked })
                    }
                    className="w-5 h-5 accent-coral rounded"
                  />
                  <span className="font-body text-ink">
                    AIで文章を補完する
                  </span>
                </label>

                {trip.aiEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className="block font-ui text-sm font-medium mb-2 text-ink">
                      文章のトーン
                    </label>
                    <div className="flex gap-3">
                      {[
                        { tone: "polite", label: "丁寧" },
                        { tone: "casual", label: "カジュアル" },
                      ].map((option) => (
                        <motion.button
                          key={option.tone}
                          onClick={() =>
                            setTrip({
                              ...trip,
                              aiTone: option.tone as Trip["aiTone"],
                            })
                          }
                          className={`choice-pill flex-1 py-3 px-4 ${
                            trip.aiTone === option.tone ? "is-selected" : ""
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <p className="text-sm text-ink-soft mt-4 note-card p-3">
                  AIが表紙コピー、概要文、見どころ要約などを自動生成します。入力内容は変更されません。
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-10 pt-6 border-t border-paper">
          {currentStep > 1 ? (
            <motion.button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-3 btn btn-ghost"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isBlocked}
            >
              ← 戻る
            </motion.button>
          ) : (
            <motion.button
              onClick={onCancel}
              className="px-6 py-3 btn btn-ghost text-ink-soft"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isBlocked}
            >
              キャンセル
            </motion.button>
          )}

          {currentStep < 4 ? (
            <motion.button
              onClick={handleNext}
              className="px-8 py-3 btn btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isBlocked}
            >
              次へ →
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              className="px-10 py-3 btn btn-primary flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isBlocked}
            >
              <Feather className="w-5 h-5" />
              {submitLabel}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

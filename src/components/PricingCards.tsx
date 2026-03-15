"use client";

import { motion } from "motion/react";
import { Check, Crown, Sparkles } from "lucide-react";

interface PricingCardsProps {
  compact?: boolean;
  onCheckout?: (billingCycle: "monthly" | "yearly") => void;
  isBusy?: boolean;
}

const freeFeatures = [
  "月3件までのしおり生成",
  "ゲストでお試し",
  "低解像度プレビュー",
  "Googleログイン後に下書き保存",
];

const premiumFeatures = [
  "しおり生成が実質無制限",
  "ページごとの再生成・修正",
  "PDFダウンロード",
  "共有リンク発行",
  "高解像度しおり",
];

export function PricingCards({
  compact = false,
  onCheckout,
  isBusy = false,
}: PricingCardsProps) {
  return (
    <div className={`grid gap-6 ${compact ? "lg:grid-cols-2" : "md:grid-cols-2"}`}>
      <motion.section
        className="paper-card rounded-3xl p-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-100">
            <Sparkles className="h-5 w-5 text-accent-sky" />
          </div>
          <div>
            <p className="font-ui text-sm text-ink-soft">まず試す</p>
            <h3 className="font-display text-2xl text-ink">Free</h3>
          </div>
        </div>
        <p className="mb-6 text-ink-soft">
          幹事の痛みを実感できるところまで無料で。保存から先はログインでつなぐ。
        </p>
        <p className="mb-6 text-4xl font-display text-ink">¥0</p>
        <div className="space-y-3">
          {freeFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-sm text-ink">
              <Check className="h-4 w-4 text-accent-leaf" />
              {feature}
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="hero-surface rounded-3xl p-8 shadow-[0_18px_42px_rgba(35,31,27,0.18)]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Crown className="h-5 w-5 text-paper" />
          </div>
          <div>
            <p className="font-ui text-sm text-paper/80">幹事の本番用</p>
            <h3 className="font-display text-2xl text-paper">Premium</h3>
          </div>
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl bg-white/10 p-4 md:grid-cols-2">
          <button
            type="button"
            disabled={!onCheckout || isBusy}
            onClick={() => onCheckout?.("monthly")}
            className="rounded-2xl border border-white/20 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10 disabled:opacity-60"
          >
            <div className="text-sm text-paper/75">月額</div>
            <div className="font-display text-3xl text-paper">¥480</div>
            <div className="text-xs text-paper/75">まず導線を作る人向け</div>
          </button>
          <button
            type="button"
            disabled={!onCheckout || isBusy}
            onClick={() => onCheckout?.("yearly")}
            className="rounded-2xl border border-white/20 bg-white/15 px-4 py-4 text-left transition hover:bg-white/20 disabled:opacity-60"
          >
            <div className="text-sm text-paper/75">年額</div>
            <div className="font-display text-3xl text-paper">¥3,900</div>
            <div className="text-xs text-paper/75">2か月分お得</div>
          </button>
        </div>

        <div className="space-y-3">
          {premiumFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-sm text-paper">
              <Check className="h-4 w-4 text-accent-sun" />
              {feature}
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

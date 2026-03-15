"use client";

import type { Trip } from "@/types/trip";

interface DesignEditorProps {
  trip: Trip;
  onSave: (trip: Trip) => void | Promise<void>;
  onBack: () => void;
}

export function DesignEditor({ trip, onSave, onBack }: DesignEditorProps) {
  return (
    <div className="paper-card rounded-3xl p-8 text-ink">
      <h2 className="font-display text-3xl">ページ編集はプレビュー画面に統合しました</h2>
      <p className="mt-3 text-sm leading-7 text-ink-soft">
        旧 layered editor は初回リリースから外しました。しおり生成後に各ページの「ページを修正」から文言と配色を直してください。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-soft px-5 py-3 text-sm" onClick={onBack}>
          戻る
        </button>
        <button type="button" className="btn btn-primary px-5 py-3 text-sm" onClick={() => onSave(trip)}>
          現在の内容で続ける
        </button>
      </div>
    </div>
  );
}

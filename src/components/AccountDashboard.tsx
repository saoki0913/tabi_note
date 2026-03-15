"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type LibraryPayload = {
  entitlements?: {
    isPremium: boolean;
    generationsRemaining: number;
  };
  trips?: Array<{
    id: string;
    title: string;
    destination: string;
    updatedAt: string;
    coverPreviewDataUrl?: string | null;
  }>;
};

export function AccountDashboard() {
  const { data: session } = authClient.useSession();
  const [payload, setPayload] = useState<LibraryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/booklets", { cache: "no-store" })
      .then(async (response) => (await response.json()) as LibraryPayload)
      .then((nextPayload) => setPayload(nextPayload))
      .finally(() => setIsLoading(false));
  }, []);

  const handleManageBilling = async () => {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const nextPayload = (await response.json()) as { url?: string };
    if (nextPayload.url) {
      window.location.href = nextPayload.url;
    }
  };

  if (isLoading) {
    return (
      <div className="paper-card rounded-3xl p-8 text-center text-ink-soft">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
        読み込み中です。
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="paper-card rounded-3xl p-8 text-center text-ink-soft">
        Googleログイン後に保存済みしおりと契約状況を確認できます。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="paper-card rounded-3xl p-8">
        <h1 className="font-display text-4xl text-ink">アカウント</h1>
        <p className="mt-3 text-ink-soft">
          {session.user.email}
          {" · "}
          {payload?.entitlements?.isPremium ? "Premium" : "Free"}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary btn-pill px-5 py-3 text-sm">
            新しいしおりをつくる
          </Link>
          <button type="button" onClick={handleManageBilling} className="btn btn-soft btn-pill px-5 py-3 text-sm">
            Stripeで契約管理
          </button>
        </div>
      </section>

      <section className="paper-card rounded-3xl p-8">
        <h2 className="font-display text-2xl text-ink">保存済みしおり</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {payload?.trips?.map((trip) => (
            <Link key={trip.id} href={`/app?booklet=${trip.id}`} className="note-card rounded-2xl p-4">
              {trip.coverPreviewDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={trip.coverPreviewDataUrl}
                  alt={`${trip.title}の表紙`}
                  className="mb-3 h-44 w-full rounded-xl object-cover"
                />
              )}
              <p className="text-sm text-ink-soft">{trip.destination}</p>
              <h3 className="font-display text-xl text-ink">{trip.title}</h3>
              <p className="mt-2 text-xs text-ink-soft">
                更新日 {new Date(trip.updatedAt).toLocaleDateString("ja-JP")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

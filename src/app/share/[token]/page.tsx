import { BookOpen, Share2 } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TripPreview } from "@/components/TripPreview";
import { getTripByShareToken } from "@/lib/booklets";

interface SharePageProps {
  params: {
    token: string;
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const trip = await getTripByShareToken(params.token);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="paper-card mb-8 flex flex-col items-center justify-between gap-4 rounded-3xl p-6 md:flex-row md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--line)] bg-white/80">
              <BookOpen className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--ink)]">たびNote</p>
              <p className="text-sm text-[var(--muted)]">共有しおりプレビュー</p>
            </div>
          </div>
          <div className="sticker teal">
            <Share2 className="h-4 w-4" />
            閲覧専用
          </div>
        </section>

        {trip ? (
          <TripPreview trip={trip} />
        ) : (
          <section className="paper-card rounded-3xl p-12 text-center">
            <p className="text-xl font-semibold text-[var(--ink)]">共有リンクが見つかりませんでした</p>
            <p className="mt-3 text-sm text-[var(--muted)]">リンクが正しいか、共有が有効な状態か確認してください。</p>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

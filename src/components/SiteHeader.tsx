"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Feather, LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const navLinks = [
  { href: "/app", label: "つくる" },
  { href: "/pricing", label: "料金" },
  { href: "/how-it-works", label: "使い方" },
  { href: "/compare/tabiori", label: "比較" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-paper-300/70 bg-paper-50/90 backdrop-blur"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full hero-badge">
            <Feather className="h-5 w-5 text-paper" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">
              <span className="gradient-text-warm">たび</span>
              <span className="text-ink">Note</span>
            </div>
            <p className="text-xs text-ink-soft">幹事の6時間を、5分のしおりに。</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-ui text-sm transition-colors ${
                  active ? "text-accent-coral" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/account"
                className="btn btn-soft btn-pill flex items-center gap-2 px-4 py-2 text-sm"
              >
                <UserRound className="h-4 w-4" />
                アカウント
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-ghost flex items-center gap-2 px-4 py-2 text-sm"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/sign-in" className="btn btn-primary btn-pill px-4 py-2 text-sm">
              ログイン
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}

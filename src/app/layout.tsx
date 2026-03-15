import type { Metadata } from "next";
import localFont from "next/font/local";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "./globals.css";

const displayFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-display",
});

const bodyFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
});

const handFont = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: {
    default: "たびNote | 幹事の6時間を、5分のしおりに。",
    template: "%s | たびNote",
  },
  description:
    "国内旅行のしおりを最短5分で作成。Googleログインで保存、PremiumでPDF出力・共有リンク・ページごとの修正までまとめて使える旅ノートアプリ。",
};

const fontVariables = [bodyFont.variable, displayFont.variable, handFont.variable].join(" ");

const editorFontStyles = {
  "--font-zen-kaku-gothic": '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  "--font-zen-old-mincho": '"Yu Mincho", "Hiragino Mincho ProN", serif',
  "--font-noto-serif": '"Yu Mincho", "Hiragino Mincho ProN", serif',
  "--font-kosugi-maru": '"Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif',
  "--font-sawarabi-gothic": '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  "--font-klee-one": '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  "--font-shippori-mincho": '"Yu Mincho", "Hiragino Mincho ProN", serif',
  "--font-dela-gothic": '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  "--font-kaisei-decol": '"Yu Mincho", "Hiragino Mincho ProN", serif',
} as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${fontVariables} antialiased`} style={editorFontStyles}>
        <Suspense fallback={null}>
          <PostHogProvider />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

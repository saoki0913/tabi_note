import type { Metadata } from "next";
import {
  DM_Sans,
  Zen_Kaku_Gothic_New,
  Yusei_Magic,
} from "next/font/google";
import "./globals.css";

const displayFont = Yusei_Magic({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const bodyFont = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
});

const accentFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-accent",
});

export const metadata: Metadata = {
  title: "たびNote",
  description:
    "旅の入力からテンプレ選択、プレビュー、共有、PDF出力までをまとめて行える旅のしおりアプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${accentFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

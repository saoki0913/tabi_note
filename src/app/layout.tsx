import type { Metadata } from "next";
import {
  M_PLUS_Rounded_1c,
  Yomogi,
  Zen_Maru_Gothic,
} from "next/font/google";
import "./globals.css";

const displayFont = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-display",
});

const bodyFont = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

const handFont = Yomogi({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-hand",
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
        className={`${bodyFont.variable} ${displayFont.variable} ${handFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

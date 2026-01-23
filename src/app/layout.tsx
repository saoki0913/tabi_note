import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistBody = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
});

const geistDisplay = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-display",
  weight: "100 900",
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
        className={`${geistBody.variable} ${geistDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

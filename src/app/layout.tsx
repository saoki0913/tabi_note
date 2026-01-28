import type { Metadata } from "next";
import {
  M_PLUS_Rounded_1c,
  Yomogi,
  Zen_Maru_Gothic,
  Zen_Kaku_Gothic_New,
  Zen_Old_Mincho,
  Noto_Serif_JP,
  Kosugi_Maru,
  Sawarabi_Gothic,
  Klee_One,
  Shippori_Mincho,
  Dela_Gothic_One,
  Kaisei_Decol,
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

// Editor fonts - loaded for text layer editing
const zenKakuGothic = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zen-kaku-gothic",
});

const zenOldMincho = Zen_Old_Mincho({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-zen-old-mincho",
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif",
});

const kosugiMaru = Kosugi_Maru({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kosugi-maru",
});

const sawarabiGothic = Sawarabi_Gothic({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sawarabi-gothic",
});

const kleeOne = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-klee-one",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-shippori-mincho",
});

const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dela-gothic",
});

const kaiseiDecol = Kaisei_Decol({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-kaisei-decol",
});

export const metadata: Metadata = {
  title: "たびNote",
  description:
    "旅の入力からテンプレ選択、プレビュー、共有、PDF出力までをまとめて行える旅のしおりアプリ。",
};

// Combine all font variables for the body
const fontVariables = [
  bodyFont.variable,
  displayFont.variable,
  handFont.variable,
  zenKakuGothic.variable,
  zenOldMincho.variable,
  notoSerifJP.variable,
  kosugiMaru.variable,
  sawarabiGothic.variable,
  kleeOne.variable,
  shipporiMincho.variable,
  delaGothicOne.variable,
  kaiseiDecol.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${fontVariables} antialiased`}>
        {children}
      </body>
    </html>
  );
}

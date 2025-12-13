import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FcmManager } from "@/components/FcmManager";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anniversary Calendar",
  description: "大切な記念日を記録しよう",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true} // 拡張機能とかがbodyタグに直接変更を加えても無視するため // TODO:
      >
        <FcmManager /> {/* 通知ロジックを動かすため */}
        <main className="min-h-screen pb-20 bg-background text-foreground">
          {children}
        </main>
        
        {/* ボトムナビゲーション */}
        <BottomNav />
      </body>
    </html>
  );
}

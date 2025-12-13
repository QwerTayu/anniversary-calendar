"use client";

import { useState, useEffect } from "react";
import { addMonths, subMonths } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { MonthSelector } from "@/components/calendar/MonthSelector";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // 現在の日付で管理（これで年またぎも自動対応）
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 未ログインならリダイレクト // TODO: これいらない？
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 月移動ハンドラ
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // タブ選択時のハンドラ
  const handleSelectMonth = (selectedMonth: number) => {
    // 現在の年の、選択された月(1-12)の1日に設定
    const newDate = new Date(year, selectedMonth - 1, 1);
    setCurrentDate(newDate);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return null;

  return (
    // 画面構成:
    // - 全体の高さ: 100vh - ボトムナビ(4rem)
    // - flex-col: ヘッダー(固定) + メイン(残り全部)
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-slate-50">
      
      {/* ヘッダーエリア（固定） */}
      <div className="border-b">
        <MonthSelector 
          currentMonth={month} 
          onSelectMonth={handleSelectMonth} 
        />
      </div>


      <div className="flex-1 overflow-hidden">
        <MonthlyCalendar 
          year={year} 
          month={month} 
          onNextMonth={handleNextMonth}
          onPrevMonth={handlePrevMonth}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { MonthSelector } from "@/components/calendar/MonthSelector";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // 現在の日付で初期化
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // 未ログインならリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-4 border-b">
           <h1 className="text-xl font-bold tracking-tight">Anniversary</h1>
           {/* 年表示（あえて控えめに） */}
           <span className="text-sm font-medium text-muted-foreground">{currentYear}年</span>
        </div>
        
        {/* 月選択タブ */}
        <MonthSelector 
          currentMonth={currentMonth} 
          onSelectMonth={setCurrentMonth} 
        />
      </header>

      <main>
        <MonthlyCalendar year={currentYear} month={currentMonth} />
      </main>
    </div>
  );
}

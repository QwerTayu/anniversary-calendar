"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { MonthSelector } from "@/components/calendar/MonthSelector";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";

const isValidMonth = (value: number) =>
  Number.isInteger(value) && value >= 1 && value <= 12;

const parseMonthParam = (raw: string | null): number | null => {
  if (!raw) return null;
  const parsed = Number(raw);
  return isValidMonth(parsed) ? parsed : null;
};

function CalendarContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();

  // URLから月を取得 (なければ現在の月)
  // ?month=12
  const todayMonth = useMemo(() => new Date().getMonth() + 1, []);
  const month = useMemo(() => {
    return parseMonthParam(searchParams.get("month")) ?? todayMonth;
  }, [searchParams, todayMonth]);

  useEffect(() => {
    const raw = searchParams.get("month");
    if (!raw || parseMonthParam(raw) === null) {
      router.replace(`/calendar?month=${todayMonth}`);
    }
  }, [searchParams, router, todayMonth]);

  // 未ログインならリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // URL更新関数
  const updateUrl = (newMonth: number) => {
    router.push(`/calendar?month=${newMonth}`);
  };

  // 月移動を循環させる (12月の次は1月)
  const handlePrevMonth = () => {
    const prev = month === 1 ? 12 : month - 1;
    updateUrl(prev);
  };

  const handleNextMonth = () => {
    const next = month === 12 ? 1 : month + 1;
    updateUrl(next);
  };

  const handleSelectMonth = (selectedMonth: number) => {
    updateUrl(selectedMonth);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    // 画面構成:
    // - 全体の高さ: 100vh - ボトムナビ(4rem)
    // - flex-col: ヘッダー(固定) + メイン(残り全部)
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-slate-50">
      {/* ヘッダーエリア（固定） */}
      <div className="border-b">
        <MonthSelector currentMonth={month} onSelectMonth={handleSelectMonth} />
      </div>

      <div className="flex-1 overflow-hidden">
        <MonthlyCalendar
          year={currentYear}
          month={month}
          onNextMonth={handleNextMonth}
          onPrevMonth={handlePrevMonth}
        />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}

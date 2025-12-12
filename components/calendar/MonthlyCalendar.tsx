"use client";

import { useMemo } from "react";
import { generateMonthDays, WEEKDAYS } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface Props {
  year: number;
  month: number;
}

export function MonthlyCalendar({ year, month }: Props) {
  // その月の日付データを生成
  const days = useMemo(() => generateMonthDays(year, month), [year, month]);

  // カレンダーの開始位置を調整するための空セル数 (その月の1日が何曜日か)
  const firstDayWeekday = days[0].weekday;
  const emptyDays = Array(firstDayWeekday).fill(null);

  return (
    <div className="p-4">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-2 text-center text-xs text-muted-foreground font-medium">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={cn(i === 0 && "text-red-500", i === 6 && "text-blue-500")}>
            {w}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-2">
        {/* 月初の空白 */}
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* 日付セル */}
        {days.map((day) => (
          <button
            key={day.dateKey}
            className={cn(
              "relative flex flex-col items-center justify-start pt-2 aspect-square rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:bg-accent active:scale-95",
              day.isToday && "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
            )}
            onClick={() => console.log(`Clicked: ${day.dateKey}`)} // あとで詳細表示に遷移させるようする
          >
            <span className={cn(
              "text-sm font-medium",
              day.weekday === 0 && "text-red-500",
              day.weekday === 6 && "text-blue-500"
            )}>
              {day.day}
            </span>
            
            {/* ここに後で「記念日ありドット」を表示する */}
            {/* <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400" /> */}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { generateMonthDays, WEEKDAYS } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useMemories } from "@/hooks/useMemories";

interface Props {
  year: number;
  month: number;
}

export function MonthlyCalendar({ year, month }: Props) {
  // その月の日付データを生成
  const days = useMemo(() => generateMonthDays(year, month), [year, month]);

  // フックからその月の記念日データを取得
  const { memories } = useMemories(month);

  // カレンダーの開始位置を調整するための空セル数 (その月の1日が何曜日か)
  const firstDayWeekday = days[0].weekday;
  const emptyDays = Array(firstDayWeekday).fill(null);

  // 日付ごとの記念日データをマッピングして検索を高速化
  // Map<"1212", Memory[]> のような形にする
  const memoriesByDate = useMemo(() => {
    const map = new Map<string, typeof memories>();
    memories.forEach((m) => {
      const current = map.get(m.mmdd) || [];
      current.push(m);
      map.set(m.mmdd, current);
    });
    return map;
  }, [memories]);

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
        {days.map((day) => {
          // その日の記念日があるかチェック
          const dayMemories = memoriesByDate.get(day.dateKey) || [];
          const hasMemory = dayMemories.length > 0;

          return (
            <button
              key={day.dateKey}
              className={cn(
                "relative flex flex-col items-center justify-start pt-2 aspect-square rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:bg-accent active:scale-95",
                day.isToday && "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => {
                console.log(`Clicked: ${day.dateKey}`, dayMemories);
              }} // あとで詳細表示に遷移させるようする
            >
              <span className={cn(
                "text-sm font-medium",
                day.weekday === 0 && "text-red-500",
                day.weekday === 6 && "text-blue-500"
              )}>
                {day.day}
              </span>
              
              {/* ドット表示 (データがある場合のみ) */}
              {hasMemory && (
                <div className="mt-1 flex gap-0.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                   {/* 複数あるならもう一個表示とかしても可愛いかも */}
                   {dayMemories.length > 1 && (
                     <div className="h-1.5 w-1.5 rounded-full bg-orange-200" />
                   )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { generateMonthDays, WEEKDAYS } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useMemories } from "@/hooks/useMemories";
import { DayDetailModal } from "@/components/memory/DayDetailModal";

interface Props {
  year: number;
  month: number;
}

export function MonthlyCalendar({ year, month }: Props) {
  const days = useMemo(() => generateMonthDays(year, month), [year, month]);
  const { memories, addMemory, deleteMemory, updateMemory } = useMemories(month);
  
  // モーダル管理用のState
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // 日付クリック時のハンドラ
  const handleDayClick = (day: typeof days[0]) => {
    // 選択された日付のDateオブジェクトを作成
    const mm = parseInt(day.dateKey.substring(0, 2));
    const dd = parseInt(day.dateKey.substring(2, 4));
    
    // UI上の年を使ってDateを作る
    // (万年カレンダーなので、クリックした時点の年をベースにします)
    const date = new Date(year, mm - 1, dd);
    
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // モーダルに渡す、選択された日の記念日リスト
  const selectedMemories = useMemo(() => {
    if (!selectedDate) return [];
    const mm = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = selectedDate.getDate().toString().padStart(2, '0');
    return memoriesByDate.get(`${mm}${dd}`) || [];
  }, [selectedDate, memoriesByDate]);

  return (
    <>
      <div className="p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-2 text-center text-xs text-muted-foreground font-medium">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={cn(i === 0 && "text-red-500", i === 6 && "text-blue-500")}>
              {w}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const dayMemories = memoriesByDate.get(day.dateKey) || [];
            const hasMemory = dayMemories.length > 0;

            return (
              <button
                key={day.dateKey}
                onClick={() => handleDayClick(day)} // クリックイベント追加
                className={cn(
                  "relative flex flex-col items-center justify-start pt-2 aspect-square rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:bg-accent active:scale-95",
                  day.isToday && "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  day.weekday === 0 && "text-red-500",
                  day.weekday === 6 && "text-blue-500"
                )}>
                  {day.day}
                </span>
                
                {hasMemory && (
                  <div className="mt-1 flex gap-0.5">
                     <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
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

      {/* 詳細モーダル */}
      {selectedDate && (
        <DayDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          memories={selectedMemories}
          onAdd={addMemory}
          onDelete={deleteMemory}
          onEdit={updateMemory}
        />
      )}
    </>
  );
}

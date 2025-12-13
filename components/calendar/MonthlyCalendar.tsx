"use client";

import { useMemo, useState } from "react";
import { generateMonthDays, WEEKDAYS } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useMemories } from "@/hooks/useMemories";
import { DayDetailModal } from "@/components/memory/DayDetailModal";
import { useSwipeable } from "react-swipeable";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  year: number;
  month: number;
  onNextMonth: () => void;
  onPrevMonth: () => void;
}

export function MonthlyCalendar({ year, month, onNextMonth, onPrevMonth }: Props) {
  const days = useMemo(() => generateMonthDays(year, month), [year, month]);
  const { memories, addMemory, deleteMemory, updateMemory } = useMemories(month);
  
  // モーダル管理用のState
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // スワイプ設定
  const swipeHandlers = useSwipeable({
    onSwipedLeft: onNextMonth,  // 左に払う -> 次の月へ
    onSwipedRight: onPrevMonth, // 右に払う -> 前の月へ
    trackMouse: true,           // マウス操作でも反応させる
  });

  // カレンダーの開始位置調整
  const firstDayWeekday = days[0].weekday;
  const emptyDays = Array(firstDayWeekday).fill(null);

  // 日付ごとの記念日データマップ
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
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // カレンダーグリッドの日付クリック用ラッパー
  const onGridDayClick = (day: typeof days[0]) => {
    const mm = parseInt(day.dateKey.substring(0, 2));
    const dd = parseInt(day.dateKey.substring(2, 4));
    const date = new Date(year, mm - 1, dd);
    handleDayClick(date);
  };

  // モーダルに渡すリスト
  const selectedMemories = useMemo(() => {
    if (!selectedDate) return [];
    const mm = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = selectedDate.getDate().toString().padStart(2, '0');
    return memoriesByDate.get(`${mm}${dd}`) || [];
  }, [selectedDate, memoriesByDate]);

  return (
    // landscape:flex-row ... 画面が横長なら「横並び」にする
    // h-full ... 親要素の高さをいっぱいに使う
    <div className="flex flex-col landscape:flex-row h-full" {...swipeHandlers}>
      
      {/* 1. カレンダーエリア */}
      {/* landscape:flex-1 ... 横並びの時は幅をリストと分け合う */}
      {/* landscape:overflow-y-auto ... 横長画面で縦が狭い場合、カレンダー単体でスクロールさせる */}
      <div className="flex-none p-4 pb-2 landscape:flex-[4] landscape:overflow-y-auto">
        
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-2 text-center text-xs text-muted-foreground font-medium">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={cn(i === 0 && "text-red-500", i === 6 && "text-blue-500")}>
              {w}
            </div>
          ))}
        </div>

        {/* グリッド本体 */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const dayMemories = memoriesByDate.get(day.dateKey) || [];
            const hasMemory = dayMemories.length > 0;

            return (
              <button
                key={day.dateKey}
                onClick={() => onGridDayClick(day)}
                className={cn(
                  "relative flex flex-col items-center justify-start pt-1.5 aspect-square rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:bg-accent active:scale-95",
                  day.isToday && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
              >
                <span className={cn(
                  "text-xs sm:text-sm font-medium",
                  day.weekday === 0 && "text-red-500",
                  day.weekday === 6 && "text-blue-500"
                )}>
                  {day.day}
                </span>
                
                {hasMemory && (
                  <div className="mt-1 flex gap-0.5 justify-center flex-wrap px-1">
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

      {/* 2. リストエリア */}
      {/* landscape:border-t-0 landscape:border-l ... 横並びの時は「上の線」を消して「左の線」をつける */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 bg-muted/10 border-t landscape:border-t-0 landscape:border-l landscape:flex-[3]">
        <div className="py-2 text-xs font-bold text-muted-foreground sticky top-0 bg-muted/10 z-10 w-full mb-2">
          {month}月の記念日一覧
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            この月の記念日はまだありません
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((memory) => (
              <Card 
                key={memory.id} 
                className="cursor-pointer hover:bg-accent/50 active:scale-[0.99] transition-transform"
                onClick={() => handleDayClick(memory.eventDate.toDate())}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* 日付表示 */}
                  <div className="flex flex-col items-center justify-center min-w-[3rem] border-r pr-3">
                    <span className="text-lg font-bold text-primary leading-none">
                      {format(memory.eventDate.toDate(), "d")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(memory.eventDate.toDate(), "E", { locale: ja })}
                    </span>
                  </div>
                  
                  {/* タイトル */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{memory.title}</h4>
                    {memory.detail && (
                      <p className="text-xs text-muted-foreground truncate opacity-80">
                        {memory.detail}
                      </p>
                    )}
                  </div>

                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                    詳細
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
    </div>
  );
}

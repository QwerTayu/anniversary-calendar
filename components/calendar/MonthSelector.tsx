"use client";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface Props {
  currentMonth: number;
  onSelectMonth: (m: number) => void;
}

export function MonthSelector({ currentMonth, onSelectMonth }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // マウント時に現在の月までスクロール
  useEffect(() => {
    if (scrollRef.current) {
      const button = scrollRef.current.querySelector(`[data-month="${currentMonth}"]`);
      if (button) {
        button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentMonth]);

  return (
    <ScrollArea className="w-full whitespace-nowrap border-b bg-background">
      <div className="flex w-max space-x-2 p-2" ref={scrollRef}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <Button
            key={m}
            data-month={m}
            variant={currentMonth === m ? "default" : "ghost"}
            onClick={() => onSelectMonth(m)}
            className={cn(
              "rounded-full px-6 transition-all",
              currentMonth === m ? "scale-100 font-bold shadow-md" : "opacity-70 hover:opacity-100"
            )}
          >
            {m}月
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

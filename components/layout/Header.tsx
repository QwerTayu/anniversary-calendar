"use client";

import { useEffect, useState } from "react";
import { differenceInDays, startOfDay } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { getMainMemoryId } from "@/lib/firebase/user";
import { Memory } from "@/types";
import { Gem } from "lucide-react";


// 日数の序数表記を返す関数
const formatOrdinalDay = (dayCount: number) => {
  const mod100 = dayCount % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${dayCount}th`;

  switch (dayCount % 10) {
    case 1:
      return `${dayCount}st`;
    case 2:
      return `${dayCount}nd`;
    case 3:
      return `${dayCount}rd`;
    default:
      return `${dayCount}th`;
  }
};

export function Header() {
  const { user } = useAuth();
  const [daysAnniversary, setDaysAnniversary] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const dayLabel = daysAnniversary !== null ? formatOrdinalDay(daysAnniversary + 1) : null;

  useEffect(() => {
    const fetchPinnedMemory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. ユーザーのピン留めIDを取得
        const pinnedId = await getMainMemoryId(user.uid);
        
        if (pinnedId) {
          // 2. 記念日データを取得
          const memoryRef = doc(db, "memories", pinnedId);
          const memorySnap = await getDoc(memoryRef);

          if (memorySnap.exists()) {
            const data = memorySnap.data() as Memory;
            // 3. 経過日数を計算 (今日 - 記念日)
            // ※ 未来の日付はピン留め不可なので、常に正の数になる想定
            const diff = differenceInDays(startOfDay(new Date()), startOfDay(data.eventDate.toDate()));
            setDaysAnniversary(diff);
          }
        }
      } catch (error) {
        console.error("Header fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedMemory();
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center justify-center px-4">
      <h1 className="font-bold text-lg text-primary">
        {loading ? (
          // ロード中は仮表示
          <span className="opacity-50">Loading...</span>
        ) : daysAnniversary !== null ? (
          // ピン留めあり: 日数表示
          <span className="flex items-center gap-1">
            <Gem className="h-5 w-5" />
            {dayLabel ? (
              <>{dayLabel} Day Anniversary</>
            ) : (
              <>1st Day Anniversary</>
            )}
          </span>
        ) : (
          // ピン留めなし: アプリ名
          <span>Anniversary Calendar</span>
        )}
      </h1>
    </header>
  );
}

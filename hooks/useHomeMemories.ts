import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";
import { Memory } from "@/types";

export function useHomeMemories() {
  const { user } = useAuth();
  const [todayMemories, setTodayMemories] = useState<Memory[]>([]);
  const [upcomingMemories, setUpcomingMemories] = useState<{ memory: Memory; daysLeft: number; nextDate: Date }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 全記念日を取得 (件数が多くなってきたら limit を検討ですが、個人用なら全件でOK)
    const q = query(
      collection(db, "memories"),
      where("userId", "==", user.uid),
      orderBy("mmdd", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMemories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Memory[];

      const now = new Date();
      // 日本時間の「今日」の月日を取得 (MMDD)
      // ※サーバー時刻とのズレを考慮するなら本来は timezone 処理が必要ですが、
      // 簡易的にローカル時刻で計算します。
      const currentMm = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentDd = now.getDate().toString().padStart(2, '0');
      const todayMmdd = `${currentMm}${currentDd}`;

      // 1. 今日の記念日を抽出
      const todays = allMemories.filter((m) => m.mmdd === todayMmdd);
      setTodayMemories(todays);

      // 2. 直近の予定を計算
      // それぞれの記念日が「次のいつ来るか」を計算してソート
      const upcoming = allMemories
        .map((memory) => {
          // 記念日の月日
          const memMonth = parseInt(memory.mmdd.substring(0, 2)) - 1;
          const memDay = parseInt(memory.mmdd.substring(2, 4));

          // 今年の記念日候補
          let nextDate = new Date(now.getFullYear(), memMonth, memDay);
          
          // もし今年の記念日がもう過ぎていたら（昨日以前なら）、来年に設定
          // 日付比較のため時刻を0にリセット
          const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          if (nextDate.getTime() < todayZero.getTime()) {
            // 来年
            nextDate = new Date(now.getFullYear() + 1, memMonth, memDay);
          }

          // 日数差を計算
          const diffTime = nextDate.getTime() - todayZero.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return { memory, daysLeft, nextDate };
        })
        .filter(item => item.daysLeft > 0) // 今日(0日)は除外、明日以降のみ
        .sort((a, b) => a.daysLeft - b.daysLeft) // 近い順にソート
        .slice(0, 5); // トップ5

      setUpcomingMemories(upcoming);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { todayMemories, upcomingMemories, loading };
}

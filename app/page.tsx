"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ChevronRight, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHomeMemories } from "@/hooks/useHomeMemories";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { todayMemories, upcomingMemories, loading } = useHomeMemories();

  // 未ログインならリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (!user || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  // 今日の日付データ
  const todayDate = new Date();

  // 遷移先URLを作成するヘルパー関数
  const getCalendarLink = (targetDate: Date) => {
    const m = targetDate.getMonth() + 1;
    const dateStr = format(targetDate, "MM-dd");
    return `/calendar?month=${m}&date=${dateStr}`;
  };

  return (
    <div className="p-4 space-y-8 max-w-md mx-auto">
      {/* 1. 今日の記念日エリア */}
      <section className="space-y-3">
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between px-1">
          {todayMemories.length > 0 ? (
            <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
              <Gift className="h-5 w-5" />
              <span>今日は特別な日です！</span>
            </div>
          ) : (
             <div className="flex items-center gap-2 font-bold text-muted-foreground">
              <span className="text-xl">☕</span>
              <span>今日は記念日はありません</span>
            </div>
          )}
          
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
            <Link href="/calendar">
              すべて見る <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        {/* リスト部分 */}
        {todayMemories.length > 0 ? (
          <div className="space-y-3">
            {todayMemories.map((memory) => (
              <Link 
                key={memory.id} 
                href={getCalendarLink(todayDate)}
                className="block" 
              >
                <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* ★変更: 今日の日付バッジ (yyyy / TODAY) */}
                    <div className="flex flex-col items-center justify-center bg-muted rounded-lg w-14 h-14 flex-shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {format(memory.eventDate.toDate(), "yyyy")}
                      </span>
                      <span className="text-sm font-bold leading-none mt-0.5">TODAY</span>
                    </div>

                    {/* タイトルと詳細 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{memory.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {memory.detail || "詳細はありません"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          // 記念日がない場合
          <Card className="bg-muted/30 border-none shadow-none">
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              穏やかな1日をお過ごしください ✨
            </CardContent>
          </Card>
        )}
      </section>

      {/* 2. 直近の予定リスト */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            もうすぐ来る記念日
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
            <Link href="/calendar">
              すべて見る <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          {upcomingMemories.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              予定はまだありません
            </div>
          ) : (
            upcomingMemories.map(({ memory, daysLeft, nextDate }) => (
            <Link 
              key={memory.id}
              href={getCalendarLink(nextDate)}
              className="block"
            >
              <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    {/* 日付バッジ */}
                    <div className="flex flex-col items-center justify-center bg-muted rounded-lg w-14 h-14 flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {format(nextDate, "yyyy")}
                      </span>
                      <span className="text-sm font-medium leading-none">
                        {format(nextDate, "M/d")}
                      </span>
                    </div>

                    {/* タイトルと残り日数 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{memory.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        あと <span className="text-primary font-bold text-sm">{daysLeft}</span> 日
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

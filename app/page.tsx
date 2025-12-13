import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Home</h1>
      <p>ここに今日の記念日や直近の予定が表示されます。</p>
      
      {/* 仮のリンクボタン */}
      <Button asChild>
        <Link href="/calendar">カレンダーへ</Link>
      </Button>
    </div>
  );
}

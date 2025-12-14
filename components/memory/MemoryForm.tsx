"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Memory } from "@/types";
import { getMainMemoryId } from "@/lib/firebase/user";
import { auth } from "@/lib/firebase/client";

interface Props {
  initialDate: Date;
  initialData?: Memory;
  onSave: (
    title: string,
    detail: string,
    date: Date,
    isPinned: boolean
  ) => Promise<void>;
  onCancel: () => void;
}

export function MemoryForm({
  initialDate,
  initialData,
  onSave,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || "");
  const [detail, setDetail] = useState(initialData?.detail || "");

  // ピン留め関連のState
  const [isPinned, setIsPinned] = useState(false);
  const [currentPinnedId, setCurrentPinnedId] = useState<string | null>(null);

  const defaultDateStr = initialData
    ? format(initialData.eventDate.toDate(), "yyyy-MM-dd")
    : format(initialDate, "yyyy-MM-dd");

  const [dateStr, setDateStr] = useState(defaultDateStr);

  // 現在のピン留め状況を取得し、初期値を設定
  useEffect(() => {
    const fetchPinStatus = async () => {
      if (!auth.currentUser) return;

      const pinnedId = await getMainMemoryId(auth.currentUser.uid);
      setCurrentPinnedId(pinnedId);

      // 編集モードで、かつこの記念日がピン留めされているならチェックを入れる
      if (initialData && pinnedId === initialData.id) {
        setIsPinned(true);
      }
    };
    fetchPinStatus();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;

    // 未来の日付のピン止め禁止チェック
    // dateStr (yyyy-mm-dd) をローカルタイムの0時0分として解釈して比較
    const [y, m, d] = dateStr.split("-").map(Number);
    const inputDate = new Date(y, m - 1, d); // 選択された日付
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 今日の0時0分

    if (isPinned && inputDate > today) {
      alert(
        "未来の日付はホーム画面にピン留めできません。\nピン留めを外すか、過去の日付を選択してください。"
      );
      return; // 保存処理を中断
    }

    // ピン留めの競合チェック
    if (isPinned && currentPinnedId) {
      // 「新規作成」または「別の記念日を編集」していて、既にピン留めがある場合
      // (自分自身がピン留めされている場合は確認不要)
      if (!initialData || initialData.id !== currentPinnedId) {
        const shouldOverwrite = window.confirm(
          "すでにホームにピン留めされた記念日があります。\nこの記念日に変更しますか？"
        );
        if (!shouldOverwrite) {
          return; // キャンセルされたら保存しない
        }
      }
    }

    setLoading(true);
    try {
      await onSave(title, detail, new Date(dateStr), isPinned);

      // ピン留め変更のカスタムイベントを発火
      window.dispatchEvent(new Event("pinned-memory-updated"));
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="date">日付</Label>
        <Input
          id="date"
          type="date"
          required
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          placeholder="例: 〇〇記念日"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail">詳細・思い出</Label>
        <Textarea
          id="detail"
          placeholder="詳細なエピソードなど..."
          className="min-h-[100px]"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>

      {/* ピン留めチェックボックス */}
      <div className="flex items-center space-x-2 py-2">
        <input
          type="checkbox"
          id="isPinned"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
        />
        <Label
          htmlFor="isPinned"
          className="text-sm font-medium cursor-pointer"
        >
          この記念日をピン留めする
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  );
}

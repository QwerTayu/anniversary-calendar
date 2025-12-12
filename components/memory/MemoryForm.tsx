"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Memory } from "@/types";

interface Props {
  initialDate: Date; // 新規作成時のデフォルト日付
  initialData?: Memory; // 編集時の初期データ
  onSave: (title: string, detail: string, date: Date) => Promise<void>;
  onCancel: () => void;
}

export function MemoryForm({ initialDate, initialData, onSave, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || "");
  const [detail, setDetail] = useState(initialData?.detail || "");
  
  // 日付入力用のstate (HTMLのinput type="date"は "YYYY-MM-DD" 文字列を扱うため)
  const defaultDateStr = initialData 
    ? format(initialData.eventDate.toDate(), "yyyy-MM-dd") 
    : format(initialDate, "yyyy-MM-dd");
    
  const [dateStr, setDateStr] = useState(defaultDateStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;

    setLoading(true);
    try {
      await onSave(title, detail, new Date(dateStr));
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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          キャンセル
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  );
}

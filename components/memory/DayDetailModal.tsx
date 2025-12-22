"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Trash2,
  Pencil,
  Plus,
  CalendarIcon,
  Share2,
  Pin,
  PinOff,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Memory } from "@/types";
import { MemoryForm } from "./MemoryForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  memories: Memory[];
  onAdd: (
    title: string,
    detail: string,
    date: Date,
    isShared: boolean,
    isPinned: boolean
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (
    id: string,
    title: string,
    detail: string,
    date: Date,
    isShared: boolean,
    isPinned: boolean
  ) => Promise<void>;
  currentUserId: string;
  pinnedMemoryId?: string | null;
  onTogglePin?: (id: string) => Promise<void>;
}

type Mode = "list" | "form";

export function DayDetailModal({
  isOpen,
  onClose,
  selectedDate,
  memories,
  onAdd,
  onDelete,
  onEdit,
  currentUserId,
  pinnedMemoryId,
  onTogglePin,
}: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  // モーダルが閉じるときは常にリストモードに戻す
  const handleClose = () => {
    setMode("list");
    setEditingMemory(null);
    onClose();
  };

  const handleSave = async (
    title: string,
    detail: string,
    date: Date,
    isShared: boolean,
    isPinned: boolean
  ) => {
    if (editingMemory) {
      // 編集モードの場合
      await onEdit(editingMemory.id, title, detail, date, isShared, isPinned);
    } else {
      // 新規追加モードの場合
      await onAdd(title, detail, date, isShared, isPinned);
    }
    setMode("list"); // 保存したらリストモードに戻る
    setEditingMemory(null);
  };

  // 編集ボタンを押したときの処理
  const startEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setMode("form");
  };

  // フォームから戻る処理
  const cancelForm = () => {
    setMode("list");
    setEditingMemory(null);
  };

  // 表示用の日付文字列 (例: 12月12日 (金))
  const dateLabel = format(selectedDate, "M月d日 (EEEEE)", { locale: ja });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {mode === "form"
              ? editingMemory
                ? "記念日を編集"
                : "記念日を追加"
              : dateLabel}
          </DialogTitle>
          {mode === "list" && (
            <DialogDescription>
              {memories.length}件の思い出があります
            </DialogDescription>
          )}
        </DialogHeader>

        {/* コンテンツエリア (スクロール可能に) */}
        <div className="flex-1 overflow-hidden">
          {mode === "form" ? (
            <MemoryForm
              initialDate={selectedDate}
              initialData={editingMemory || undefined}
              isPartnerMemory={
                editingMemory ? editingMemory.userId !== currentUserId : false
              }
              onSave={handleSave}
              onCancel={cancelForm}
            />
          ) : (
            <>
              {memories.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  まだ記録がありません。
                  <br />
                  下のボタンから追加してみましょう！
                </div>
              ) : (
                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-3 pb-4">
                    {memories.map((memory) => {
                      const isPartnerMemory = memory.userId !== currentUserId;
                      const isPinnedCurrent = pinnedMemoryId === memory.id;

                      return (
                        <Card key={memory.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                                  <span>
                                    {format(
                                      memory.eventDate.toDate(),
                                      "yyyy年"
                                    )}
                                  </span>
                                </div>
                                <h3 className="font-bold text-lg leading-tight mb-1">
                                  {isPartnerMemory && memory.isShared && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 mr-1 px-2 py-0.5 text-[11px] text-primary">
                                      <Share2 className="h-3 w-3" />
                                    </span>
                                  )}
                                  {memory.title}
                                </h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {memory.detail}
                                </p>
                              </div>

                              {/* 操作ボタンエリア */}

                              <div className="flex flex-col gap-1">
                                {/* ピン留めボタン */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={async () => {
                                    if (!onTogglePin) return;
                                    if (
                                      !isPinnedCurrent &&
                                      pinnedMemoryId &&
                                      pinnedMemoryId !== memory.id
                                    ) {
                                      const ok = confirm(
                                        "ほかの記念日のピンを外して、これをピン留めするよ。いい？"
                                      );
                                      if (!ok) return;
                                    }
                                    await onTogglePin(memory.id);
                                    window.dispatchEvent(
                                      new Event("pinned-memory-updated")
                                    );
                                  }}
                                  aria-label={
                                    isPinnedCurrent
                                      ? "ピン留めを外す"
                                      : "ピン留めする"
                                  }
                                >
                                  {isPinnedCurrent ? (
                                    <PinOff className="h-4 w-4" />
                                  ) : (
                                    <Pin className="h-4 w-4" />
                                  )}
                                </Button>

                                {isPartnerMemory && memory.isShared ? null : (
                                  <>
                                    {/* 編集ボタン */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => startEdit(memory)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>

                                    {/* 削除ボタン */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={async () => {
                                        if (confirm("本当に削除しますか？")) {
                                          await onDelete(memory.id);
                                          window.dispatchEvent(
                                            new Event("pinned-memory-updated")
                                          );
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>

        {/* フッターエリア (リスト表示時のみ「＋」ボタンを表示) */}
        {mode === "list" && (
          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => setMode("form")}
              className="rounded-full shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              新しい記念日
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

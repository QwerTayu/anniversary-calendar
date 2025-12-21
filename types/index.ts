import { Timestamp } from "firebase/firestore";

export interface Memory {
  id: string;
  userId: string;
  title: string;
  detail: string;
  eventDate: Timestamp; 
  mmdd: string; // 検索用 "0425"など
  isShared?: boolean; // 共有設定フラグ
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// カレンダー表示用に使う型
export interface CalendarDay {
  month: number;
  day: number;
  weekday: number; // 0: Sun, 1: Mon...
  isToday: boolean;
  dateKey: string; // "0425" 形式
}

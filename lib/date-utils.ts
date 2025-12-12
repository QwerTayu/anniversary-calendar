import { getDay, getDate, getMonth, isSameDay } from "date-fns";
import { CalendarDay } from "@/types";

/**
 * 指定された月の日付リストを生成する
 * 2月は常に29日まであるものとして扱う
 */
export function generateMonthDays(year: number, month: number): CalendarDay[] {
  // monthは 1-12 で受け取るが、Date関数は 0-11 なので調整
  const monthIndex = month - 1;
  const days: CalendarDay[] = [];

  // 通常の末日計算（2025年2月なら28日になる）
  const lastDayObj = new Date(year, monthIndex + 1, 0); 
  let daysInMonth = getDate(lastDayObj);

  // 【重要】2月の場合、平年でも29日まで強制的にループさせる
  if (month === 2) {
    daysInMonth = 29;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    // 実際のDateオブジェクトを作成
    // ※ 平年の2/29 を new Date(2025, 1, 29) すると 3/1 になってしまうため調整が必要
    const targetDate = new Date(year, monthIndex, d);
    
    // 平年の2月29日の場合、曜日は「2/28の翌日」として計算する
    if (month === 2 && d === 29 && getMonth(targetDate) !== 1) {
       // 2/28を取得して、その翌日の曜日コード(0-6)を取得
       const feb28 = new Date(year, 1, 28);
       const nextDayWebkday = (getDay(feb28) + 1) % 7;
       
       days.push({
         month: 2,
         day: 29,
         weekday: nextDayWebkday,
         isToday: false, // 平年の今日が2/29になることはない
         dateKey: "0229",
       });
       continue;
    }

    // 通常の日の処理
    // mmdd形式 (例: "0109", "1212")
    const mm = month.toString().padStart(2, '0');
    const dd = d.toString().padStart(2, '0');
    
    days.push({
      month: month,
      day: d,
      weekday: getDay(targetDate),
      isToday: isSameDay(targetDate, new Date()),
      dateKey: `${mm}${dd}`,
    });
  }

  return days;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

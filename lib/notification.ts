// 事前通知で選べる日数（設定画面と cron で共有する）
export const NOTIFY_DAYS_BEFORE_OPTIONS = [
  { days: 1, label: "前日" },
  { days: 3, label: "3日前" },
  { days: 7, label: "1週間前" },
] as const;

export const NOTIFY_DAYS_BEFORE_VALUES: number[] =
  NOTIFY_DAYS_BEFORE_OPTIONS.map((o) => o.days);


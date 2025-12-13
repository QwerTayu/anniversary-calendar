"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/calendar", label: "カレンダー", icon: Calendar },
    { href: "/settings", label: "設定", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white h-16 flex items-center justify-around z-50 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        // 完全一致またはカレンダー配下ならアクティブとする
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import { useFcmToken } from "@/hooks/useFcmToken";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

export function FcmManager() {
  const { token, notificationPermission, requestNotificationPermission } = useFcmToken();

  // すでに許可済み、または拒否されている場合は何も表示しない
  // (拒否されている場合に無理に出すとユーザー体験が悪いため)
  if (notificationPermission === "granted" || notificationPermission === "denied") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={requestNotificationPermission}
        className="shadow-xl bg-orange-500 hover:bg-orange-600 text-white rounded-full animate-bounce"
      >
        <BellRing className="mr-2 h-4 w-4" />
        通知をONにする
      </Button>
    </div>
  );
}

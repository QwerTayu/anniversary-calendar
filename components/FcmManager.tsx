"use client";

import { useFcmToken } from "@/hooks/useFcmToken";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

export function FcmManager() {
  const {
    token,
    notificationPermission,
    requestNotificationPermission,
    isPermissionResolved,
  } = useFcmToken();

  if (
    !isPermissionResolved ||
    notificationPermission === "granted" ||
    notificationPermission === "denied"
  ) {
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

import { useEffect, useState, useSyncExternalStore } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db, auth } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const permissionSubscribers = new Set<() => void>();

const canUseNotifications = () =>
  typeof window !== "undefined" && "Notification" in window;

const emitPermissionChange = () => {
  permissionSubscribers.forEach((listener) => listener());
};

const subscribeToPermission = (callback: () => void) => {
  permissionSubscribers.add(callback);

  let detach: (() => void) | undefined;

  if (
    canUseNotifications() &&
    "permissions" in navigator &&
    typeof navigator.permissions.query === "function"
  ) {
    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((status) => {
        const handleChange = () => emitPermissionChange();
        status.addEventListener("change", handleChange);
        detach = () => status.removeEventListener("change", handleChange);
      })
      .catch(() => {
        /* ignore */
      });
  }

  return () => {
    permissionSubscribers.delete(callback);
    detach?.();
  };
};

const getClientPermissionSnapshot = (): NotificationPermission =>
  canUseNotifications() ? Notification.permission : "default";

const getServerPermissionSnapshot = (): NotificationPermission => "default";

export function useFcmToken() {
  const [token, setToken] = useState<string | null>(null);
  const notificationPermission = useSyncExternalStore(
    subscribeToPermission,
    getClientPermissionSnapshot,
    getServerPermissionSnapshot
  );
  const isPermissionResolved =
    typeof window !== "undefined" ? canUseNotifications() : false;

  useEffect(() => {
    if (notificationPermission === "granted") {
      const retrieveToken = async () => {
        try {
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            const messaging = getMessaging(app);
            const currentToken = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            if (currentToken) {
              setToken(currentToken);
            }
          }
        } catch (error) {
          console.error("Token retrieval error:", error);
        }
      };
      retrieveToken();
    }
  }, [notificationPermission]);

  // 通知許可を求める関数
  const requestNotificationPermission = async () => {
    try {
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        canUseNotifications()
      ) {
        const messaging = getMessaging(app);
        const permission = await Notification.requestPermission();
        emitPermissionChange();

        if (permission === "granted") {
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });

          if (currentToken) {
            console.log("🔥 FCM Token:", currentToken);
            setToken(currentToken);

            // Firestoreにトークンを保存する処理
            const user = auth.currentUser;
            if (user) {
              const userRef = doc(db, "users", user.uid);
              await setDoc(
                userRef,
                {
                  fcmToken: currentToken,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ); // 他のフィールドがあっても消さないようにmerge
              console.log("✅ Token saved to Firestore!");
            }
          } else {
            console.log("No registration token available.");
          }
        }
      }
    } catch (error) {
      console.error("An error occurred while retrieving token. ", error);
    }
  };

  // フォアグラウンド（アプリを開いている時）の通知受信設定
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const messaging = getMessaging(app);

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("🌟 フォアグラウンドで通知を受信しました:", payload);

        // ブラウザ標準の通知を無理やり出す
        if (Notification.permission === "granted") {
          new Notification(payload.notification?.title || "通知", {
            body: payload.notification?.body,
            icon: "/icons/icon-192x192.png",
          });
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return {
    token,
    notificationPermission,
    requestNotificationPermission,
    isPermissionResolved,
  };
}

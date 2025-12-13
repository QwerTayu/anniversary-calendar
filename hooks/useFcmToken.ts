import { useState } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { app, db, auth } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export function useFcmToken() {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(() => {
      if (typeof window !== "undefined" && "Notification" in window) {
        return Notification.permission;
      }
      return "default";
    });

  const requestNotificationPermission = async () => {
    try {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const messaging = getMessaging(app);

        // 許可を求める
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

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
               await setDoc(userRef, {
                 fcmToken: currentToken,
                 updatedAt: serverTimestamp(),
               }, { merge: true }); // 他のフィールドがあっても消さないようにmerge
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

  return { token, notificationPermission, requestNotificationPermission };
}

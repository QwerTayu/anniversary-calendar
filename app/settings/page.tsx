"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Info, ShieldCheck } from "lucide-react";
import { doc, updateDoc, deleteField, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFcmToken } from "@/hooks/useFcmToken";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { requestNotificationPermission } = useFcmToken();

  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isNotifSaving, setIsNotifSaving] = useState(false);

  // 未ログインならリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Firestoreの通知設定状態（トークンがあるか）を監視
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // fcmTokenフィールドが存在すれば「通知ON」とみなす
        setIsNotifEnabled(!!data.fcmToken);
      }
      setIsSettingsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 通知スイッチの切替ハンドラ
  const handleNotificationToggle = async (checked: boolean) => {
    if (!user) return;
    if (isNotifSaving) return;

    const prev = isNotifEnabled;
    setIsNotifEnabled(checked);
    setIsNotifSaving(true);

    try {
      if (checked) {
        // ONにする: 許可を求めてトークンを取得・保存
        // (useFcmToken内のロジックでFirestoreへの保存まで行われます)
        await requestNotificationPermission();
      } else {
        // OFFにする: Firestoreからトークンを削除する
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          fcmToken: deleteField(),
        });
      }
    } catch (error) {
      console.error("Notification toggle error:", error);
      setIsNotifEnabled(prev); // 失敗時は戻す
      alert("設定の変更に失敗しました。");
    } finally {
      setIsNotifSaving(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* 1. 通知設定 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">通知設定</CardTitle>
          </div>
          <CardDescription>毎朝9時に記念日をお知らせします</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="notif-toggle" className="text-base">
                記念日通知
              </Label>
              <p className="text-xs text-muted-foreground">
                {isNotifEnabled
                  ? "現在はONになっています"
                  : "現在はOFFになっています"}
              </p>
            </div>

            {isSettingsLoading ? (
              <div className="h-6 w-10 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                {isNotifSaving && (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
                    aria-label="saving"
                  />
                )}
              <Switch
                id="notif-toggle"
                checked={isNotifEnabled}
                onCheckedChange={handleNotificationToggle}
                  disabled={isNotifSaving}
              />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. アカウント設定 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">アカウント</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              ログイン中のメールアドレス
            </span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>

          <Separator />

          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </CardContent>
      </Card>

      {/* 3. アプリ情報 */}
      <div className="text-center text-sm text-muted-foreground pt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4" />
          <span>QwerTayu</span>
        </div>
        <div>
          <p>Anniversary Calendar</p>
          <p>Version {process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}</p>
        </div>
      </div>
    </div>
  );
}

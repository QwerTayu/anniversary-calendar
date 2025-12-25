"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Bell,
  Info,
  ShieldCheck,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { requestNotificationPermission } = useFcmToken();

  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isNotifSaving, setIsNotifSaving] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpires, setIssuedExpires] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [expiresCountdown, setExpiresCountdown] = useState<string | null>(null);

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
        const pid = data.partnerId || null;
        setPartnerId(pid);

        if (pid) {
          const pref = doc(db, "users", pid);
          onSnapshot(pref, (pSnap) => {
            setPartnerEmail(pSnap.exists() ? pSnap.data().email ?? null : null);
          });
        } else {
          setPartnerEmail(null);
        }
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

  const getIdToken = async () => auth.currentUser?.getIdToken();

  const handleIssueInvite = async () => {
    if (!user) return;
    setPairingLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "発行に失敗");
      setIssuedCode(json.code);
      setIssuedExpires(json.expiresAt);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "招待コードの発行に失敗しました";
      alert(msg);
    } finally {
      setPairingLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user || !inviteCode.trim()) return;
    setPairingLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "連携に失敗");
      setInviteCode("");
      setIssuedCode(null);
      setIssuedExpires(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e ?? "");
      if (msg === "Already paired") {
        alert("既に他のユーザーと連携しています");
      } else if (msg === "Invalid issuer") {
        alert("無効な招待コードです");
      } else if (msg === "Code expired") {
        alert("招待コードの期限が切れています");
      } else {
        alert(msg || "招待コードが無効か期限切れです");
      }
    } finally {
      setPairingLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (!confirm("パートナー連携を解除する？")) return;
    setPairingLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "解除に失敗");
      setIssuedCode(null);
      setIssuedExpires(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "解除に失敗しました";
      alert(msg);
    } finally {
      setPairingLoading(false);
    }
  };

  useEffect(() => {
    if (!issuedExpires) {
      setExpiresCountdown(null);
      return;
    }
    const update = () => {
      const diff = new Date(issuedExpires).getTime() - Date.now();
      if (diff <= 0) {
        setExpiresCountdown("期限切れ");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setExpiresCountdown(`${mins}分${secs}秒`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [issuedExpires]);

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

      {/* 2. パートナー連携 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">パートナー連携</CardTitle>
          </div>
          <CardDescription>
            共有ONの記念日だけ相手のカレンダーにも表示されるよ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="font-medium">
              状態:{" "}
              {partnerId ? `連携中 (${partnerEmail ?? partnerId})` : "未連携"}
            </p>
            {issuedExpires && expiresCountdown && (
              <p className="text-xs text-muted-foreground">
                招待コード有効期限: あと {expiresCountdown}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleIssueInvite}
              disabled={pairingLoading || !!partnerId}
            >
              招待コードを発行
            </Button>
            {issuedCode && (
              <div className="text-sm bg-muted rounded px-3 py-2">
                <p className="font-bold tracking-[0.3em]">{issuedCode}</p>
                <p className="text-xs text-muted-foreground">
                  有効期限までに相手が入力してね
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-code">招待コードを入力</Label>
            <div className="flex gap-2">
              <Input
                id="invite-code"
                placeholder="6桁コード"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="uppercase"
                maxLength={6}
              />
              <Button
                onClick={handleAcceptInvite}
                disabled={pairingLoading || !!partnerId}
              >
                連携する
              </Button>
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            className="text-destructive border-destructive/40"
            onClick={handleDisconnect}
            disabled={pairingLoading || !partnerId}
          >
            <Unlink className="mr-2 h-4 w-4" />
            連携を解除する
          </Button>
        </CardContent>
      </Card>

      {/* 3. アカウント設定 */}
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

      {/* 4. アプリ情報 */}
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

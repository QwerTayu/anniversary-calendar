"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // ログイン成功したらホームへ飛ばす
      router.push("/");
    } catch (error) {
      console.error("Login failed", error);
      alert("ログインに失敗しました");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">記念日万年カレンダー</CardTitle>
          <CardDescription>
            あなたの大切な記念日を記録しましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleGoogleLogin} className="w-full" size="lg">
            Googleでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

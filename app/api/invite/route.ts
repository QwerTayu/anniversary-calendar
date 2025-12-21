import { NextResponse } from "next/server";
import { dbAdmin, authAdmin } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// 招待コード作成API
export async function POST(request: Request) {
  try {
    // 1. IDトークンの検証 (ログインユーザーかチェック)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. ユニークな招待コードを生成 (重複チェック付き)
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let inviteCode = "";
    let isUnique = false;
    let retryCount = 0;

    while (!isUnique && retryCount < 5) {
      inviteCode = "";
      for (let i = 0; i < 6; i++) {
        inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // 重複チェック
      const doc = await dbAdmin.collection("invitations").doc(inviteCode).get();
      if (!doc.exists) {
        isUnique = true;
      }
      retryCount++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // 3. DBに保存 (有効期限は5分)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await dbAdmin
      .collection("invitations")
      .doc(inviteCode)
      .set({
        issuerId: uid,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
      });

    return NextResponse.json({
      code: inviteCode,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Invite create error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

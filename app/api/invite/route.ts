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
    const decoded = await authAdmin.verifyIdToken(token);
    const uid = decoded.uid;

    // 既存招待を掃除
    const snap = await dbAdmin
      .collection("invitations")
      .where("issuerId", "==", uid)
      .get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
    }

    // 2. ユニークな招待コードを生成 (重複チェック付き)
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // TODO: O,Iは削除？？
    let code = "";
    let isUnique = false;
    const RETRY_LIMIT = 8;
    for (let retry = 0; retry < RETRY_LIMIT && !isUnique; retry++) {
      code = Array.from(
        { length: 6 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("");
      const exists = await dbAdmin.collection("invitations").doc(code).get();
      if (!exists.exists) isUnique = true;
    }
    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // 3. DBに保存 (有効期限は5分)
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await dbAdmin
      .collection("invitations")
      .doc(code)
      .set({
        issuerId: uid,
        expiresAt: Timestamp.fromDate(expires),
        createdAt: Timestamp.now(),
      });

    return NextResponse.json({ code, expiresAt: expires.toISOString() });
  } catch (err) {
    console.error("invite error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

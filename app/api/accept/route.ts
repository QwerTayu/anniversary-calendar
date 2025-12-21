import { NextResponse } from "next/server";
import { dbAdmin, authAdmin } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// ペアリング受諾API
export async function POST(request: Request) {
  try {
    // 1. 認証チェック (入力した人 = User B)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userB = decodedToken.uid;

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // 2. トランザクション実行
    await dbAdmin.runTransaction(async (t) => {
      const inviteRef = dbAdmin.collection("invitations").doc(code);
      const inviteDoc = await t.get(inviteRef);

      // コードの有効性チェック
      if (!inviteDoc.exists) {
        throw new Error("Invalid code");
      }
      const invite = inviteDoc.data();
      const expiresAt = (invite?.expiresAt as Timestamp)?.toMillis();
      if (!expiresAt || expiresAt < Date.now()) {
        throw new Error("Code expired");
      }

      const userA = invite?.issuerId as string;
      if (!userA || userA === userB) {
        throw new Error("Invalid issuer");
      }

      // 既存パートナーチェック (上書き防止)
      const userARef = dbAdmin.collection("users").doc(userA);
      const userBRef = dbAdmin.collection("users").doc(userB);
      const [aDoc, bDoc] = await Promise.all([
        t.get(userARef),
        t.get(userBRef),
      ]);
      if (aDoc.data()?.partnerId || bDoc.data()?.partnerId) {
        throw new Error("Already paired");
      }

      // 更新実行！
      t.update(userARef, { partnerId: userB, updatedAt: Timestamp.now() });
      t.update(userBRef, { partnerId: userA, updatedAt: Timestamp.now() });
      t.delete(inviteRef);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("accept error", err);
    const msg = err?.message;
    if (msg === "Invalid code" || msg === "Code expired") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg === "Already paired") {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    if (msg === "Invalid issuer") {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

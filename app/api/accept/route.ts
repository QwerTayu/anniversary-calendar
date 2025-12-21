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
    const userB_Uid = decodedToken.uid;

    const { code } = await request.json();
    if (!code)
      return NextResponse.json({ error: "Code is required" }, { status: 400 });

    // 2. トランザクション実行
    await dbAdmin.runTransaction(async (t) => {
      const inviteRef = dbAdmin.collection("invitations").doc(code);
      const inviteDoc = await t.get(inviteRef);

      // コードの有効性チェック
      if (!inviteDoc.exists) {
        throw new Error("Invalid code");
      }
      const inviteData = inviteDoc.data();
      const expiresAt = inviteData?.expiresAt as Timestamp;

      if (expiresAt.toMillis() < Date.now()) {
        throw new Error("Code expired");
      }

      const userA_Uid = inviteData?.issuerId;
      if (userA_Uid === userB_Uid) {
        throw new Error("Cannot pair with yourself");
      }

      // 既存パートナーチェック (上書き防止)
      const userARef = dbAdmin.collection("users").doc(userA_Uid);
      const userBRef = dbAdmin.collection("users").doc(userB_Uid);

      const [userA, userB] = await Promise.all([
        t.get(userARef),
        t.get(userBRef),
      ]);

      if (userA.data()?.partnerId || userB.data()?.partnerId) {
        throw new Error("Already paired");
      }

      // 更新実行！
      t.update(userARef, { partnerId: userB_Uid, updatedAt: Timestamp.now() });
      t.update(userBRef, { partnerId: userA_Uid, updatedAt: Timestamp.now() });

      // 招待コードは使い捨てなので削除
      t.delete(inviteRef);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pairing error:", error);
    const message = error.message || "Internal Server Error";
    // クライアントに分かりやすいエラーを返す
    if (message === "Invalid code" || message === "Code expired") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "Already paired") {
      return NextResponse.json({ error: "Already paired" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

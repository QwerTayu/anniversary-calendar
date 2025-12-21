import { NextResponse } from "next/server";
import { dbAdmin, authAdmin } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// 接続解除API
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const myUid = decodedToken.uid;

    await dbAdmin.runTransaction(async (t) => {
      const myRef = dbAdmin.collection("users").doc(myUid);
      const myDoc = await t.get(myRef);
      const partnerId = myDoc.data()?.partnerId;

      // 自分のパートナーIDを削除
      t.update(myRef, { partnerId: FieldValue.delete() });

      // 相手がいれば、相手のパートナーIDも削除
      if (partnerId) {
        const partnerRef = dbAdmin.collection("users").doc(partnerId);
        t.update(partnerRef, { partnerId: FieldValue.delete() });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
    const myId = decodedToken.uid;

    await dbAdmin.runTransaction(async (t) => {
      const meRef = dbAdmin.collection("users").doc(myId);
      const meDoc = await t.get(meRef);
      const partnerId = meDoc.data()?.partnerId;
      t.update(meRef, { partnerId: FieldValue.delete() });
      if (partnerId) {
        const partnerRef = dbAdmin.collection("users").doc(partnerId);
        t.update(partnerRef, { partnerId: FieldValue.delete() });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("disconnect error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

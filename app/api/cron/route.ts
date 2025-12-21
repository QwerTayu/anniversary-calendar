// app/api/cron/route.ts
import { NextResponse } from "next/server";
import { dbAdmin, messagingAdmin } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("⏰ Cron job started...");

    // JSTで今日のmmdd
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const mm = (jstNow.getMonth() + 1).toString().padStart(2, "0");
    const dd = jstNow.getDate().toString().padStart(2, "0");
    const todayMmDd = `${mm}${dd}`;

    console.log(`📅 Checking memories for: ${todayMmDd}`);

    // 今日の記念日を一括取得
    const memoriesSnapshot = await dbAdmin
      .collection("memories")
      .where("mmdd", "==", todayMmDd)
      .get();

    // userId -> [{title, isShared}]
    const ownerMemories = new Map<
      string,
      { title: string; isShared: boolean }[]
    >();
    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const uid = data.userId as string | undefined;
      const title = data.title as string | undefined;
      const isShared = !!data.isShared;
      if (!uid || !title) return;
      const arr = ownerMemories.get(uid) || [];
      arr.push({ title, isShared });
      ownerMemories.set(uid, arr);
    });

    // 通知対象ユーザーを取得（全ユーザーを読む。規模が大きくなったら絞り込みを検討）
    const usersSnap = await dbAdmin.collection("users").get();

    let successCount = 0;
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const token = userData?.fcmToken as string | undefined;
      const partnerId = userData?.partnerId as string | undefined;

      if (!token) {
        console.log(`❌ No token for user ${uid}`);
        continue;
      }

      const myMemories = ownerMemories.get(uid) || [];
      const partnerShared = partnerId
        ? (ownerMemories.get(partnerId) || []).filter((m) => m.isShared)
        : [];

      const combinedTitles = [...myMemories, ...partnerShared].map(
        (m) => m.title
      );

      if (combinedTitles.length === 0) {
        continue;
      }

      let notificationTitle = "";
      let notificationBody = "";

      if (combinedTitles.length === 1) {
        notificationTitle = `今日は「${combinedTitles[0]}」です！🎉`;
        notificationBody = "思い出を振り返りましょう。";
      } else {
        notificationTitle = "今日は記念日です！🎉";
        notificationBody = `${combinedTitles.join(
          "\n"
        )}\n思い出を振り返りましょう。`;
      }

      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        token,
      };

      try {
        await messagingAdmin.send(message);
        console.log(`✅ Notification sent to user ${uid}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send to user ${uid}:`, error);
      }
    }

    return NextResponse.json({ success: true, sent: successCount });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

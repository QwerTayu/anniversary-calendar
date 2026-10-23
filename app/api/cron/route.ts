// app/api/cron/route.ts
import { NextResponse } from "next/server";
import { dbAdmin, messagingAdmin } from "@/lib/firebase/admin";
import { NOTIFY_DAYS_BEFORE_VALUES } from "@/lib/notification";

export const dynamic = "force-dynamic";

type MemorySummary = { title: string; isShared: boolean };

// JST の今日から offset 日後の mmdd を返す。平年の 2/28 には 2/29 も含める
function targetMmdds(offset: number): string[] {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  jst.setUTCDate(jst.getUTCDate() + offset);
  const mm = (jst.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = jst.getUTCDate().toString().padStart(2, "0");
  const mmdd = `${mm}${dd}`;

  const year = jst.getUTCFullYear();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return mmdd === "0228" && !isLeap ? [mmdd, "0229"] : [mmdd];
}

function buildNotification(offset: number, titles: string[]) {
  const when =
    offset === 0 ? "今日" : offset === 1 ? "明日" : `${offset}日後`;
  const footer =
    offset === 0 ? "思い出を振り返りましょう。" : "準備はできていますか？";

  if (titles.length === 1) {
    return {
      title: `${when}は「${titles[0]}」です！🎉`,
      body: footer,
    };
  }
  return {
    title: `${when}は記念日です！🎉`,
    body: `${titles.join("\n")}\n${footer}`,
  };
}

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

    // offset（何日後か）-> その日の mmdd
    const offsets = [0, ...NOTIFY_DAYS_BEFORE_VALUES];
    const mmddsByOffset = new Map(offsets.map((o) => [o, targetMmdds(o)]));
    const allMmdds = [...new Set([...mmddsByOffset.values()].flat())];

    console.log(`📅 Checking memories for: ${allMmdds.join(", ")}`);

    // 対象日の記念日を一括取得
    const memoriesSnapshot = await dbAdmin
      .collection("memories")
      .where("mmdd", "in", allMmdds)
      .get();

    // `${userId}_${mmdd}` -> [{title, isShared}]
    const memoriesByOwnerDay = new Map<string, MemorySummary[]>();
    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const uid = data.userId as string | undefined;
      const title = data.title as string | undefined;
      const mmdd = data.mmdd as string | undefined;
      if (!uid || !title || !mmdd) return;
      const key = `${uid}_${mmdd}`;
      const arr = memoriesByOwnerDay.get(key) || [];
      arr.push({ title, isShared: !!data.isShared });
      memoriesByOwnerDay.set(key, arr);
    });

    const memoriesOn = (uid: string, mmdds: string[]) =>
      mmdds.flatMap((mmdd) => memoriesByOwnerDay.get(`${uid}_${mmdd}`) || []);

    // TODO: 通知対象ユーザーを取得（全ユーザーを読む。規模が大きくなったら絞り込みを検討）
    const usersSnap = await dbAdmin.collection("users").get();

    let successCount = 0;
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const token = userData?.fcmToken as string | undefined;
      const partnerId = userData?.partnerId as string | undefined;
      const daysBefore = Array.isArray(userData?.notifyDaysBefore)
        ? (userData.notifyDaysBefore as number[])
        : [];

      if (!token) {
        console.log(`❌ No token for user ${uid}`);
        continue;
      }

      for (const offset of [0, ...daysBefore]) {
        const mmdds = mmddsByOffset.get(offset);
        if (!mmdds) continue;

        const myMemories = memoriesOn(uid, mmdds);
        const partnerShared = partnerId
          ? memoriesOn(partnerId, mmdds).filter((m) => m.isShared)
          : [];

        const titles = [...myMemories, ...partnerShared].map((m) => m.title);
        if (titles.length === 0) continue;

        const message = {
          notification: buildNotification(offset, titles),
          // バックグラウンドでは SW の SDK がこの内容で表示する
          webpush: {
            notification: { icon: "/icons/icon-192x192.png" },
          },
          token,
        };

        try {
          await messagingAdmin.send(message);
          console.log(`✅ Notification sent to user ${uid} (+${offset}d)`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to send to user ${uid}:`, error);
        }
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

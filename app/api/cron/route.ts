// app/api/cron/route.ts
import { NextResponse } from "next/server";
import { dbAdmin, messagingAdmin } from "@/lib/firebase/admin";
// import { format } from "date-fns";
// import { toZonedTime } from "date-fns-tz";

// ※ date-fns-tz がない場合は npm install date-fns-tz してください
// 面倒なら手動計算でもいけますが、今回はJST(日本時間)を確実に判定するため手動計算で書きます

export const dynamic = 'force-dynamic'; // キャッシュ無効化

export async function GET(request: Request) {
  try {
    // 1. セキュリティチェック (Vercel Cronからのアクセスであることを確認)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log("⏰ Cron job started...");

    // 2. 「日本の今日」の mmdd を取得
    // VercelのサーバーはUTCなので、+9時間してJSTにする
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const mm = (jstNow.getMonth() + 1).toString().padStart(2, '0');
    const dd = jstNow.getDate().toString().padStart(2, '0');
    const todayMmDd = `${mm}${dd}`;

    console.log(`📅 Checking memories for: ${todayMmDd}`);

    // 3. 今日の日付(mmdd)に一致する記念日を全検索
    const memoriesSnapshot = await dbAdmin
      .collection("memories")
      .where("mmdd", "==", todayMmDd)
      .get();

    if (memoriesSnapshot.empty) {
      console.log("No memories found for today.");
      return NextResponse.json({ success: true, count: 0 });
    }

    // 4. 通知を送るべきユーザーIDと記念日タイトルをまとめる
    // Map<UserId, string[]> -> ユーザーごとに記念日タイトルのリスト
    const userNotifications = new Map<string, string[]>();

    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const uid = data.userId;
      const title = data.title;
      
      if (uid && title) {
        const currentList = userNotifications.get(uid) || [];
        currentList.push(title);
        userNotifications.set(uid, currentList);
      }
    });

    // 5. ユーザーごとに通知送信
    let successCount = 0;

    for (const [uid, titles] of userNotifications.entries()) {
      // ユーザーのFCMトークンを取得
      const userDoc = await dbAdmin.collection("users").doc(uid).get();
      const userData = userDoc.data();
      const token = userData?.fcmToken;

      if (!token) {
        console.log(`❌ No token for user ${uid}`);
        continue;
      }

      // 通知メッセージ作成
      let notificationTitle = "";
      let notificationBody = "";

      if (titles.length === 1) {
        // 1つのとき
        notificationTitle = `今日は「${titles[0]}」です！🎉`;
        notificationBody = "思い出を振り返りましょう。";
      } else {
        // 複数のとき
        notificationTitle = "今日は記念日です！🎉";
        // タイトルを改行でつなげて、最後にメッセージを追加
        notificationBody = `${titles.join("\n")}\n思い出を振り返りましょう。`;
      }

      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        token: token,
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
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

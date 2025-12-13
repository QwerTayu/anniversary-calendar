import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// JSONのインポートはTSの設定によってはエラーになりやすいので、fsで読み込むのが確実です
const serviceAccountPath = path.join(process.cwd(), "service-account.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Admin SDKの初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function sendTestNotification() {
  console.log("🚀 テスト通知の送信を開始します...");

  try {
    const usersSnapshot = await db.collection("users").get();
    
    if (usersSnapshot.empty) {
      console.log("❌ ユーザーが見つかりません。");
      return;
    }

    const tokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log("❌ 有効なFCMトークンが見つかりません。");
      return;
    }

    console.log(`📨 ${tokens.length} 件のデバイスに送信します...`);

    const message = {
      notification: {
        title: "テスト通知成功！🎉",
        body: "これはサーバーから送られた記念日の通知テストです。",
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log("✅ 送信完了！");
    console.log(`成功: ${response.successCount} 件`);
    console.log(`失敗: ${response.failureCount} 件`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

sendTestNotification();

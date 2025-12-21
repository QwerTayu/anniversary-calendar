import "server-only"; // サーバーサイド専用であることを明示
import admin from "firebase-admin";

// すでに初期化されていたら何もしない
if (!admin.apps.length) {
  // Vercelの環境変数には改行コードが含まれないことがあるので、置換処理を入れる
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export const dbAdmin = admin.firestore();
export const messagingAdmin = admin.messaging();
export const authAdmin = admin.auth();

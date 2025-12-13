# Anniversary Calendar
## 💡 コンセプト
大切な記念日を忘れないための、シンプルで強力なカレンダーアプリです。
「あの日から何日経ったっけ？」「次の記念日はいつだっけ？」という悩みを解消します。

PWAに対応しているため、スマホのホーム画面に追加してアプリのように利用できます。また、毎朝9:00に当日の記念日をプッシュ通知でお知らせするため、大切な日を見逃すことがありません。

## 🚀 利用方法
### 🌐 デプロイ済みのサイトにアクセスする
以下のURLからアクセスし、Googleアカウントでログインして利用を開始してください。

**[https://anniversary-calendar.vercel.app/]**

> **スマホでのご利用推奨**
> iPhone (Safari) または Android (Chrome) でアクセスし、「ホーム画面に追加」を行うことで、プッシュ通知機能が利用可能になります。

---

### 🛠️ 自分でビルド・開発する場合
ソースコードをダウンロードし、ご自身の環境で動作させる手順です。

#### 1. リポジトリのクローン
まずはプロジェクトをローカル環境にコピーし、依存ライブラリをインストールします。

```bash
git clone https://github.com/QwerTayu/anniversary-calendar.git
cd anniversary-calendar
npm install

```

#### 2. Firebase プロジェクトの作成
[Firebase Console](https://console.firebase.google.com/) にて新規プロジェクトを作成し、以下の設定を行ってください。

1. **Authentication**: Google ログインを有効にする。
2. **Cloud Firestore**: データベースを作成する（初期はテストモードでOKですが、本番時はセキュリティルールを設定してください）。
3. **Cloud Messaging**: Webプッシュ通知の設定を行う（Webプッシュ証明書の鍵ペアを作成）。
4. **サービスアカウント**: 「プロジェクトの設定」>「サービスアカウント」から「新しい秘密鍵の生成」を行い、jsonファイルをダウンロードする。

#### 3. 環境変数の設定（ローカル開発用）
プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を記述してください。
（各値は Firebase コンソールの「プロジェクトの設定」>「全般」にある SDK 設定構成から取得できます）

```env
# Firebase Client SDK 設定 (ブラウザ用)
NEXT_PUBLIC_FIREBASE_API_KEY=あなたのapiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=あなたのprojectId.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=あなたのprojectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=あなたのprojectId.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=あなたのmessagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=あなたのappId

# Web Push 公開鍵 (Cloud Messagingタブの「Webプッシュ証明書」鍵ペア)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=あなたのVAPIDキー(BJX...で始まる長い文字列)

# Cronジョブ認証用 (任意の文字列を設定)
CRON_SECRET=あなたの好きなパスワード

```

#### 4. サービスアカウントキーの配置
ダウンロードした管理者用の秘密鍵ファイル（`.json`）を、ファイル名を `service-account.json` に変更してプロジェクトのルート直下に配置してください。

> **⚠️ 注意**: `service-account.json` と `.env.local` は機密情報を含むため、Gitコミットには含めないでください（`.gitignore` に記述済みであることを確認してください）。

#### 5. ローカルサーバーの起動
以下のコマンドで開発サーバーを立ち上げます。

```bash
npm run dev

```

`http://localhost:3000` にアクセスして動作を確認します。

---

## ☁️ Vercel へのデプロイと設定
本番環境（Vercel）で稼働させるための設定です。

1. GitHub にコードをプッシュし、Vercel で新規プロジェクトとしてインポートします。
2. **Environment Variables（環境変数）** に、上記の `.env.local` の内容に加え、以下のサーバーサイド用変数を設定してください。

| 変数名 | 値の説明 |
| --- | --- |
| `FIREBASE_CLIENT_EMAIL` | `service-account.json` 内の `client_email` の値 |
| `FIREBASE_PRIVATE_KEY` | `service-account.json` 内の `private_key` の値（`-----BEGIN...` から全てコピー） |

3. デプロイ完了後、**Cron Jobs** (定期実行) が機能していることを Vercel ダッシュボードから確認できます。

### ⚠️ Firebase Authentication のドメイン許可
デプロイ後、Firebase コンソールの **Authentication > 設定 > 承認済みドメイン** に、Vercel のドメイン（例: `yourapp.vercel.app`）を追加してください。これを忘れるとログイン時にエラーになります。

## Edited by Gemini

// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

/**
 * Firebase Configはgitignoreしなくても良いらしい。
 * このファイルはnextjsのビルドに含まれないため。環境変数を使えない。そのため直書きをします。
 * 参考: https://firebase.google.com/docs/projects/api-keys?hl=ja
 */
const firebaseConfig = {
  apiKey: "AIzaSyAyrYwOuuVcy4g-po8rDN6FWtqyeOgHG38",
  authDomain: "anniversary-calendar-cfeda.firebaseapp.com",
  projectId: "anniversary-calendar-cfeda",
  storageBucket: "anniversary-calendar-cfeda.firebasestorage.app",
  messagingSenderId: "727352393422",
  appId: "1:727352393422:web:b01b989ad6a78e8353da9f"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// バックグラウンド通知のハンドリング
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png' // アイコン画像へのパス
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

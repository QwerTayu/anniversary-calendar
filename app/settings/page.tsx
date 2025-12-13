export default function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">設定</h1>
      <p>ここに通知設定などが表示されます。</p>
      <div className="mt-4 text-sm text-gray-500">
        App Version: {process.env.NEXT_PUBLIC_APP_VERSION || "v1.1.0-dev"}
      </div>
    </div>
  );
}

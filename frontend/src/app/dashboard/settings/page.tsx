export default function SettingsPage() {
  return (
    <div className="container p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">個人設定</h1>
        <p className="text-muted-foreground">
          管理您的個人資料與偏好設定。
        </p>
      </div>
      <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">功能開發中</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
             設定學號、SSH Key 與通知偏好。
          </p>
        </div>
      </div>
    </div>
  );
}

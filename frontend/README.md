# NTUST RRC Website Frontend

這是 NTUST RRC 社團管理系統的前端專案，採用 **Next.js 16 (App Router)** 建構，並使用 **Google Apps Script (GAS)** 作為後端 API。

## 🛠️ 技術棧

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) (Radix UI based)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **HTTP Client**: Axios

## 🚀 快速開始

### 1. 環境變數設定

複製 `.env.local.example` (若無則直接建立) 為 `.env.local`，並填入以下變數：

```bash
# 後端 API 地址 (GAS Web App URL)
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/您的ID/exec
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 即可瀏覽。

## 📂 專案結構

```
src/
├── app/
│   ├── api/               # BFF Proxy (解決 CORS 與隱藏後端 URL)
│   ├── dashboard/         # 使用者後台 (主要功能區)
│   │   ├── applications/  # 申請紀錄
│   │   ├── equipment/     # 器材租借
│   │   ├── finance/       # 財務報帳
│   │   └── ...
│   ├── auth/              # 登入頁面
│   └── page.tsx           # 首頁
├── components/
│   ├── ui/                # Shadcn 通用組件
│   └── ...                # 業務相關組件
├── lib/                   # 工具函式與 API 封裝
└── store/                 # Zustand 狀態管理
```

## ✨ 主要功能

*   **使用者認證**: 透過 GAS 驗證學號與密碼。
*   **器材租借**: 瀏覽器材目錄、加入購物車、送出借用申請。
*   **財務報帳**: 動態新增費用明細、上傳發票憑證 (Google Drive 整合)。
*   **響應式設計**: 手機版與桌面版最佳化體驗。
*   **BFF 架構**: 透過 Next.js API Routes 轉發請求，確保安全性與解決跨域問題。

## 📝 開發指南

1.  **新增 UI 元件**: 使用 `npx shadcn@latest add [component-name]`。
2.  **API 呼叫**: 請在 `@/lib/api` 中封裝新的 API 請求，並透過 `@/app/api` 建立 Proxy Route。
3.  **狀態管理**: 全域狀態請使用 Zustand 定義於 `@/store`。

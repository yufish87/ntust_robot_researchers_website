# NTUST RRC Website Frontend

這是 NTUST RRC 社團管理系統的前端專案，採用 Next.js 16 (App Router) 建構，並使用 Google Apps Script (GAS) 作為後端 API。本文件提供詳細的開發說明與安裝指南。

## 技術棧

### 核心框架

- **Framework**: [Next.js 16.2.6](https://nextjs.org/) (App Router)
- **打包器**: Turbopack (快速構建)
- **語言**: TypeScript 5.x

### 前端技術

- **樣式系統**: [Tailwind CSS 4](https://tailwindcss.com/) + PostCSS
- **UI 組件庫**: [Shadcn/UI](https://ui.shadcn.com/) (基於 Radix UI)
- **圖示庫**: [Lucide React](https://lucide.dev/)
- **文件解析**: [React Markdown](https://github.com/remarkjs/react-markdown) + [Remark GFM](https://github.com/remarkjs/remark-gfm)

### 狀態與表單管理

- **狀態管理**: [Zustand](https://github.com/pmndrs/zustand)
- **表單處理**: [React Hook Form](https://react-hook-form.com/)
- **表單驗證**: [Zod](https://zod.dev/)

### API 與通訊

- **HTTP 客戶端**: TanStack Query + Axios
- **後端 API**: Google Apps Script (GAS) Web App
- **安全性**: Next.js BFF Proxy 反向代理 + AES-256-GCM 加密 HttpOnly Session Cookie

## 快速開始

### 1. 前置條件

- Node.js 18.17+ 或 20+
- npm 或 pnpm / yarn
- 後端 Google Apps Script 已完成部署並取得 Web App URL

### 2. 環境變數設定

在 `frontend/` 目錄建立 `.env.local` 檔案：

```bash
# 後端 API 地址 (Google Apps Script Web App URL)
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_GAS_DEPLOYMENT_ID/exec

# 其他設定 (可選)
NEXT_PUBLIC_API_TIMEOUT=30000
```

### 3. 安裝依賴

```bash
npm install
```

如果遇到套件版本問題，可使用：

```bash
npm install --legacy-peer-deps
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:3000`

### 5. 生產環境構建與驗證

```bash
npm run build
npm run start
```

## 專案結構詳解

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (路由與頁面)
│   │   ├── page.tsx            # 官網公開首頁
│   │   ├── layout.tsx          # 根佈局 (Root Layout)
│   │   ├── globals.css         # 全域樣式與 Tailwind 配置
│   │   │
│   │   ├── manual/             # 公開使用手冊頁面 (/manual)
│   │   │
│   │   ├── api/                # BFF Proxy 層 (Backend For Frontend)
│   │   │   ├── [...path]/      # 通用 GAS 反向代理
│   │   │   ├── auth/           # 認證與 Session 管理
│   │   │   ├── courses/        # 課程教材接口
│   │   │   ├── applications/   # 器材/財務申請接口
│   │   │   ├── machine/        # 機臺預約與檔案接口
│   │   │   ├── notification/   # LINE Webhook 與推播接口
│   │   │   ├── storage/        # 檔案下載安全代理
│   │   │   └── upload/         # 檔案上傳初始化與清除 (支援重試)
│   │   │
│   │   ├── auth/               # 登入與註冊頁面 (/auth/login, /auth/register)
│   │   │
│   │   ├── dashboard/          # 社員內部管理系統 (/dashboard)
│   │   │   ├── page.tsx        # 社員首頁 (快捷入口與社辦開放狀態)
│   │   │   ├── layout.tsx      # 內部系統側邊欄佈局
│   │   │   ├── announcements/  # 社團公告專區
│   │   │   ├── competitions/   # 競賽意願專區
│   │   │   ├── courses/        # 專業社課與錄影回放
│   │   │   ├── equipment/      # 器材借用目錄與購物車
│   │   │   │   ├── checkout/   # 器材借用確認送出
│   │   │   │   └── applications/# 個人器材借用記錄
│   │   │   ├── finance/        # 財務報帳記錄
│   │   │   │   └── new/        # 新增財務報帳申請
│   │   │   ├── machine/        # 機臺設備借用總覽與排程日曆
│   │   │   │   ├── 3d-printer/ # 借用 3D 列印機
│   │   │   │   └── laser-cutter/# 借用雷射切割機
│   │   │   ├── manual/         # 社員操作使用手冊
│   │   │   ├── settings/       # 個人設定、通知信箱與偏好中心
│   │   │   └── wishlist/       # 許願池專區
│   │   │
│   │   └── admin/              # 管理幹部後台 (/admin)
│   │       ├── page.tsx        # 後台概覽儀表板
│   │       ├── layout.tsx      # 管理員側邊欄佈局
│   │       ├── announcements/  # 公告發布與三軌推播管理
│   │       ├── courses/        # 社課內容維護與開課推播
│   │       ├── equipment/      # 器材借用審核與簽出歸還
│   │       │   └── inventory/  # 器材總表與入庫盤點
│   │       ├── finance/        # 財務報帳初審與撥款核銷
│   │       ├── machine/        # 機臺借用排程審核
│   │       ├── manual/         # 管理員後台審核手冊
│   │       ├── members/        # 社員名冊與到期狀態
│   │       └── users/          # 人員權限與註冊驗證碼派發
│   │
│   ├── components/             # React 組件庫
│   │   ├── ui/                 # Shadcn/UI 基礎組件
│   │   ├── auth/               # 登入/註冊/OTP 彈窗組件
│   │   ├── course/             # 課程卡片與教材彈窗組件
│   │   ├── equipment/          # 器材卡片、購物車與詳情彈窗
│   │   ├── finance/            # 財務報帳表單與明細清單
│   │   ├── home/               # 公開首頁區塊 (Hero, Features, Footer)
│   │   ├── layout/             # 導覽列、側邊欄 (Sidebar, MobileNav)
│   │   ├── manual/             # 使用手冊容器與 MarkdownViewer
│   │   ├── settings/           # 個人設定與自訂通知偏好卡片 (NotificationPrefsCard)
│   │   └── admin/              # 後台標準標題列 (AdminPageHeader)
│   │
│   ├── content/                # 使用說明 Markdown 文件庫
│   │   └── manual/
│   │       ├── member/         # 社員使用指南 (overview, equipment, machine, finance, faq, wishlist)
│   │       └── admin/          # 管理員審核指引 (overview, users, equipment, machine, finance)
│   │
│   ├── lib/                    # 核心工具函式庫
│   │   ├── api.ts              # Axios 實例與全域錯誤攔截
│   │   ├── session.ts          # AES-256-GCM Session Cookie 加解密
│   │   ├── utils.ts            # 通用輔助函式 (cn, date 格式化)
│   │   ├── api/                # 各功能模組 API 封裝 (auth, equipment, machine, finance, user 等)
│   │   └── types/              # 全域 TypeScript 型別定義
│   │
│   ├── store/                  # Zustand 狀態管理庫
│   │   ├── useAuthStore.ts     # 使用者認證與身份組狀態
│   │   └── useCartStore.ts     # 器材借用購物車狀態
│   │
│   └── hooks/                  # 自訂 React Hooks (use-toast, use-debounce 等)
│
├── public/                     # 靜態資源 (圖標、輪播圖、說明文件位置圖)
│   └── image/
│       ├── manual/             # 使用手冊相關配圖 (如雷切走廊定位圖)
│       └── Competition/        # 競賽輪播成果圖
│
├── .next/                      # Next.js 構建快取與輸出
├── components.json             # Shadcn 組件設定檔
├── next.config.ts              # Next.js 組態檔
├── tsconfig.json               # TypeScript 編譯設定檔
├── package.json
└── README.md
```

## 主要功能模組

### 1. 認證與身份組體系 (Authentication & RBAC)

- 支援 6 碼驗證碼入社註冊、學號密碼登入。
- 支援忘記密碼透過臺科大學生信箱（`學號@mail.ntust.edu.tw`）接收 6 位數 OTP 驗證碼自助重設（安全強制錨定學校官方信箱）。
- 支援個人設定中填寫「自訂通知信箱（通知 Email）」，社務通知信件優先發送至個人常用信箱。
- 完整實作身份組生命週期（正式社員、資格過期、管理員），支援「重新加入社團」驗證碼啟用。
- Session Cookie 採用 AES-256-GCM 加密儲存於 HttpOnly Cookie，Token 由 BFF Proxy 反向代理攔截，前端不持有明文 Token。

### 2. 自訂通知偏好訂閱中心與 LINE 官方帳號綁定 (Notification Preferences & LINE Bot)

- **LINE 官方帳號綁定**：動態產出 15 分鐘時效之 6 碼英數綁定碼與 QR Code，聊天室回傳驗證碼即透過 Webhook 自動完成雙向綁定，支援一鍵解除。
- **四大社務事件雙軌開關**：社課與重要公告、器材借用、機臺設備預約、財務報帳與請款，各事件均可獨立開啟或關閉 Email 與 LINE 推播。
- **動態智慧預設機制**：
  - **已綁定 LINE**：LINE 推播全開，Email 預設僅保留「財務報帳與請款」（保留重要單據憑證不洗版）。
  - **未綁定 LINE**：Email 通知全開（防止漏接重要訊息）。
  - 提供「恢復預設值」按鈕一鍵還原系統推薦配置。

### 3. 檔案上傳與自動重試機制 (Resilient File Upload)

- 針對 Next.js BFF Proxy 與 Google Apps Script 之間 302 重導向可能遺失 Body 之問題，實作自動重定向跟隨與備援參數解析。
- 前端 `file-upload.tsx` 實作 3 次客戶端指數退避自動重試（動態顯示第幾次嘗試中）與手動重試按鈕。
- BFF 伺服器端實作 3 次指數退避重試，確保發票照片、Gcode 切片檔案等大檔案能穩定上傳。

### 4. 系統使用說明中心 (Documentation & Manual)

- 支援全文關鍵字搜尋、即時目錄索引（TOC）與章節切換。
- Markdown 文件解析支援 GitHub Alert 語法。
- 雷射切割可切材質清單重構為結構化三欄對照表（材料類別、允許切削材質、加工特性與防焰注意事項）。
- 涵蓋系統概覽、器材借用、機臺借用、財務報帳、許願池與常見問答 FAQ。

### 5. 器材借用系統 (Equipment Management)

- 即時庫存狀態標籤（「剩餘: N」、「已借完」、「可直接取用」）。
- 整合購物車機制與自動預分配最小序號可用實體編號。
- 完整支援借用審核、社辦現場領取點收與實體歸還結案作業。

### 6. 機臺設備借用系統 (Machine Reservation)

- **3D 列印（Creality Ender 3 S1 Pro 等）**：支援 30MB Gcode 上傳、預覽圖、PETG 耗材規範、時長乘算與新手教學勾選。
- **雷射切割（FLUX Ador 等）**：結構化材質對照、禁切劇毒材質、專用桌推至室外走廊開放空間與排煙操作守則。
- 提供機臺時段日曆排程檢視器，防撞期排程與一鍵重新整理。

### 7. 財務報帳系統 (Finance & Reimbursement)

- 四大報帳類別（一般報銷、社團內部競賽報銷、上銀競賽報銷、暑期營隊報銷）。
- 嚴格校驗臺科大統編 `04126516` 與抬頭 `國立臺灣科技大學`。
- 多圖憑證上傳、品項明細動態加總與「回報已投遞發票」核銷確認機制。

### 8. 後台管理系統 (Admin Dashboard)

- 標準化 `AdminPageHeader` 統一風格與跨裝置排版。
- **發布三軌推播系統**：發布公告與社課時支援勾選「Email 全體社員」、「LINE 個人推播」與「LINE 社員大群群播」。
- **社員通知偏好自動過濾**：發送個人推播時系統自動依每位社員的個人通知偏好進行過濾，不重複打擾已關閉的成員。
- 提供器材庫存盤點、機臺審核、財務撥款標記與人員驗證碼管理。

## 常用指令

| 指令            | 說明                                    |
| --------------- | --------------------------------------- |
| `npm run dev`   | 啟動本地開發伺服器 (http://localhost:3000) |
| `npm run build` | 執行 Next.js 生產環境打包與靜態頁面生成 |
| `npm run start` | 啟動生產環境伺服器                      |
| `npm run lint`  | 執行 ESLint 程式碼規範檢查              |

## 故障排除

### Port 3000 已被佔用

```bash
# Windows
netstat -ano | findstr :3000

# 或指定其他 Port 啟動
npm run dev -- -p 3001
```

### 快取清理與重新構建

```bash
rm -rf .next
npm run build
```

## 授權

本專案採用 MIT License，詳細內容請參閱根目錄 [LICENSE](../LICENSE) 文件。

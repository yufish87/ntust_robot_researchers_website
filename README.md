# 臺科大機器人研究社 社團網站

歡迎來到臺科大機器人研究社 (Robot Researchers Club) 的社團網站專案。
本系統旨在協助社團管理器材借用、財務報帳、機臺設備借用、社課資源分享、競賽意願調查等日常行政事務，並提供對外宣傳平台。

## 專案結構

本儲存庫包含以下主要部分：

```
ntust_rrc_website/
├── frontend/          # Next.js 16 前端應用程式
├── gas-backend/       # Google Apps Script 後端代碼 (由 clasp 管理)
├── .clasp.json        # clasp 設定檔（GAS 部署用）
├── .gitignore
├── LICENSE            # MIT License
├── NOTICE.md          # 第三方套件授權聲明
└── README.md
```

詳細的前端開發說明與安裝步驟，請參閱 [前端目錄說明](frontend/README.md)。

## 技術架構

### 前端技術棧

| 分類      | 技術                                      |
| --------- | ----------------------------------------- |
| 框架      | Next.js 16.2.6 (App Router)               |
| 語言      | TypeScript                                |
| 打包器    | Turbopack                                 |
| 樣式      | Tailwind CSS 4 + PostCSS                  |
| UI 元件庫 | Shadcn/UI (Radix UI)                      |
| 狀態管理  | Zustand                                   |
| 表單處理  | React Hook Form + Zod                     |
| API 請求  | TanStack Query + Axios                    |
| 文件解析  | React-Markdown + Remark-GFM               |
| 通知提示  | Sonner                                    |
| 日期處理  | date-fns                                  |
| 輪播組件  | Embla Carousel                            |

### 後端技術棧

| 分類     | 技術                          |
| -------- | ----------------------------- |
| 平台     | Google Apps Script            |
| 語言     | JavaScript                    |
| 架構     | Controller-Service-Repository |
| 資料庫   | Google Sheets                 |
| 部署工具 | clasp                         |

### 後端模組

```
gas-backend/
├── Config.js          # 環境設定 (Sheet ID 等)
├── Main.js            # 進入點 & 路由分發
├── database/
│   └── SheetDB.js     # Sheet 資料存取基底
├── lib/
│   ├── FileService.js # 檔案上傳服務
│   ├── Response.js    # 統一回應格式
│   ├── Router.js      # 路由器 (含路由參數容錯解析)
│   └── Utils.js       # 通用工具
└── modules/
    ├── admin/         # 後台管理
    ├── auth/          # 認證 (登入/註冊/學校信箱 OTP 密碼重設)
    ├── course/        # 課程管理與開課推播
    ├── equipment/     # 器材借用、審核與盤點總表
    ├── finance/       # 財務報帳與核銷撥款
    ├── machine/       # 機臺設備借用 (3D列印/雷切) 與排程
    ├── notification/  # 訊息推播核心 (LINE Messaging API / Flex 卡片 / Email 模板 / 偏好中心)
    ├── upload/        # 檔案上傳與自動重試支援
    ├── user/          # 用戶與身份組管理 (含自訂通知信箱)
    └── wishlist/      # 許願池專區
```

## 核心功能

### 用戶認證與身份組授權

- 社員註冊（6 碼註冊驗證碼機制）與學號密碼登入
- 學校信箱（`學號@mail.ntust.edu.tw`）OTP 自助重設密碼（強制錨定學校官方信箱保障帳號所有權）
- 支援「自訂通知信箱（通知 Email）」，社務審核與公告優先寄達個人常用信箱，留空則自動回退為學校信箱
- 歷年社費學年記錄與「重新加入社團」驗證碼續約機制
- 資格過期降權防護（過期社員保留公告/社課權限，限制借用與報帳）

### 自訂通知偏好訂閱中心 (Notification Center & LINE Bot)

- **LINE 官方帳號雙向綁定**：
  - 動態產出 15 分鐘時效 6 碼英數綁定碼與 QR Code。
  - 聊天室直接發送代碼即可透過 Webhook 完成快速綁定，支援一鍵解除綁定。
- **四大社務事件雙軌開關**：
  - 「社課與重要公告」、「社團器材借用」、「機臺設備預約」、「財務報帳與請款」個別支援 Email 與 LINE 推播開關。
- **動態智慧預設機制**：
  - **已綁定 LINE**：LINE 預設全數開啟即時通知，Email 預設僅保留「財務報帳與請款」（保留重要收據憑證不洗版）。
  - **未綁定 LINE**：Email 預設全數開啟（避免漏接重要通知）。
  - 提供「恢復預設值」按鈕，一鍵還原系統推薦配置。

### 檔案上傳與自動重試機制 (Resilient File Upload)

- 針對 Next.js BFF Proxy 與 Google Apps Script 之間 302 重導向可能遺失 Body 之問題，實作自動重定向跟隨與備援參數解析。
- 前端上傳組件實作 3 次客戶端自動重試（指數退避延遲 1s、2s、4s）與動態提示，並提供失敗時手動重傳機制。
- BFF 伺服器端實作 3 次指數退避重試，大幅提升弱網環境下發票、Gcode 與切片圖檔的上傳成功率。

### 系統使用說明中心 (Manual)

- 採用 Markdown 文件化驅動架構，支援即時全文關鍵字搜尋與大綱目錄 (TOC) 跳轉
- 提供前台社員操作手冊（`/dashboard/manual`）、公開指南（`/manual`）與後台管理員審核手冊（`/admin/manual`）
- 支援 GitHub Alert 警示標籤、表格防折行最佳化（`first:whitespace-nowrap`）、四級標題層級調優與自適應操作示意圖
- 雷射切割適用材質重構為結構化三欄對照表（材料類別、允許材質、光學切削特性與防焰注意事項）

### 社團課程專區 (Courses)

- 學期分類篩選（例如 `113-2`、`114-1`）與大綱簡介
- 公開 / 社員限定教材區分
- 課堂投影片（PDF/PPTX）、範例程式碼下載與社課錄影線上觀看

### 器材借用系統 (Equipment)

- 器材即時庫存狀態標籤（「剩餘: N」、「已借完」、「可直接取用」）
- 借用清單購物車機制與最小序號實體編號預分配
- 六大借用歸還流程：挑選器材 ➔ 檢視詳情加入清單 ➔ 填表申請 ➔ 幹部審核 ➔ 社辦現場領取 ➔ 實體歸還結案
- 歷史申請單追蹤、損壞主動通報與後台入庫盤點

### 機臺設備借用系統 (Machine)

- **3D 列印機（Ender 3 S1 Pro 等）**：切片 Gcode 檔案上傳（30MB 上限）、預覽圖、PETG 耗材規範、預估時長/重量乘算、初學者協助與首層黏著維護守則
- **雷射切割機（FLUX Ador 等）**：結構化材質清單（黑胡桃木/檜木/膠合板/密集板/黑色壓克力/紙板/皮革/布料/竹材）、嚴禁劇毒材質（PVC/PC 等）、室外走廊定位與排煙安全操作守則
- 即時排程日曆防撞期檢視與一鍵重新整理

### 財務報帳系統 (Finance)

- 四大報帳類別（一般報銷、社團內部競賽報銷、上銀競賽報銷、暑期營隊報銷）
- 嚴格遵循臺科大報帳規範（統一編號 `04126516`、抬頭 `國立臺灣科技大學`）
- 單據多圖上傳與明細動態加總計算
- 四大核銷進度流程（審核中 ➔ 已通過 ➔ 實體發票投遞並線上回報 ➔ 財務長清點撥款結案）

### 社團公告系統 (Announcements)

- 即時公告發布與分類標籤
- 支援檔案附件下載與圖文內容展示

### 競賽意願專區與許願池

- 跨系所組隊媒合與經費指導意願調查（`/dashboard/competitions`）
- 電子乖乖擬真祈福、新器材採購建議與工作坊回饋許願池（`/dashboard/wishlist`）

### 後台管理系統 (Admin)

- 統一標準化標題列（`AdminPageHeader`），響應式支援電腦、平板與手機，已優化手機頂部導航列間距（`pt-18`）
- **發布三軌推播系統**：發布公告與社課時支援勾選「Email 全體社員」、「LINE 個人推播」與「LINE 社員大群群播」
- **社員通知偏好自動過濾**：發送個人通知前自動檢查社員偏好開關，不重複打擾已關閉通知之社員
- 器材總表維護、借用審核與實體盤點點收
- 機臺借用排程審核與時段管理
- 財務單據線上初審、實體發票點收與撥款標記
- 人員驗證碼派發、身份組變更與公告課程管理

## 快速開始

前端開發環境設定、環境變數、安裝步驟請參閱 [前端開發說明](frontend/README.md)。

### 後端部署

Google Apps Script 後端使用 clasp 進行版本管理：

1. 安裝 clasp：`npm install -g @google/clasp`
2. 登入 Google 帳號：`clasp login`
3. 在 `Config.js` 中設定 Google Sheet ID
4. 推送程式碼：`clasp push`
5. 部署為 Web App

## 授權

本專案採用 MIT License，詳細內容請參閱 [LICENSE](LICENSE) 文件。
第三方套件授權聲明請參閱 [NOTICE.md](NOTICE.md) 文件。

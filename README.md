# NTUST RRC 社團管理系統

歡迎來到臺科大機器人研究社 (Robot Researchers Club) 的社團資源管理系統專案。
本系統旨在協助社團管理器材租借、財務報帳、競賽意願調查等日常行政事務。

## 專案結構

本儲存庫目前包含以下主要部分：

*   **frontend/**: 基於 Next.js 16 (App Router) 的前端應用程式。
*   **docs/**: 相關開發文件與說明。
*   **gas-backend/**: Google Apps Script 後端代碼。

詳細的前端開發說明與安裝步驟，請參閱 [前端目錄說明](frontend/README.md)。

## 功能概覽

*   **器材租借**: 線上瀏覽社團資產，申請借用與歸還。
*   **財務報帳**: 社員可線上填寫報帳申請，並上傳證明單據。
*   **權限管理**: 整合 Google Apps Script 後端進行身分驗證。

## 授權

本專案採用 MIT License，詳細內容請參閱 [LICENSE](LICENSE) 文件。
第三方套件授權聲明請參閱 [NOTICE.md](NOTICE.md)。

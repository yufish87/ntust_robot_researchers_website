import fs from "fs";
import path from "path";
import { ManualPageContainer, type ManualTabItem } from "@/components/manual/manual-page-container";

export const metadata = {
  title: "系統使用說明 | 資源管理系統",
  description: "臺科大機器人研究社資源管理系統社員使用指南與申請流程說明",
};

function loadDoc(filename: string): { content: string; updatedAt: string } {
  try {
    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "manual",
      "member",
      filename
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const stat = fs.statSync(filePath);
    const d = stat.mtime;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      content,
      updatedAt: `${year}/${month}/${day}`,
    };
  } catch (error) {
    console.error(`Failed to read manual file ${filename}:`, error);
    return {
      content: `# 載入失敗\n\n無法讀取 ${filename} 說明文件內容。`,
      updatedAt: "未知",
    };
  }
}

export default function MemberManualPage() {
  const docOverview = loadDoc("overview.md");
  const docCalendar = loadDoc("calendar.md");
  const docEquipment = loadDoc("equipment.md");
  const docMachine = loadDoc("machine.md");
  const docFinance = loadDoc("finance.md");
  const docWishlist = loadDoc("wishlist.md");
  const docFaq = loadDoc("faq.md");

  const tabs: ManualTabItem[] = [
    {
      id: "overview",
      label: "系統簡介與帳號",
      iconName: "overview",
      content: docOverview.content,
      updatedAt: docOverview.updatedAt,
      description: "官網與資源管理系統架構、註冊驗證碼、登入與重新加入社團",
    },
    {
      id: "calendar",
      label: "行事曆與社課資源",
      iconName: "calendar",
      content: docCalendar.content,
      updatedAt: docCalendar.updatedAt,
      description: "社團活動行事曆、手機 iCal 日曆即時訂閱、社課教材直連下載與競賽組隊",
    },
    {
      id: "equipment",
      label: "器材借用流程",
      iconName: "equipment",
      content: docEquipment.content,
      updatedAt: docEquipment.updatedAt,
      description: "器材目錄挑選、加入清單、提交申請、幹部審核與歸還點收",
    },
    {
      id: "machine",
      label: "機臺設備借用",
      iconName: "machine",
      content: docMachine.content,
      updatedAt: docMachine.updatedAt,
      description: "3D 列印機與雷射切割機借用申請、切片圖檔上傳與排程避碰",
    },
    {
      id: "finance",
      label: "財務報帳申請",
      iconName: "finance",
      content: docFinance.content,
      updatedAt: docFinance.updatedAt,
      description: "四大報帳類別、統編發票規範、線上明細填寫與撥款核銷",
    },
    {
      id: "wishlist",
      label: "社團許願池",
      iconName: "wishlist",
      content: docWishlist.content,
      updatedAt: docWishlist.updatedAt,
      description: "電子乖乖擬真祈福、器材採購與社課主題建議、每日限制與集氣評估",
    },
    {
      id: "faq",
      label: "常見問題 FAQ",
      iconName: "faq",
      content: docFaq.content,
      updatedAt: docFaq.updatedAt,
      description: "各模組常見疑難雜症、LINE 綁定排解與即將推出之功能",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <ManualPageContainer
        title="社員使用手冊與規範"
        subtitle="臺科大機器人研究社資源管理系統社員使用指南與申請流程說明"
        badgeText="社員專屬指南"
        tabs={tabs}
        defaultTabId="overview"
      />
    </div>
  );
}

import fs from "fs";
import path from "path";
import { SiteHeader } from "@/components/layout/site-header";
import { ManualPageContainer, type ManualTabItem } from "@/components/manual/manual-page-container";
import { SiteFooter } from "@/components/home/site-footer";

export const metadata = {
  title: "社團使用說明",
  description: "臺科大機器人研究社社團網站與資源管理系統使用指南，包含帳號註冊、器材借用、機台預約與財務報帳規範說明。",
  alternates: {
    canonical: "/manual",
  },
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

export default function PublicManualPage() {
  const docOverview = loadDoc("overview.md");
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
      description: "官網與資源管理系統說明、註冊驗證碼與登入流程",
    },
    {
      id: "equipment",
      label: "器材借用流程",
      iconName: "equipment",
      content: docEquipment.content,
      updatedAt: docEquipment.updatedAt,
      description: "挑選器材、提交申請、幹部審核與歸還點收",
    },
    {
      id: "machine",
      label: "機具設備預約",
      iconName: "machine",
      content: docMachine.content,
      updatedAt: docMachine.updatedAt,
      description: "3D 列印機與雷射切割機預約、Gcode 與切片截圖上傳",
    },
    {
      id: "finance",
      label: "財務報帳申請",
      iconName: "finance",
      content: docFinance.content,
      updatedAt: docFinance.updatedAt,
      description: "報帳申請、統編開立、繳交發票與撥款進度",
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
      label: "常見問題與其他",
      iconName: "faq",
      content: docFaq.content,
      updatedAt: docFaq.updatedAt,
      description: "課程資源下載、新功能預告與常見問題解答",
    },
  ];

  return (
    <div className="min-h-screen bg-[#1e1c24] text-white selection:bg-[#ffc000] selection:text-[#1e1c24] flex flex-col justify-between">
      {/* 頂部固定滿版導覽列 */}
      <SiteHeader />

      {/* 手冊內容主體 */}
      <main className="w-full flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ManualPageContainer
          title="社團使用指南"
          subtitle="本指南協助全體社員與新生快速了解社團網站與資源管理系統之各項功能操作、借用規範與申請流程。"
          badgeText="社員指南"
          tabs={tabs}
          defaultTabId="overview"
        />
      </main>

      {/* 頁尾 */}
      <SiteFooter className="w-full" />
    </div>
  );
}

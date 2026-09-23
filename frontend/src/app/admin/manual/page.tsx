import fs from "fs";
import path from "path";
import { ManualPageContainer, type ManualTabItem } from "@/components/manual/manual-page-container";

export const metadata = {
  title: "管理員手冊 | 管理員後台",
  description: "臺科大機器人研究社管理員後台操作手冊與審核作業指引",
};

function loadAdminDoc(filename: string): { content: string; updatedAt: string } {
  try {
    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "manual",
      "admin",
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
    console.error(`Failed to read admin manual file ${filename}:`, error);
    return {
      content: `# 載入失敗\n\n無法讀取 ${filename} 說明文件內容。`,
      updatedAt: "未知",
    };
  }
}

export default function AdminManualPage() {
  const docOverview = loadAdminDoc("overview.md");
  const docCalendar = loadAdminDoc("calendar.md");
  const docEquipment = loadAdminDoc("equipment.md");
  const docMachine = loadAdminDoc("machine.md");
  const docFinance = loadAdminDoc("finance.md");
  const docUsers = loadAdminDoc("users.md");

  const tabs: ManualTabItem[] = [
    {
      id: "overview",
      label: "後台概覽與權限",
      iconName: "admin_overview",
      content: docOverview.content,
      updatedAt: docOverview.updatedAt,
      description: "管理員角色職責、權限範圍與操作稽核原則",
    },
    {
      id: "calendar",
      label: "行事曆活動管理",
      iconName: "calendar",
      content: docCalendar.content,
      updatedAt: docCalendar.updatedAt,
      description: "全社活動發布、分類管理、排程衝突預防與手機 iCal 即時同步",
    },
    {
      id: "users",
      label: "人員與公告課程",
      iconName: "users",
      content: docUsers.content,
      updatedAt: docUsers.updatedAt,
      description: "註冊驗證碼派發、身份組變更、公告發布與課程維護",
    },
    {
      id: "equipment",
      label: "器材審核與盤點",
      iconName: "equipment",
      content: docEquipment.content,
      updatedAt: docEquipment.updatedAt,
      description: "待審核、借用中點收歸還、器材總表維護與入庫盤點",
    },
    {
      id: "machine",
      label: "機器審核與排程",
      iconName: "machine",
      content: docMachine.content,
      updatedAt: docMachine.updatedAt,
      description: "3D 列印與雷切借用審核、排程時段管理與現場支援分配",
    },
    {
      id: "finance",
      label: "財務審核與撥款",
      iconName: "finance",
      content: docFinance.content,
      updatedAt: docFinance.updatedAt,
      description: "經費報帳初審、實體發票簽收核銷與出納撥款作業",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <ManualPageContainer
        title="社團幹部管理後台操作指引"
        subtitle="臺科大機器人研究社管理員後台操作手冊與審核作業指引"
        badgeText="幹部專屬指引"
        tabs={tabs}
        defaultTabId="overview"
      />
    </div>
  );
}

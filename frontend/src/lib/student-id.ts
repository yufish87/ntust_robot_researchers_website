/**
 * NTUST Student ID Parser & Department Helpers
 */

export interface DepartmentOption {
  code: string;
  name: string;
}

export const DEGREE_MAP: Record<string, string> = {
  B: "大學部",
  M: "碩士班",
  D: "博士班",
  A: "二技",
  E: "在職專班",
  P: "碩士在職專班",
  N: "進修部",
};

export const DEFAULT_DEPARTMENTS: DepartmentOption[] = [
  { code: "01", name: "工業管理系" },
  { code: "02", name: "電子工程系" },
  { code: "03", name: "機械工程系" },
  { code: "04", name: "材料科學與工程系" },
  { code: "05", name: "營建工程系" },
  { code: "06", name: "化學工程系" },
  { code: "07", name: "電機工程系" },
  { code: "08", name: "企業管理系" },
  { code: "09", name: "資訊管理系" },
  { code: "10", name: "設計系" },
  { code: "11", name: "數位學習與教育研究所" },
  { code: "12", name: "自動化及控制研究所" },
  { code: "13", name: "建築系" },
  { code: "15", name: "資訊工程系" },
  { code: "16", name: "管理研究所" },
  { code: "17", name: "應用外語系" },
  { code: "18", name: "財務金融研究所" },
  { code: "19", name: "光電工程研究所" },
  { code: "20", name: "科技管理研究所" },
  { code: "21", name: "管理學院MBA" },
  { code: "22", name: "應用科技研究所" },
  { code: "23", name: "醫學工程研究所" },
  { code: "24", name: "專利研究所" },
  { code: "25", name: "色彩與照明科技研究所" },
  { code: "27", name: "資通科技國際學士學位學程" },
  { code: "30", name: "不分系學士班" },
  { code: "31", name: "工程學士班" },
  { code: "32", name: "電資學士班" },
  { code: "33", name: "管理學士班" },
  { code: "34", name: "創意設計學士班" },
  { code: "35", name: "先進科技全英語外國學生專班" },
  { code: "37", name: "全球發展工程學士學位學程" },
];

export interface StudentIdAnalysis {
  isValidFormat: boolean;
  degreeCategory: string; // 大學部 / 碩士班 / 博士班 ...
  entryYear: string;      // 民國年，例如 112
  deptCode: string;       // 例如 07
  deptName: string;       // 例如 資訊工程系
  calculatedGrade: string;// 年級數字，例如 2
}

/**
 * 依據學號字串解析身份、系所與入學年
 * @param studentId 學號 (如 B11207123)
 * @param departments 可選的動態系所清單
 */
export function analyzeStudentId(
  studentId: string,
  departments: DepartmentOption[] = DEFAULT_DEPARTMENTS,
): StudentIdAnalysis {
  const cleanId = (studentId || "").trim().toUpperCase();

  // 典型 NTUST 格式：[英文字母(1~2碼)][民國年(3碼)][系所代碼(2碼)][流水號(2~4碼)]
  const match = cleanId.match(/^([A-Z]+)(\d{3})(\d{2})(\d+)$/);

  if (!match) {
    return {
      isValidFormat: false,
      degreeCategory: "",
      entryYear: "",
      deptCode: "",
      deptName: "",
      calculatedGrade: "",
    };
  }

  const [, letter, yearStr, code] = match;
  const degreeCategory = DEGREE_MAP[letter] || "其他";
  const entryYear = yearStr;

  // 計算預期年級
  const now = new Date();
  const currentRocYear = now.getFullYear() - 1911;
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentAcademicYear = currentMonth >= 9 ? currentRocYear : currentRocYear - 1;
  const entryYearNum = parseInt(yearStr, 10);
  const diff = currentAcademicYear - entryYearNum + 1;
  const calculatedGrade = diff > 0 ? String(diff) : "1";

  // 比對系所代碼
  const safeDepts = Array.isArray(departments) ? departments : DEFAULT_DEPARTMENTS;
  const deptMatch = safeDepts.find(
    (d) => String(d?.code ?? "").padStart(2, "0") === String(code ?? "").padStart(2, "0"),
  );
  const deptName = deptMatch ? deptMatch.name : "";

  return {
    isValidFormat: true,
    degreeCategory,
    entryYear,
    deptCode: code,
    deptName,
    calculatedGrade,
  };
}

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Copy, Check, FileText, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReceiptPrintModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  codes: string[];
  description?: string;
  targetYear?: string;
}

const ITEMS_PER_PAGE = 6;

/**
 * 產生純淨獨立的列印專用 HTML（供不可見 iframe 列印使用，徹底隔離 Dialog / Modal 與 CSS 污染）
 */
function generatePrintHtml(pages: string[][], targetYear?: string, origin = ""): string {
  const pagesHtml = pages
    .map((pageCodes) => {
      // 依實際組數生成，不強行補滿 6 列空白欄位（若為空頁至少保留一組）
      const rowsCodes = pageCodes.length > 0 ? pageCodes : [""];

      const rowsHtml = rowsCodes
        .map((code, rowIndex) => {
          const isLastRow = rowIndex === rowsCodes.length - 1;
          const borderBottomStyle = isLastRow ? "border-bottom: none;" : "border-bottom: 1px solid #000;";

          const leftSlipHtml = renderSlipHtml("社員聯", code, targetYear, origin);
          const rightSlipHtml = renderSlipHtml("存根聯", code, targetYear, origin);

          return `
            <tr style="height: 46.2mm; box-sizing: border-box; ${borderBottomStyle}">
              <td style="width: 98mm; height: 46.2mm; border-right: 1px solid #000; vertical-align: top; padding: 2.5mm 3.5mm; box-sizing: border-box;">
                ${leftSlipHtml}
              </td>
              <td style="width: 98mm; height: 46.2mm; vertical-align: top; padding: 2.5mm 3.5mm; box-sizing: border-box;">
                ${rightSlipHtml}
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <div class="print-page">
          <table class="receipt-grid">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8" />
      <title>社費繳交證明列印</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang TC", "Microsoft JhengHei", sans-serif;
          color: #000000;
        }
        .print-page {
          width: 210mm;
          height: 297mm;
          max-height: 297mm;
          padding: 9.9mm 7mm;
          box-sizing: border-box;
          page-break-after: always;
          break-after: page;
          overflow: hidden;
          background: #ffffff;
        }
        .print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        table.receipt-grid {
          width: 196mm;
          border-collapse: collapse;
          table-layout: fixed;
          border: 1.5px solid #000000;
          background: #ffffff;
        }
        table.receipt-grid td {
          padding: 0;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;
}

/**
 * HTML 跳脫函式，防止 XSS 注入
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 產生單聯 HTML
 */
function renderSlipHtml(type: "社員聯" | "存根聯", code: string, targetYear?: string, origin = ""): string {
  const displayCode = code ? escapeHtml(code) : "—";
  const yearLabel = targetYear ? `${escapeHtml(targetYear)}學年` : "NTUST RRC";
  const safeOrigin = origin ? escapeHtml(origin) : "";

  return `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <!-- 頂部 Header：Bar_Logo + 標題 -->
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center;">
          <img src="${safeOrigin}/image/Bar_Logo.png" alt="臺科大機器人研究社" style="height: 32px; max-width: 165px; object-fit: contain; flex-shrink: 0;" />
        </div>
        <div style="display: flex; align-items: baseline; gap: 3px;">
          <span style="font-size: 16.5px; font-weight: bold; color: #000; font-family: sans-serif; letter-spacing: 0.5px;">社費繳交證明</span>
          <span style="font-size: 12.5px; font-weight: bold; color: #222;">(${type})</span>
        </div>
      </div>

      <!-- 中間 Body：手寫欄位 + 右側社章 -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1mm 0 0 0;">
        <div style="display: flex; flex-direction: column; gap: 5.5px; font-size: 15px; font-family: sans-serif; font-weight: 500; color: #000;">
          <div style="display: flex; align-items: flex-end;">
            <span style="display: inline-block; width: 62px;">茲 證明</span>
            <span style="display: inline-block; width: 48px;">姓名：</span>
            <span style="display: inline-block; border-bottom: 1.2px solid #000; width: 110px; height: 16px;"></span>
          </div>
          <div style="display: flex; align-items: flex-end;">
            <span style="display: inline-block; width: 62px;"></span>
            <span style="display: inline-block; width: 48px;">學號：</span>
            <span style="display: inline-block; border-bottom: 1.2px solid #000; width: 110px; height: 16px;"></span>
          </div>
          <div style="display: flex; align-items: flex-end;">
            <span style="display: inline-block; width: 86px;">已繳交社費</span>
            <span style="display: inline-block; border-bottom: 1.2px solid #000; width: 60px; height: 16px; text-align: center;"></span>
            <span style="margin-left: 2px;">元</span>
          </div>
          <div style="display: flex; align-items: flex-end;">
            <span style="display: inline-block; width: 65px;">經手人：</span>
            <span style="display: inline-block; border-bottom: 1.2px solid #000; width: 105px; height: 16px;"></span>
          </div>
        </div>

        <!-- 蓋章區域（放大至 66px） -->
        <div style="width: 66px; height: 66px; border-radius: 50%; border: 1.8px dashed #888; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 600; color: #888; line-height: 1.25; user-select: none; margin-right: 0; flex-shrink: 0;">
          <span>未蓋社</span>
          <span>章無效</span>
        </div>
      </div>

      <!-- 底部 Footer：驗證碼與學年（左邊界完全貼齊上方文字） -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #c0c0c0; padding-top: 3px; margin: 0;">
        <div style="display: flex; align-items: baseline; gap: 4px; font-size: 15px;">
          <span style="font-weight: bold; color: #111;">註冊驗證碼：</span>
          <span style="font-family: monospace; font-weight: bold; font-size: 15.5px; letter-spacing: 0.5px; color: #000;">
            ${displayCode}
          </span>
        </div>
        <div style="font-size: 12px; font-family: monospace; color: #555;">
          ${yearLabel}
        </div>
      </div>
    </div>
  `;
}

export function ReceiptPrintModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  codes,
  description,
  targetYear,
}: ReceiptPrintModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    if (!val && onClose) onClose();
  };

  const [copied, setCopied] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  // 當 Modal 開啟或 codes 變更時，重設分頁至第 1 頁，避免停留在已不存在的頁碼
  React.useEffect(() => {
    if (isModalOpen) {
      setPreviewPage(1);
    }
  }, [isModalOpen, codes]);

  // 將所有驗證碼切分為每頁 6 組
  const totalPages = Math.max(1, Math.ceil(codes.length / ITEMS_PER_PAGE));
  const pages: string[][] = [];
  for (let i = 0; i < codes.length; i += ITEMS_PER_PAGE) {
    pages.push(codes.slice(i, i + ITEMS_PER_PAGE));
  }

  // 取得目前預覽頁的驗證碼代碼（依實際組數排版，不補滿 6 列空白）
  const currentPageCodes = pages[previewPage - 1] || [];
  const previewRows = currentPageCodes.length > 0 ? currentPageCodes : [""];

  /**
   * 使用隱形 iframe 進行列印，徹底隔絕 Radix Dialog、Body scroll-lock 與全域 CSS 的干擾
   */
  const handlePrint = () => {
    try {
      const existingIframe = document.getElementById("receipt-print-iframe");
      if (existingIframe) {
        existingIframe.remove();
      }

      const iframe = document.createElement("iframe");
      iframe.id = "receipt-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const htmlContent = generatePrintHtml(pages, targetYear, origin);

      doc.open();
      doc.write(htmlContent);
      doc.close();

      const doPrint = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            window.print();
          }
        }, 200);
      };

      const images = doc.images;
      if (images.length > 0) {
        let loaded = 0;
        const total = images.length;
        const checkAll = () => {
          loaded++;
          if (loaded >= total) doPrint();
        };
        for (let i = 0; i < total; i++) {
          if (images[i].complete) {
            loaded++;
          } else {
            images[i].onload = checkAll;
            images[i].onerror = checkAll;
          }
        }
        if (loaded >= total) doPrint();
      } else {
        doPrint();
      }
    } catch {
      window.print();
    }
  };

  const handleCopyCodes = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      toast({
        title: "已複製驗證碼清單",
        description: `共 ${codes.length} 組驗證碼已複製至剪貼簿。`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "複製失敗",
        description: "無法寫入剪貼簿，請手動複製。",
      });
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[94vh] flex flex-col p-0 overflow-hidden bg-white border border-neutral-200 text-neutral-900 shadow-2xl">
        {/* 頂部操作列（淺色風格） */}
        <div className="p-4 sm:px-6 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-neutral-900">
              <FileText className="w-5 h-5 text-[#ffc000]" />
              社費繳交證明列印預覽
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 mt-0.5">
              標準 A4 尺寸排版（單頁至多 6 組雙聯單據，共 {codes.length} 組驗證碼 / {totalPages} 頁）
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 mr-2 text-xs text-neutral-600">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 shadow-xs"
                  disabled={previewPage <= 1}
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  title="上一頁"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono px-2 text-neutral-700">
                  {previewPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 shadow-xs"
                  disabled={previewPage >= totalPages}
                  onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                  title="下一頁"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCodes}
              className="text-xs border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-neutral-500" />
                  複製代碼
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-[#ffc000] hover:bg-[#e5ac00] text-black font-semibold text-xs shadow-xs"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              立即列印 / 另存 PDF
            </Button>

            <div className="w-[1px] h-5 bg-neutral-200 mx-0.5 hidden sm:block" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="h-8 w-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 shrink-0"
              title="關閉"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">關閉</span>
            </Button>
          </div>
        </div>

        {/* 預覽主視窗（淺灰柔和底色，襯托出白色 A4 紙張與邊界） */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-neutral-100 flex justify-center items-start">
          {/* A4 實體比例紙張：在 Modal 中寬度自適應（最大 680px），雙聯完整在可見視野內，無需左右滑動 */}
          <div
            className="bg-white text-black shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all duration-200 border border-neutral-300 w-full max-w-[680px] my-1 rounded-xs"
            style={{
              padding: "16px 14px",
              boxSizing: "border-box",
            }}
          >
            {/* 6 列 × 2 聯 固定格網表格 */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                border: "1.5px solid #000000",
                background: "#ffffff",
              }}
            >
              <tbody>
                {previewRows.map((code, rowIndex) => {
                  const isLastRow = rowIndex === previewRows.length - 1;
                  return (
                    <tr
                      key={rowIndex}
                      style={{
                        borderBottom: isLastRow ? "none" : "1px solid #000000",
                      }}
                    >
                      {/* 左聯：社員聯 */}
                      <td
                        style={{
                          width: "50%",
                          borderRight: "1px solid #000000",
                          verticalAlign: "top",
                          padding: "8px 10px",
                          boxSizing: "border-box",
                        }}
                      >
                        <ReceiptSlipView
                          type="社員聯"
                          code={code}
                          targetYear={targetYear}
                        />
                      </td>

                      {/* 右聯：存根聯 */}
                      <td
                        style={{
                          width: "50%",
                          verticalAlign: "top",
                          padding: "8px 10px",
                          boxSizing: "border-box",
                        }}
                      >
                        <ReceiptSlipView
                          type="存根聯"
                          code={code}
                          targetYear={targetYear}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部說明提示（淺色風格） */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500 flex items-center justify-between shrink-0">
          <span>提示：A4 單頁至多配置 6 組雙聯（依實際組數排版），列印設定中將「邊界」設為「無」或「預設」即可。</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="text-neutral-500 hover:text-neutral-900 text-xs h-7 hover:bg-neutral-200/60"
          >
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 預覽視窗單聯 React 元件
 */
function ReceiptSlipView({
  type,
  code,
  targetYear,
}: {
  type: "社員聯" | "存根聯";
  code: string;
  targetYear?: string;
}) {
  const displayCode = code ? code : "—";
  const yearLabel = targetYear ? `${targetYear}學年` : "NTUST RRC";

  return (
    <div className="w-full h-full flex flex-col justify-between select-none py-0.5">
      {/* 頂部 Header：Bar_Logo + 標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/Bar_Logo.png"
            alt="臺科大機器人研究社"
            className="h-[28px] sm:h-[32px] max-w-[140px] sm:max-w-[165px] object-contain shrink-0"
          />
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-bold text-[14px] sm:text-[16px] text-black tracking-wide font-sans">
            社費繳交證明
          </span>
          <span className="text-[11px] sm:text-[12px] text-neutral-800 font-bold">
            ({type})
          </span>
        </div>
      </div>

      {/* 中間主體：手寫欄位 + 右側社章（左邊距歸零，與下方註冊驗證碼完全對齊） */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-1 sm:gap-1.5 text-[13px] sm:text-[15px] font-medium text-black font-sans leading-tight">
          <div className="flex items-end">
            <span className="inline-block w-[62px]">茲 證明</span>
            <span className="inline-block w-[48px]">姓名：</span>
            <span className="inline-block border-b-[1.2px] border-black w-[90px] sm:w-[110px] h-[16px]"></span>
          </div>

          <div className="flex items-end">
            <span className="inline-block w-[62px]"></span>
            <span className="inline-block w-[48px]">學號：</span>
            <span className="inline-block border-b-[1.2px] border-black w-[90px] sm:w-[110px] h-[16px]"></span>
          </div>

          <div className="flex items-end">
            <span className="inline-block w-[86px]">已繳交社費</span>
            <span className="inline-block border-b-[1.2px] border-black w-[48px] sm:w-[60px] h-[16px] text-center"></span>
            <span className="ml-0.5">元</span>
          </div>

          <div className="flex items-end">
            <span className="inline-block w-[65px]">經手人：</span>
            <span className="inline-block border-b-[1.2px] border-black w-[85px] sm:w-[105px] h-[16px]"></span>
          </div>
        </div>

        {/* 蓋章區域 */}
        <div className="w-[56px] h-[56px] sm:w-[66px] sm:h-[66px] rounded-full border-[1.8px] border-dashed border-neutral-400 flex flex-col items-center justify-center text-[11px] sm:text-[12.5px] font-semibold text-neutral-400 leading-tight select-none shrink-0 mr-0">
          <span>未蓋社</span>
          <span>章無效</span>
        </div>
      </div>

      {/* 底部驗證碼註冊列（左邊界完全對齊上方茲證明與經手人） */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-300">
        <div className="flex items-baseline gap-1 text-[13px] sm:text-[15px]">
          <span className="font-bold text-neutral-900">註冊驗證碼：</span>
          <span className="font-mono font-bold text-[13.5px] sm:text-[15.5px] text-black tracking-wider">
            {displayCode}
          </span>
        </div>

        <div className="text-[11px] sm:text-[12px] text-neutral-600 font-mono">
          {yearLabel}
        </div>
      </div>
    </div>
  );
}

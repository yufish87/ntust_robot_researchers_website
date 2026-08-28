"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  LucideIcon,
  Search,
  BookOpen,
  ChevronRight,
  Wrench,
  Printer,
  CreditCard,
  HelpCircle,
  Users,
  ShieldCheck,
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ListTree,
  CornerDownRight,
  Sparkles,
} from "lucide-react";
import { MarkdownViewer, slugify } from "./markdown-viewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

const ICON_MAP: Record<string, LucideIcon> = {
  overview: BookOpen,
  equipment: Wrench,
  machine: Printer,
  finance: CreditCard,
  wishlist: Sparkles,
  faq: HelpCircle,
  users: Users,
  admin_overview: ShieldCheck,
};

export interface ManualTabItem {
  id: string;
  label: string;
  iconName?: string;
  content: string;
  updatedAt?: string;
  description?: string;
}

interface ManualPageContainerProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  tabs: ManualTabItem[];
  defaultTabId?: string;
}

interface ParsedSection {
  id: string;
  tabId: string;
  tabLabel: string;
  iconName?: string;
  heading: string;
  plainText: string;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[!.*?\]/g, "")
    .replace(/[*_`~>\[\]]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\|/g, " ")
    .replace(/-{3,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTabsIntoSections(tabs: ManualTabItem[]): ParsedSection[] {
  const sections: ParsedSection[] = [];

  tabs.forEach((tab) => {
    const lines = tab.content.split("\n");
    let currentHeading = tab.label;
    let currentLines: string[] = [];

    lines.forEach((line) => {
      const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
      if (headingMatch) {
        if (currentLines.length > 0) {
          sections.push({
            id: `${tab.id}-${sections.length}`,
            tabId: tab.id,
            tabLabel: tab.label,
            iconName: tab.iconName,
            heading: currentHeading,
            plainText: stripMarkdown(currentLines.join("\n")),
          });
          currentLines = [];
        }
        currentHeading = headingMatch[1].replace(/[*_`]/g, "").trim();
      } else {
        currentLines.push(line);
      }
    });

    if (currentLines.length > 0) {
      sections.push({
        id: `${tab.id}-${sections.length}`,
        tabId: tab.id,
        tabLabel: tab.label,
        iconName: tab.iconName,
        heading: currentHeading,
        plainText: stripMarkdown(currentLines.join("\n")),
      });
    }
  });

  return sections;
}

function extractTableOfContents(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = markdown.split("\n");

  lines.forEach((line) => {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      const title = h2Match[1].replace(/[*_`]/g, "").trim();
      toc.push({
        id: slugify(title),
        title,
        level: 2,
      });
    } else if (h3Match) {
      const title = h3Match[1].replace(/[*_`]/g, "").trim();
      toc.push({
        id: slugify(title),
        title,
        level: 3,
      });
    }
  });

  return toc;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#ffc000]/30 text-slate-900 dark:text-amber-300 font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function getSnippet(text: string, query: string, maxLength = 140): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  }

  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + query.length + 80);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}

export function ManualPageContainer({
  title,
  subtitle,
  badgeText = "系統指南",
  tabs,
  defaultTabId,
}: ManualPageContainerProps) {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  );
  const [searchInputValue, setSearchInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const sections = useMemo(() => parseTabsIntoSections(tabs), [tabs]);

  const searchResults = useMemo(() => {
    if (!activeQuery.trim()) return [];

    const q = activeQuery.toLowerCase().trim();
    return sections
      .map((sec) => {
        const titleMatch = sec.heading.toLowerCase().includes(q);
        const textMatch = sec.plainText.toLowerCase().includes(q);
        const tabMatch = sec.tabLabel.toLowerCase().includes(q);

        if (!titleMatch && !textMatch && !tabMatch) return null;

        const score = titleMatch ? 10 : tabMatch ? 5 : 1;
        return {
          ...sec,
          score,
          snippet: getSnippet(sec.plainText, activeQuery),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score);
  }, [sections, activeQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveQuery(searchInputValue.trim());
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    setActiveQuery("");
  };

  const handleSelectSearchResult = (tabId: string) => {
    setActiveTab(tabId);
    setActiveQuery("");
    setSearchInputValue("");
  };

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const currentTab = tabs[currentTabIndex] || tabs[0];
  const prevTab = currentTabIndex > 0 ? tabs[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < tabs.length - 1 ? tabs[currentTabIndex + 1] : null;

  const currentToc = useMemo(
    () => (currentTab ? extractTableOfContents(currentTab.content) : []),
    [currentTab]
  );

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Container */}
      <AdminPageHeader title={title} description={subtitle}>
        {/* Search Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 w-full sm:w-72 md:w-80 shrink-0"
        >
          <div className="relative flex items-center flex-1">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="manual-search-input"
              type="text"
              placeholder="搜尋手冊關鍵字…"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              className="w-full h-9 sm:h-10 pl-9 pr-9 bg-black/40 border border-white/15 focus:border-[#ffc000] focus:ring-1 focus:ring-[#ffc000] rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-400 outline-none transition-colors"
            />
            {searchInputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="清除搜尋"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm rounded-lg shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            搜尋
          </Button>
        </form>
      </AdminPageHeader>

      {/* SEARCH RESULTS VIEW */}
      {activeQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-[#201e26] px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Search className="w-4 h-4 text-[#ffc000]" />
              <span>
                關鍵字「<strong className="text-black dark:text-white">{activeQuery}</strong>」搜尋結果，共找到{" "}
                <strong className="text-[#ffc000] font-mono">{searchResults.length}</strong> 筆相關條目：
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              關閉搜尋
            </Button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((item) => {
                if (!item) return null;
                const Icon = ICON_MAP[item.iconName || item.tabId] || FileText;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSearchResult(item.tabId)}
                    className="group bg-white dark:bg-[#201e26] p-5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ffc000] dark:hover:border-[#ffc000] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                          <Icon className="w-3.5 h-3.5 text-[#ffc000]" />
                          {item.tabLabel}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-[#ffc000] transition-colors">
                        <HighlightMatch text={item.heading} query={activeQuery} />
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        <HighlightMatch text={item.snippet} query={activeQuery} />
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-700 dark:text-[#ffc000] font-medium">
                      <span>跳轉至此章節</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 p-8 space-y-3">
              <p className="text-base text-slate-600 dark:text-slate-400">
                查無與「{activeQuery}」相符的說明條目。
              </p>
              <p className="text-xs text-slate-400">
                建議嘗試搜尋常用關鍵字：
                <button type="button" onClick={() => { setSearchInputValue("器材"); setActiveQuery("器材"); }} className="text-[#ffc000] underline mx-1">器材</button>、
                <button type="button" onClick={() => { setSearchInputValue("gcode"); setActiveQuery("gcode"); }} className="text-[#ffc000] underline mx-1">gcode</button>、
                <button type="button" onClick={() => { setSearchInputValue("發票"); setActiveQuery("發票"); }} className="text-[#ffc000] underline mx-1">發票</button>、
                <button type="button" onClick={() => { setSearchInputValue("驗證碼"); setActiveQuery("驗證碼"); }} className="text-[#ffc000] underline mx-1">驗證碼</button>
              </p>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD DOCUMENTATION VIEW */
        <div className="space-y-6">
          {/* Module Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#1a1820] rounded-xl border border-slate-200/80 dark:border-white/10">
            {tabs.map((tab, idx) => {
              const Icon = ICON_MAP[tab.iconName || tab.id] || BookOpen;
              const isActive = tab.id === activeTab;
              const num = String(idx + 1).padStart(2, "0");

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-colors duration-150 cursor-pointer select-none",
                    isActive
                      ? "bg-white dark:bg-[#201e26] text-slate-900 dark:text-white shadow-sm border-slate-200 dark:border-white/15"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 border-transparent"
                  )}
                >
                  <span className={cn("text-[11px] font-mono", isActive ? "text-[#ffc000] font-bold" : "text-slate-400")}>
                    {num}
                  </span>
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors duration-150",
                      isActive ? "text-[#ffc000]" : "text-slate-400"
                    )}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Two-Column Layout: Main Document + Sticky TOC */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left: Main Content Column */}
            <div className="xl:col-span-9 bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 p-6 lg:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pb-3 mb-6 border-b border-slate-100 dark:border-white/5 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#ffc000]" />
                  <span>章節：{currentTab.label}</span>
                </span>
                {currentTab?.updatedAt && (
                  <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-400 font-mono text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    最後修訂：{currentTab.updatedAt}
                  </span>
                )}
              </div>

              <MarkdownViewer content={currentTab.content} />

              {/* Bottom revision note */}
              {currentTab?.updatedAt && (
                <div className="mt-8 flex items-center justify-end text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    此手冊檔案最後更新時間：{currentTab.updatedAt}
                  </span>
                </div>
              )}

              {/* Prev / Next Chapter Buttons */}
              <div className="mt-12 pt-6 border-t border-slate-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevTab ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(prevTab.id)}
                    className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ffc000] dark:hover:border-[#ffc000] hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group cursor-pointer"
                  >
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mb-1">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                      上一章節
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#ffc000] transition-colors">
                      {prevTab.label}
                    </span>
                  </button>
                ) : (
                  <div />
                )}

                {nextTab && (
                  <button
                    type="button"
                    onClick={() => setActiveTab(nextTab.id)}
                    className="flex flex-col items-end p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ffc000] dark:hover:border-[#ffc000] hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-right group cursor-pointer sm:col-start-2"
                  >
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mb-1">
                      下一章節
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#ffc000] transition-colors">
                      {nextTab.label}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Sticky Table of Contents (On this page) */}
            <div className="hidden xl:block xl:col-span-3 sticky top-24 space-y-4">
              <div className="bg-slate-50 dark:bg-[#1a1820] border border-slate-200/80 dark:border-white/10 rounded-xl p-4.5 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs tracking-wider uppercase">
                  <ListTree className="w-4 h-4 text-[#ffc000]" />
                  <span>本頁章節導覽</span>
                </div>

                {currentToc.length > 0 ? (
                  <nav className="space-y-1 text-slate-600 dark:text-slate-400 font-sans">
                    {currentToc.map((item, idx) => (
                      <button
                        key={`${item.id}-${idx}`}
                        type="button"
                        onClick={() => scrollToHeading(item.id)}
                        className={cn(
                          "w-full text-left py-1.5 px-2 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors block truncate cursor-pointer",
                          item.level === 3 ? "pl-4 text-[11px] text-slate-500 dark:text-slate-400" : "font-medium"
                        )}
                      >
                        {item.level === 3 && <CornerDownRight className="w-2.5 h-2.5 inline mr-1 opacity-50" />}
                        <span>{item.title}</span>
                      </button>
                    ))}
                  </nav>
                ) : (
                  <p className="text-slate-400 text-xs">此章節無子標題</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

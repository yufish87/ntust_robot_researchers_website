"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Flame,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <article className={cn("manual-markdown-content text-slate-800 dark:text-slate-200 leading-relaxed font-sans", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).join("");
            const id = slugify(text);
            return (
              <h1
                id={id}
                className="scroll-mt-28 text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2 mb-6 pb-4 border-b border-slate-200/90 dark:border-white/10 flex items-center justify-between"
                {...props}
              >
                <span>{children}</span>
              </h1>
            );
          },
          h2: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).join("");
            const id = slugify(text);
            return (
              <h2
                id={id}
                className="scroll-mt-28 text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-10 mb-4 pb-2.5 border-b border-slate-200/90 dark:border-white/10 flex items-center gap-2"
                {...props}
              >
                <span>{children}</span>
              </h2>
            );
          },
          h3: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).join("");
            const id = slugify(text);
            return (
              <h3
                id={id}
                className="scroll-mt-28 text-base lg:text-lg font-bold text-amber-700 dark:text-[#ffc000] mt-8 mb-3 flex items-center gap-2"
                {...props}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#ffc000] inline-block" />
                <span>{children}</span>
              </h3>
            );
          },
          h4: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).join("");
            const id = slugify(text);
            return (
              <h4
                id={id}
                className="scroll-mt-28 text-[15px] sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2.5 flex items-center gap-2"
                {...props}
              >
                <span>{children}</span>
              </h4>
            );
          },
          p: ({ node, children, ...props }) => {
            const hasImage = node?.children?.some(
              (child: any) =>
                child.tagName === "img" ||
                (child.type === "element" && child.tagName === "img")
            );
            if (hasImage) {
              return <div className="mb-4">{children}</div>;
            }
            return (
              <p className="mb-3.5 leading-7 text-slate-700 dark:text-slate-300 text-[15px] last:mb-0" {...props}>
                {children}
              </p>
            );
          },
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside pl-5 mb-5 space-y-1.5 text-slate-700 dark:text-slate-300 text-[15px] [&_p]:mb-0 [&_p]:leading-7" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside pl-5 mb-5 space-y-1.5 text-slate-700 dark:text-slate-300 text-[15px] font-normal [&_p]:mb-0 [&_p]:leading-7" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-7 pl-1 [&>p]:mb-0" {...props} />
          ),
          blockquote: ({ node, children, ...props }) => {
            const textContent = React.Children.toArray(children).reduce((acc: string, child: any) => {
              if (typeof child === "string") return acc + child;
              if (child?.props?.children) {
                return (
                  acc +
                  React.Children.toArray(child.props.children)
                    .map((c) => (typeof c === "string" ? c : ""))
                    .join("")
                );
              }
              return acc;
            }, "");

            const isNote = textContent.includes("[!NOTE]");
            const isTip = textContent.includes("[!TIP]");
            const isImportant = textContent.includes("[!IMPORTANT]");
            const isWarning = textContent.includes("[!WARNING]");
            const isCaution = textContent.includes("[!CAUTION]");

            if (isNote || isTip || isImportant || isWarning || isCaution) {
              let title = "提示說明";
              let containerStyle = "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
              let badgeStyle = "text-sky-800 bg-sky-100 border border-sky-200 dark:text-sky-300 dark:bg-sky-500/20 dark:border-transparent";
              let Icon = Info;

              if (isTip) {
                title = "實用技巧";
                containerStyle = "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
                badgeStyle = "text-emerald-800 bg-emerald-100 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-transparent";
                Icon = Lightbulb;
              } else if (isImportant) {
                title = "重要規定";
                containerStyle = "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
                badgeStyle = "text-amber-900 bg-amber-100 border border-amber-200 dark:text-amber-300 dark:bg-amber-500/20 dark:border-transparent";
                Icon = AlertTriangle;
              } else if (isWarning) {
                title = "注意事項";
                containerStyle = "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200";
                badgeStyle = "text-orange-900 bg-orange-100 border border-orange-200 dark:text-orange-300 dark:bg-orange-500/20 dark:border-transparent";
                Icon = AlertCircle;
              } else if (isCaution) {
                title = "嚴格警告";
                containerStyle = "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
                badgeStyle = "text-rose-900 bg-rose-100 border border-rose-200 dark:text-rose-300 dark:bg-rose-500/20 dark:border-transparent";
                Icon = Flame;
              }

              const cleanChildren = React.Children.map(children, (child: any) => {
                if (child?.props?.children) {
                  const cleanedSub = React.Children.map(child.props.children, (sub: any) => {
                    if (typeof sub === "string") {
                      return sub.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/g, "");
                    }
                    return sub;
                  });
                  return React.cloneElement(child, {}, cleanedSub);
                }
                if (typeof child === "string") {
                  return child.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/g, "");
                }
                return child;
              });

              return (
                <div
                  className={cn(
                    "my-5 rounded-xl border p-4.5 transition-all text-sm",
                    containerStyle
                  )}
                >
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold", badgeStyle)}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{title}</span>
                    </span>
                  </div>
                  <div className="leading-relaxed [&>p]:mb-1 [&>p:last-child]:mb-0">{cleanChildren}</div>
                </div>
              );
            }

            return (
              <blockquote
                className="my-5 border-l-4 border-amber-500 dark:border-[#ffc000] bg-slate-50 dark:bg-black/40 pl-4 py-3 text-slate-700 dark:text-slate-300 text-sm italic rounded-r-lg border-y border-r border-slate-200/60 dark:border-transparent"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 shadow-xs">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 divide-y divide-slate-200/90 dark:divide-white/10" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-100 dark:bg-[#141218] text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold whitespace-nowrap text-slate-900 dark:text-white" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3.5 border-t border-slate-200/70 dark:border-white/5 font-normal align-top leading-relaxed text-sm first:whitespace-nowrap text-slate-700 dark:text-slate-300" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded-md bg-slate-100 dark:bg-black/50 px-1.5 py-0.5 font-mono text-xs text-amber-800 dark:text-[#ffc000] border border-slate-200 dark:border-white/15 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-5 overflow-hidden rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-950 dark:bg-[#141218] text-slate-200 shadow-xs">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 dark:bg-black/60 border-b border-slate-800 dark:border-white/10 text-[11px] font-mono text-slate-400">
                  <span>TERMINAL / CODE</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          img: ({ node, ...props }) => (
            <figure className="my-6">
              <img
                className="rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs max-w-full h-auto mx-auto object-cover"
                loading="lazy"
                {...props}
              />
              {props.alt && (
                <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {props.alt}
                </figcaption>
              )}
            </figure>
          ),
          a: ({ node, ...props }) => (
            <a
              className="inline-flex items-center gap-0.5 font-semibold text-amber-700 dark:text-[#ffc000] underline underline-offset-4 hover:text-amber-800 dark:hover:text-yellow-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              <span>{props.children}</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60 inline" />
            </a>
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-slate-200/80 dark:border-white/10" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

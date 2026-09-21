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
    <article className={cn("manual-markdown-content text-slate-200 leading-relaxed font-sans", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).join("");
            const id = slugify(text);
            return (
              <h1
                id={id}
                className="scroll-mt-28 text-2xl lg:text-3xl font-bold tracking-tight text-white mt-2 mb-6 pb-4 border-b border-white/10 flex items-center justify-between"
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
                className="scroll-mt-28 text-xl lg:text-2xl font-bold tracking-tight text-white mt-10 mb-4 pb-2.5 border-b border-white/10 flex items-center gap-2"
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
                className="scroll-mt-28 text-base lg:text-lg font-bold text-[#ffc000] mt-8 mb-3 flex items-center gap-2"
                {...props}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffc000] inline-block" />
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
                className="scroll-mt-28 text-[15px] sm:text-base font-bold text-slate-200 mt-6 mb-2.5 flex items-center gap-2"
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
              <p className="mb-3.5 leading-7 text-slate-300 text-[15px] last:mb-0" {...props}>
                {children}
              </p>
            );
          },
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside pl-5 mb-5 space-y-1.5 text-slate-300 text-[15px] [&_p]:mb-0 [&_p]:leading-7" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside pl-5 mb-5 space-y-1.5 text-slate-300 text-[15px] font-normal [&_p]:mb-0 [&_p]:leading-7" {...props} />
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
              let containerStyle = "border-sky-500/30 bg-sky-500/10 text-sky-200";
              let badgeStyle = "text-sky-300 bg-sky-500/20";
              let Icon = Info;

              if (isTip) {
                title = "實用技巧";
                containerStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
                badgeStyle = "text-emerald-300 bg-emerald-500/20";
                Icon = Lightbulb;
              } else if (isImportant) {
                title = "重要規定";
                containerStyle = "border-amber-500/30 bg-amber-500/10 text-amber-200";
                badgeStyle = "text-amber-300 bg-amber-500/20";
                Icon = AlertTriangle;
              } else if (isWarning) {
                title = "注意事項";
                containerStyle = "border-orange-500/30 bg-orange-500/10 text-orange-200";
                badgeStyle = "text-orange-300 bg-orange-500/20";
                Icon = AlertCircle;
              } else if (isCaution) {
                title = "嚴格警告";
                containerStyle = "border-rose-500/30 bg-rose-500/10 text-rose-200";
                badgeStyle = "text-rose-300 bg-rose-500/20";
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
                className="my-5 border-l-2 border-[#ffc000] bg-black/40 pl-4 py-2.5 text-slate-300 text-sm italic rounded-r-md"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-xs">
              <table className="w-full text-left text-sm text-slate-300 divide-y divide-white/10" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[#141218] text-white font-semibold text-xs uppercase tracking-wider" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold whitespace-nowrap text-white" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3.5 border-t border-white/5 font-normal align-top leading-relaxed text-sm first:whitespace-nowrap text-slate-300" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-xs text-[#ffc000] border border-white/15 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-5 overflow-hidden rounded-xl border border-white/10 bg-[#141218] shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10 text-[11px] font-mono text-slate-400">
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
                className="rounded-xl border border-white/10 shadow-sm max-w-full h-auto mx-auto object-cover"
                loading="lazy"
                {...props}
              />
              {props.alt && (
                <figcaption className="text-center text-xs text-slate-400 mt-2 font-medium">
                  {props.alt}
                </figcaption>
              )}
            </figure>
          ),
          a: ({ node, ...props }) => (
            <a
              className="inline-flex items-center gap-0.5 font-semibold text-[#ffc000] underline underline-offset-4 hover:text-yellow-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              <span>{props.children}</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60 inline" />
            </a>
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-white/10" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

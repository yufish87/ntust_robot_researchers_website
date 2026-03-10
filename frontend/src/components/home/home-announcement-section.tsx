"use client";

import { useEffect, useState } from "react";
import { Megaphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Announcement } from "@/lib/types/announcement";

const categoryColor: Record<string, string> = {
  一般公告: "bg-blue-500/20 text-blue-300",
  課程資訊: "bg-green-500/20 text-green-300",
  活動與競賽: "bg-orange-500/20 text-orange-300",
  設備與系統: "bg-purple-500/20 text-purple-300",
};

interface AnnouncementSectionProps {
  className?: string;
  /** 若為 true 使用 /api/announcements (member)，否則 /api/announcements/public */
  memberView?: boolean;
}

export function AnnouncementSection({
  className,
  memberView = false,
}: AnnouncementSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = memberView
      ? "/api/announcements"
      : "/api/announcements/public";

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAnnouncements(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [memberView]);

  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Header */}
        <div className="md:w-1/4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="h-6 w-6 text-[#ffc000]" />
            <h3 className="text-2xl font-bold text-white">最新公告</h3>
          </div>
          <p className="text-sm text-slate-400">社團最新消息與異動</p>
        </div>

        {/* Content */}
        <div className="flex-1 w-full bg-white/5 rounded-xl overflow-hidden">
          <ScrollArea className="h-[280px]">
            {loading ? (
              <div className="flex items-center justify-center h-[280px] text-slate-500">
                載入中...
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-slate-500 italic">
                目前沒有新公告
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {a.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1.5 py-0 border-none",
                              categoryColor[a.category] ||
                                "bg-slate-500/20 text-slate-300",
                            )}
                          >
                            {a.category}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {a.publishTime}
                          </span>
                        </div>
                      </div>
                      {a.attachments && a.attachments.length > 0 && (
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

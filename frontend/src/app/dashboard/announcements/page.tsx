"use client";

import { useEffect, useState } from "react";
import { Megaphone, ExternalLink, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Announcement } from "@/lib/types/announcement";

const categoryColor: Record<string, string> = {
  一般公告: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
  課程資訊: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
  活動與競賽: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
  設備與系統: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAnnouncements(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">公告</h1>
        <p className="text-muted-foreground">
          查看社團的最新動態與重要通知。
        </p>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed p-8">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="mt-2 text-lg font-semibold">目前沒有公告</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              有新公告時會顯示在這裡。
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {announcements.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className={
                      categoryColor[a.category] ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {a.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {a.publishTime}
                  </span>
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {a.content}
                </p>
              </div>
              {a.attachments && a.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {a.attachments.length}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 公告詳情 Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{selected?.title}</DialogTitle>
            <div className="flex items-center gap-2 pt-1">
              {selected && (
                <Badge
                  variant="secondary"
                  className={
                    categoryColor[selected.category] ||
                    "bg-muted text-muted-foreground"
                  }
                >
                  {selected.category}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {selected?.publishTime}
              </span>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {/* 內容 */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selected?.content}
              </div>

              {/* 附件 */}
              {selected?.attachments && selected.attachments.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4" />
                    附件 ({selected.attachments.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selected.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {att.title || att.link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

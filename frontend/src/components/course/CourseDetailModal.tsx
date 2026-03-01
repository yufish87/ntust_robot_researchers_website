import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Course, CourseResource } from "@/lib/types/course";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Video,
  FileText,
  Link as LinkIcon,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CourseDetailModalProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseDetailModal({
  course,
  open,
  onOpenChange,
}: CourseDetailModalProps) {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!course) return null;

  const handleDownload = async (resource: CourseResource) => {
    if (!resource.fileId) {
      window.open(resource.link, "_blank");
      return;
    }

    try {
      setDownloadingId(resource.fileId);

      // 1. Request Access Token
      const tokenRes = await fetch("/api/courses/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          fileId: resource.fileId,
        }),
      });

      const tokenJson = await tokenRes.json();

      if (!tokenJson.success || !tokenJson.data?.token) {
        throw new Error(tokenJson.message || "Failed to get access token");
      }

      // 2. 使用 fetch + Blob 下載檔案
      const token = tokenJson.data.token;
      const downloadRes = await fetch(`/api/storage/download?token=${token}`);

      if (!downloadRes.ok) {
        const errorData = await downloadRes.json().catch(() => null);
        throw new Error(errorData?.error || "下載失敗");
      }

      // 3. 驗證回應確實是二進位檔案 (非 JSON 錯誤回應)
      const contentType = downloadRes.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const errorJson = await downloadRes.json().catch(() => null);
        throw new Error(errorJson?.error || "伺服器回傳非預期格式");
      }

      const blob = await downloadRes.blob();

      if (!blob || blob.size === 0) {
        throw new Error("下載的檔案為空");
      }

      // 4. 從 Content-Disposition header 解析原始檔名 (多重 fallback)
      let filename = resource.title || "download";
      const contentDisposition = downloadRes.headers.get("Content-Disposition");
      if (contentDisposition) {
        // 優先解析 RFC 5987 filename* (支援非 ASCII 字元)
        const utf8Match = contentDisposition.match(
          /filename\*\s*=\s*UTF-8'[^']*'(.+?)(?:\s*;|$)/i,
        );
        if (utf8Match?.[1]) {
          try {
            filename = decodeURIComponent(utf8Match[1].trim());
          } catch {
            // URI 解碼失敗，使用 fallback
          }
        }
        // fallback: 解析標準 filename="..."
        if (!utf8Match?.[1]) {
          const basicMatch = contentDisposition.match(
            /filename\s*=\s*"?([^";]+)"?/i,
          );
          if (basicMatch?.[1]) {
            filename = basicMatch[1].trim();
          }
        }
      }

      // 5. 程式化觸發瀏覽器下載
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // 延遲釋放 blob URL，確保瀏覽器已完成讀取
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      toast({
        title: "下載完成",
        description: `${filename} 已成功下載`,
      });
    } catch (error: any) {
      console.error("Download failed", error);
      toast({
        variant: "destructive",
        title: "下載失敗",
        description: error.message || "無法取得檔案權限",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const renderResourceButton = (
    item: CourseResource,
    icon: React.ReactNode,
    variant: "outline" | "ghost" | "secondary" = "outline",
    className?: string,
  ) => {
    const isDownloading = downloadingId === item.fileId;
    const Icon = item.fileId ? Download : ExternalLink;

    return (
      <Button
        variant="outline"
        className={`justify-start h-auto py-3 px-4 border-l-4 border-l-primary w-full ${className}`}
        onClick={() => handleDownload(item)}
        disabled={isDownloading}
      >
        <span className="font-medium mr-auto truncate">{item.title}</span>
        {isDownloading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin opacity-50" />
        ) : (
          <Icon className="w-4 h-4 ml-2 opacity-50" />
        )}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{course.semester}</Badge>
            {course.permission === "visitor" && (
              <Badge variant="secondary">公開</Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{course.title}</DialogTitle>
          {course.courseDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>課程時間：{course.courseDate}</span>
            </div>
          )}
          <DialogDescription className="whitespace-pre-wrap mt-2">
            {course.description || "無課程說明"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Handouts */}
            {course.handouts && course.handouts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5" /> 講義
                </h3>
                <div className="grid gap-2">
                  {course.handouts.map((item, i) => (
                    <div key={i}>
                      {renderResourceButton(
                        item,
                        <FileText className="w-4 h-4" />,
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {course.videos && course.videos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Video className="w-5 h-5" /> 課程錄影
                  </h3>
                  <div className="grid gap-2">
                    {course.videos.map((item, i) => (
                      <div key={i}>
                        {/* Videos usually don't support file download, keep as link */}
                        <Button
                          variant="outline"
                          className="justify-start h-auto py-3 px-4 border-l-4 border-l-primary w-full"
                          asChild
                        >
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="font-medium mr-auto truncate">
                              {item.title}
                            </span>
                            <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Others */}
            {course.others && course.others.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <LinkIcon className="w-5 h-5" /> 其他資源
                  </h3>
                  <div className="grid gap-2">
                    {course.others.map((item, i) => (
                      <div key={i}>
                        {renderResourceButton(
                          item,
                          <LinkIcon className="w-4 h-4" />,
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!course.handouts?.length &&
              !course.videos?.length &&
              !course.others?.length && (
                <div className="text-center text-muted-foreground py-8">
                  本課程尚無相關資源
                </div>
              )}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-right mt-2">
          發布於 {course.uploadTime}
        </div>
      </DialogContent>
    </Dialog>
  );
}

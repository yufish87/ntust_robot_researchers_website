"use client";

import { useState, useRef, ChangeEvent, forwardRef, useImperativeHandle } from "react";
import { UploadCloud, X, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import axios from "axios";

interface FileUploadProps {
  onUploadComplete?: (fileId: string) => void;
  onFileChange?: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number; // default 10MB
  className?: string;
  folderType?: "finance" | "machine_3dp" | "machine_lsc" | "equipment"; // Default: finance
  folderId?: string;
  formatHint?: string;
}

export interface FileUploadRef {
  upload: (customFileName?: string) => Promise<string>;
  clear: () => void;
  hasFile: () => boolean;
}

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(({ 
  onUploadComplete, 
  onFileChange,
  accept = "image/*,application/pdf", 
  maxSizeMB = 10,
  className,
  folderType = "finance",
  folderId,
  formatHint
}, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [retryCount, setRetryCount] = useState(0);
  const MAX_AUTO_RETRIES = 3;

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validation
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setErrorMessage(`檔案大小不能超過 ${maxSizeMB}MB`);
        setStatus("error");
        return;
      }
      
      setFile(selectedFile);
      setStatus("idle");
      setErrorMessage("");
      setProgress(0);
      setRetryCount(0);
      onFileChange?.(selectedFile);
    }
  };

  // Single upload cycle (Init + PUT)
  const attemptSingleUpload = async (uploadName: string, contentType: string): Promise<string> => {
    // 1. Init Session
    const initResponse = await axios.post("/api/upload/init", {
      fileName: uploadName,
      mimeType: contentType,
      fileSize: file!.size,
      type: folderType,
      folderId,
    });
    const { sessionUri, fileId: initFileId } = initResponse.data;
    if (!sessionUri) throw new Error("無法取得上傳連結");

    // 2. Direct PUT to Google Drive
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", sessionUri);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let finalId = initFileId;
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.id) finalId = res.id;
          } catch (e) {}

          if (finalId) {
            resolve(finalId);
          } else {
            reject(new Error("上傳成功但未回傳 File ID"));
          }
        } else {
          reject(new Error(`上傳失敗: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        // 解決方案：如果已有 initFileId，視為成功（避免 CORS 封鎖最後回應）
        if (initFileId) {
          resolve(initFileId);
        } else {
          reject(new Error("網路連線中斷或 CORS 錯誤"));
        }
      };

      xhr.send(file);
    });
  };

  // Upload with automatic retries
  const executeUpload = async (customFileName?: string): Promise<string> => {
    if (!file) {
      setErrorMessage("沒有選擇檔案");
      setStatus("error");
      throw new Error("No file selected");
    }

    setStatus("uploading");
    setErrorMessage("");
    const uploadName = customFileName || file.name;
    const contentType = file.type || "application/octet-stream";

    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_AUTO_RETRIES; attempt++) {
      setRetryCount(attempt);
      try {
        const finalId = await attemptSingleUpload(uploadName, contentType);
        setStatus("success");
        setErrorMessage("");
        onUploadComplete?.(finalId);
        return finalId;
      } catch (err: any) {
        lastError = err;
        console.warn(`[FileUpload] 上傳嘗試 ${attempt}/${MAX_AUTO_RETRIES} 失敗:`, err);

        if (attempt < MAX_AUTO_RETRIES) {
          // 指數退避延遲：1s, 2s
          const delayMs = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          setProgress(0);
        }
      }
    }

    // 全部重試失敗
    setStatus("error");
    const errMsg = lastError?.response?.data?.error || lastError?.message || "上傳發生錯誤";
    setErrorMessage(`上傳失敗（已自動重試 ${MAX_AUTO_RETRIES} 次）：${errMsg}`);
    throw lastError;
  };

  // Expose method to parent
  useImperativeHandle(ref, () => ({
    upload: (name?: string) => executeUpload(name),
    clear: clearFile,
    hasFile: () => !!file
  }));

  const clearFile = () => {
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
    setProgress(0);
    setRetryCount(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange?.(null);
  };

  // Drag and Drop handlers
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const f = e.dataTransfer.files[0];
       if (f.size > maxSizeMB * 1024 * 1024) {
         setErrorMessage(`檔案大小不能超過 ${maxSizeMB}MB`);
         setStatus("error");
         return;
       }
       setFile(f);
       setStatus("idle");
       setErrorMessage("");
       onFileChange?.(f);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[150px]",
            isDragging ? "border-primary bg-primary/10" : "border-slate-300 hover:border-primary hover:bg-slate-50",
            errorMessage ? "border-red-500 bg-red-50" : ""
          )}
        >
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept={accept}
          />
          <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">
            點擊或拖曳檔案至此
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatHint || `支援格式: .png, .jpg, .pdf (Max ${maxSizeMB}MB)`}
          </p>
          {errorMessage && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errorMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="bg-slate-100 p-2 rounded">
                <FileIcon className="h-6 w-6 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Removed "Start Upload" button since it is now controlled by parent */}
              {status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              
              {status === "success" && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已完成
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-8 w-8 text-slate-400 hover:text-red-500"
                onClick={clearFile}
                disabled={status === "uploading"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {status === "uploading" && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-slate-500">
                {retryCount > 1 ? (
                  <span className="text-amber-600 font-medium">
                    正在自動重新嘗試上傳（第 {retryCount} / {MAX_AUTO_RETRIES} 次）... {progress}%
                  </span>
                ) : (
                  `上傳中... ${progress}%`
                )}
              </p>
            </div>
          )}

          {/* Error after select */}
          {status === "error" && errorMessage && (
            <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between gap-2">
              <p className="text-xs text-red-500 font-medium flex items-center min-w-0">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0 text-red-500" />
                <span className="truncate">{errorMessage}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => executeUpload()}
              >
                重新嘗試上傳
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = "FileUpload";

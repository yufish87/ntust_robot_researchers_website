import { useEffect, useCallback } from "react";

interface UseUnsavedChangesOptions {
  message?: string;
  enabled?: boolean;
}

const DEFAULT_MESSAGE =
  "您有尚未儲存的變更內容，確定要放棄編輯並離開嗎？\n\nAre you sure you want to discard your changes?";

/**
 * 統一管理「未儲存內容防呆警告」Hook
 * 1. 監聽瀏覽器 beforeunload 事件（重整、關閉分頁、網址列跳轉）
 * 2. 提供 confirmDiscard 函式供 Modal 遮罩關閉、取消按鈕或頁面返回使用
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  options?: UseUnsavedChangesOptions
) {
  const enabled = options?.enabled ?? true;
  const message = options?.message || DEFAULT_MESSAGE;

  // 監聽重整 / 關閉瀏覽器分頁
  useEffect(() => {
    if (!isDirty || !enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, enabled, message]);

  // 主動確認函式（供 Modal 或按鈕判斷）
  const confirmDiscard = useCallback(
    (customMsg?: string) => {
      if (!isDirty || !enabled) return true;
      return window.confirm(customMsg || message);
    },
    [isDirty, enabled, message]
  );

  return { confirmDiscard };
}

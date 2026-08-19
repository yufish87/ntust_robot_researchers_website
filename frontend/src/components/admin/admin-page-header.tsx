"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  badgeText?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  variant?: "dashboard" | "admin";
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  children,
  variant,
  className,
}: AdminPageHeaderProps) {
  const pathname = usePathname();
  const isAdmin =
    variant === "admin" || (variant === undefined && pathname?.startsWith("/admin"));

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 p-5 sm:p-6 lg:p-7 text-white shadow-sm transition-colors",
        isAdmin ? "bg-black" : "bg-[#34313d]",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {children && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

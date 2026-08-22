"use client";

import { useState, useEffect } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollIndicator() {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollPage = (direction: "up" | "down") => {
    if (direction === "up") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const nextTop = window.scrollY + window.innerHeight * 0.85;
    window.scrollTo({ top: nextTop, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <div className="relative w-11 h-11 sm:w-12 sm:h-12">
        {/* Scroll Down Button (Visible when at top) */}
        <button
          type="button"
          onClick={() => scrollPage("down")}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full shadow-xl border border-white/10 transition-all duration-300 cursor-pointer",
            "bg-[#1e1c24] text-[#ffc000] hover:bg-[#282530] hover:scale-110",
            isAtTop
              ? "opacity-100 rotate-0 pointer-events-auto"
              : "opacity-0 -rotate-90 pointer-events-none",
          )}
          aria-label="向下滾動"
        >
          <ArrowDown className="h-5 w-5" />
        </button>

        {/* Back to Top Button (Visible when scrolled) */}
        <button
          type="button"
          onClick={() => scrollPage("up")}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full shadow-xl border border-white/10 transition-all duration-300 cursor-pointer",
            "bg-[#1e1c24] text-[#ffc000] hover:bg-[#282530] hover:scale-110",
            !isAtTop
              ? "opacity-100 rotate-0 pointer-events-auto"
              : "opacity-0 rotate-90 pointer-events-none",
          )}
          aria-label="回頂部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "color">("dark");

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("jepa-theme") as "dark" | "color" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "color" : "dark";
    setTheme(next);
    localStorage.setItem("jepa-theme", next);
    if (next === "color") {
      document.documentElement.setAttribute("data-theme", "color");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Passer au thème color" : "Passer au thème dark"}
      className="flex items-center gap-2.5 h-full px-5 border-l border-[var(--c-border,rgba(255,255,255,0.2))] text-[11px] uppercase tracking-widest transition-colors hover:bg-white/5"
      style={{ color: "inherit" }}
    >
      {/* Two color swatches */}
      <span className="flex items-center gap-1">
        <span
          className="w-3 h-3 rounded-full border border-white/20 transition-all duration-300"
          style={{
            backgroundColor: theme === "dark" ? "#111" : "#1925aa",
            boxShadow: theme === "dark" ? "0 0 0 1.5px rgba(255,255,255,0.5)" : "none",
          }}
        />
        <span
          className="w-3 h-3 rounded-full border border-white/20 transition-all duration-300"
          style={{
            backgroundColor: "#e8e6e0",
            boxShadow: theme === "color" ? "0 0 0 1.5px rgba(25,37,170,0.7)" : "none",
          }}
        />
      </span>
      <span className="hidden sm:block opacity-60">
        {theme === "dark" ? "Color" : "Dark"}
      </span>
    </button>
  );
}

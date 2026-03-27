"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themes = [
  { id: "light", icon: "☀️" },
  { id: "system", icon: "💻" },
  { id: "dark", icon: "🌙" },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
        {themes.map((t) => (
          <div key={t.id} className="px-2.5 py-1.5 text-sm">
            {t.icon}
          </div>
        ))}
      </div>
    );
  }

  const activeIndex = themes.findIndex((t) => t.id === theme);
  const widthPercent = 100 / themes.length;

  return (
    <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
      <motion.div
        className="absolute inset-y-0 rounded-md bg-[var(--color-bg-surface)]"
        initial={false}
        animate={{
          x: `${activeIndex * 100}%`,
          width: `${widthPercent}%`,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className="relative z-10 px-2.5 py-1.5 text-sm transition-colors"
          title={t.id}
        >
          <motion.span
            animate={{
              opacity: theme === t.id ? 1 : 0.5,
            }}
            transition={{ duration: 0.2 }}
          >
            {t.icon}
          </motion.span>
        </button>
      ))}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { startTransition } from "react";

const locales = [
  { id: "en" as const, label: "EN" },
  { id: "ko" as const, label: "한국어" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState(locale);

  const switchTo = (next: "en" | "ko") => {
    if (next !== selected) {
      setSelected(next);
      startTransition(() => {
        const qs = searchParams.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        router.replace(href, { locale: next });
      });
    }
  };

  const activeIndex = locales.findIndex((l) => l.id === selected);

  return (
    <div className="fixed right-4 top-4 z-50 flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Sliding indicator */}
      <motion.div
        className="absolute inset-y-0 rounded-md bg-[var(--color-bg-surface)]"
        initial={false}
        animate={{
          x: activeIndex === 0 ? 0 : "100%",
          width: "50%",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {locales.map((l) => (
        <button
          key={l.id}
          onClick={() => switchTo(l.id)}
          className="relative z-10 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <motion.span
            animate={{
              color:
                selected === l.id
                  ? "var(--color-primary)"
                  : "var(--color-text-dim)",
            }}
            transition={{ duration: 0.2 }}
          >
            {l.label}
          </motion.span>
        </button>
      ))}
    </div>
  );
}

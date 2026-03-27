"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: "en" | "ko") => {
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50 flex overflow-hidden rounded-lg border border-[var(--color-border)]">
      <button
        onClick={() => switchTo("en")}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
            : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchTo("ko")}
        className={`border-l border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "ko"
            ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
            : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
        }`}
      >
        한국어
      </button>
    </div>
  );
}

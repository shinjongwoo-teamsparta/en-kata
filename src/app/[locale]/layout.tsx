import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "~/i18n/routing";
import { LocaleSwitcher } from "./_components/LocaleSwitcher";
import { ThemeSwitcher } from "./_components/ThemeSwitcher";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
      {children}
    </NextIntlClientProvider>
  );
}

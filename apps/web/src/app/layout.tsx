import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "./_components/ThemeProvider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "en-kata | Typing Practice for Engineers",
  description:
    "Master your typing speed with software engineering vocabulary, short code snippets, and naming conventions.",
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "48x48" },
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/apple-icon.png" },
  ],
  manifest: "/site.webmanifest",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://en-kata.vercel.app",
  ),
  openGraph: {
    title: "en-kata | Typing Practice for Engineers",
    description:
      "Master your typing speed with software engineering vocabulary, short code snippets, and naming conventions.",
    siteName: "en-kata",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "en-kata | Typing Practice for Engineers",
    description:
      "Master your typing speed with software engineering vocabulary, short code snippets, and naming conventions.",
  },
  keywords: [
    "typing practice",
    "typing test",
    "programmer typing",
    "code typing",
    "engineering vocabulary",
    "타이핑 연습",
  ],
};

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        <SessionProvider>
          <ThemeProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

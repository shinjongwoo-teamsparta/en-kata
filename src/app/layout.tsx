import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "en-kata | Typing Practice for Engineers",
  description: "Master your typing speed with software engineering vocabulary, symbols, and naming conventions.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistMono.variable}`}>
      <body className="min-h-screen">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

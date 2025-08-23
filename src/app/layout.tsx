import { TempoInit } from "@/components/tempo-init";
import ErrorBoundary from "@/components/error-boundary";
import DevBanner from "@/components/dev-banner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CleanInbox - Email Cleanup Assistant",
  description:
    "Automatically identify, unsubscribe from, and delete unwanted emails with our intelligent email management assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <ErrorBoundary>
          <DevBanner />
          {children}
          <TempoInit />
        </ErrorBoundary>
      </body>
    </html>
  );
}

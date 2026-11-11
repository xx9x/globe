import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BackgroundMusic } from "@/components/audio/BackgroundMusic";

export const metadata: Metadata = {
  title: { default: "Globe — Your digital world. Secured.", template: "%s · Globe" },
  description:
    "Globe helps individuals and businesses strengthen their digital security with breach monitoring, website security assessments, and security alerts.",
  applicationName: "Globe",
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/mona-sans/MonaSans-Latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-svh bg-bg antialiased">
        {children}
        <BackgroundMusic />
      </body>
    </html>
  );
}

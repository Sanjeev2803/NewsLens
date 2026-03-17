import type { Metadata } from "next";
import { Inter, Rajdhani, JetBrains_Mono, Noto_Sans_JP, Geist } from "next/font/google";
import "./globals.css";
import TransitionWrapper from "@/components/layout/TransitionWrapper";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const rajdhani = Rajdhani({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "NewsLens — See Through the News",
  description:
    "AI-powered news analysis with real-time verification, sentiment tracking, and interactive visualizations.",
  keywords: ["news", "AI", "analysis", "verification", "trending"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${rajdhani.variable} ${jetbrainsMono.variable} ${notoSansJP.variable} font-body antialiased`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ErrorBoundary>
          <TransitionWrapper>{children}</TransitionWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}

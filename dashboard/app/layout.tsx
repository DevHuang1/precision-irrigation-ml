import type { Metadata } from "next";
import "./globals.css";
import ResearchSidebar from "@/components/ResearchSidebar";
import StickerToggle from "@/components/StickerToggle";

export const metadata: Metadata = {
  title: "Precision Irrigation Dashboard",
  description: "AI-powered precision irrigation monitoring dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased font-sans squircle">
      <body className="h-full bg-slate-50 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30 transition-bg duration-300">
        <ResearchSidebar />
        <main className="min-h-screen transition-all duration-300 pt-16 md:pt-0 md:pl-72">
          {children}
        </main>
        <StickerToggle />
      </body>
    </html>
  );
}

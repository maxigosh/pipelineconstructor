import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZenFlow — Meditation & Mindfulness",
  description:
    "A minimalist meditation app with guided timers, breathing exercises, and mindfulness tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navigation />
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:pt-24 sm:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}

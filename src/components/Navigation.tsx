"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Timer, Wind, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/meditate", label: "Meditate", icon: Timer },
  { href: "/breathe", label: "Breathe", icon: Wind },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-sand-100 bg-white/80 backdrop-blur-xl sm:top-0 sm:bottom-auto sm:border-b sm:border-t-0">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2 sm:justify-center sm:gap-8 sm:py-3">
        {/* Logo - desktop only */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-2 mr-8 text-zen-700 font-semibold"
        >
          <div className="h-7 w-7 rounded-full bg-zen-500 flex items-center justify-center">
            <Wind className="h-4 w-4 text-white" />
          </div>
          ZenFlow
        </Link>

        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-sm",
                isActive
                  ? "text-zen-700 bg-zen-50"
                  : "text-sand-400 hover:text-sand-600"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

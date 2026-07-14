"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  GraduationCap,
  User,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Error Book", icon: BookOpen, href: "/errors" },
  { label: "Learn & Practice", icon: GraduationCap, href: "/learn" },
];

const learnSubs = [
  { label: "📐 Math", href: "/learn/math" },
  { label: "🔬 Science", href: "/learn/science" },
  { label: "📝 English", href: "/learn/english" },
  { label: "🀄 Chinese", href: "/learn/chinese" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [learnOpen, setLearnOpen] = useState(true);

  if (pathname === "/login" || pathname === "/onboarding" || pathname.startsWith("/admin")) return null;

  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col bg-surface border-r border-border-strong shrink-0">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[22px] font-extrabold text-primary tracking-tight">
          PSLE Ready
        </h1>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {mainNav.map((item) => {
          const isLearn = item.href === "/learn";
          const isActive = isLearn
            ? pathname.startsWith("/learn")
            : pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
          const isHomeActive = item.href === "/" && pathname === "/";

          const active = isActive || isHomeActive;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={isLearn ? (e) => { e.preventDefault(); setLearnOpen(!learnOpen); } : undefined}
                className={`flex items-center gap-3 px-4 h-11 rounded-[14px] transition-colors ${
                  active
                    ? "bg-primary-light text-primary font-bold"
                    : "text-text-secondary hover:bg-border"
                }`}
              >
                <item.icon size={20} />
                <span className="text-sm">{item.label}</span>
                {isLearn && (
                  <ChevronDown
                    size={16}
                    className={`ml-auto transition-transform ${learnOpen ? "" : "-rotate-90"}`}
                  />
                )}
              </Link>

              {isLearn && learnOpen && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {learnSubs.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center h-11 px-4 rounded-xl text-xs transition-colors ${
                          subActive
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-text-muted hover:bg-border"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </nav>

      <div className="px-3 pb-5 border-t border-border pt-3">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 h-11 rounded-[14px] transition-colors ${
            pathname === "/profile"
              ? "bg-primary-light text-primary font-bold"
              : "text-text-muted hover:bg-border"
          }`}
        >
          <User size={20} />
          <span className="text-sm">Profile</span>
        </Link>
      </div>
    </aside>
  );
}

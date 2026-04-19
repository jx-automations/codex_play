"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Columns2, Users, BarChart2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/today",     label: "Today",     Icon: Home },
  { href: "/pipeline",  label: "Pipeline",  Icon: Columns2 },
  { href: "/prospects", label: "Prospects", Icon: Users },
  { href: "/analytics", label: "Analytics", Icon: BarChart2 },
] as const;

function NavLink({
  href,
  label,
  Icon,
  active,
  sidebar = false,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
  sidebar?: boolean;
}) {
  if (sidebar) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
          active
            ? "bg-primary-light text-primary"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
        active ? "text-primary" : "text-neutral-400 hover:text-neutral-600"
      }`}
      style={{ minHeight: 44 }}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Mobile bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-neutral-100 bg-white md:hidden"
        style={{ boxShadow: "0 -1px 8px rgba(0,0,0,0.06)" }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
        ))}
      </nav>

      {/* Desktop left sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-60 flex-col border-r border-neutral-100 bg-white md:flex">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
            OF
          </div>
          <span className="font-heading font-semibold text-neutral-900">OutreachFlow</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={isActive(href)} sidebar />
          ))}
        </nav>

        {/* Settings link */}
        <div className="border-t border-neutral-100 p-3">
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              pathname === "/settings"
                ? "bg-primary-light text-primary"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}

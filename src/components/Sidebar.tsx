"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", shortLabel: "Home" },
  { href: "/products", label: "Products", shortLabel: "Products" },
  { href: "/suppliers", label: "Suppliers", shortLabel: "Suppliers" },
  { href: "/impact", label: "Impact Analysis", shortLabel: "Impact" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-white lg:flex">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">SupplyTrace</p>
        <h1 className="mt-1 text-lg font-semibold">Chain Graph</h1>
        <p className="mt-1 text-sm text-slate-400">Traceability & risk intelligence</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const current = links.find((link) => link.href === pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">SupplyTrace</p>
      <h1 className="text-base font-semibold text-slate-900">{current?.label ?? "Chain Graph"}</h1>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-1 py-2 text-center text-[11px] font-medium leading-tight transition ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

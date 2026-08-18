import { MobileHeader, MobileNav, Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 lg:flex-row">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookmarkCheck, Compass, History, Zap } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Discover", icon: Compass, ocid: "nav.discover.link" },
  {
    path: "/saved",
    label: "Saved",
    icon: BookmarkCheck,
    ocid: "nav.saved.link",
  },
  {
    path: "/history",
    label: "History",
    icon: History,
    ocid: "nav.history.link",
  },
];

export default function Layout() {
  const isMobile = useIsMobile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col md:flex-row">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      {!isMobile && (
        <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
            <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center glow-cyan-sm">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-wide text-foreground">
              Crypto<span className="text-primary">Finder</span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon, ocid }) => {
              const isActive =
                path === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  data-ocid={ocid}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-sidebar-accent text-primary glow-cyan-sm border border-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-sidebar-border">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/70 hover:text-primary transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </aside>
      )}

      {/* ── Main Content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top header on mobile */}
        {isMobile && (
          <header className="flex items-center gap-2.5 px-4 py-3.5 bg-sidebar border-b border-sidebar-border">
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-wide text-foreground">
              Crypto<span className="text-primary">Finder</span>
            </span>
          </header>
        )}

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        {isMobile && (
          <nav className="flex bg-sidebar border-t border-sidebar-border">
            {NAV_ITEMS.map(({ path, label, icon: Icon, ocid }) => {
              const isActive =
                path === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  data-ocid={ocid}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  { label: "Dashboard", href: "/admin", icon: "âŒ‚" },
  { label: "Students", href: "/admin/students", icon: "â™™" },
  { label: "Teachers", href: "/admin/teachers", icon: "â™§" },
  { label: "Classes", href: "/admin/classes", icon: "â–¦" },
  { label: "Subjects", href: "/admin/subjects", icon: "â–¤" },
  { label: "Enrollment", href: "/admin/enrollments/new", icon: "ï¼‹" },
  { label: "Academic Sessions", href: "/admin/sessions", icon: "â–£" },
  { label: "Results", href: "/admin/results", icon: "â–§" },
  { label: "Result PINs", href: "/admin/result-pins", icon: "âŒ‘" },
  { label: "Assignments", href: "/admin/assignments", icon: "âœŽ" },
  { label: "Announcements", href: "/admin/announcements", icon: "â–±" },
];

/*
 * These pages already contain their own desktop sidebar.
 * The shared desktop sidebar is only shown on the other pages.
 */
const pagesWithExistingDesktopSidebar = [
  "/admin/students",
  "/admin/teachers",
  "/admin/subjects",
  "/admin/assignments",
  "/admin/enrollments/new",
  "/admin/results",
  "/admin/result-pins",
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {navigationItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={[
              "flex min-h-11 items-center gap-3 rounded-lg px-4 py-3",
              "text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[#C8A878]",
              active
                ? "bg-[#4A2C20] text-[#F7F1E7] shadow-sm"
                : "text-[#4A2C20] hover:bg-[#EFE3D0]",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center text-lg"
            >
              {item.icon}
            </span>

            <span>{item.label}</span>

            {active && (
              <span className="ml-auto h-2 w-2 rounded-full bg-[#C8A878]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showSharedDesktopSidebar = pathname !== "/admin" && !pagesWithExistingDesktopSidebar.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-[#C8A878] bg-[#F7F1E7] px-4 shadow-sm lg:hidden">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C8A878] bg-[#4A2C20] text-lg font-bold text-[#F7F1E7]">
            RFA
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-wide text-[#4A2C20]">
              RISING FOUNDATION
            </span>
            <span className="block text-xs font-medium text-[#7A5038]">
              ACADEMY Â· ADMIN
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={
            mobileMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-admin-navigation"
          className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#C8A878] text-2xl text-[#4A2C20] hover:bg-[#EFE3D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A878]"
        >
          {mobileMenuOpen ? "Ã—" : "â˜°"}
        </button>
      </header>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Mobile navigation drawer */}
      <aside
        id="mobile-admin-navigation"
        aria-label="Admin menu"
        aria-hidden={!mobileMenuOpen}
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col",
          "border-r border-[#C8A878] bg-[#F7F1E7] shadow-xl",
          "transition-transform duration-200 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-[#C8A878] px-5 py-4">
          <div>
            <p className="text-sm font-bold tracking-wide text-[#4A2C20]">
              RISING FOUNDATION
            </p>
            <p className="mt-1 text-xs text-[#7A5038]">
              ACADEMY Â· ADMIN PANEL
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            tabIndex={mobileMenuOpen ? 0 : -1}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-[#4A2C20] hover:bg-[#EFE3D0]"
          >
            Ã—
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-widest text-[#7A5038]">
            Main Menu
          </p>

          <NavigationLinks
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>

        <div className="border-t border-[#C8A878] px-5 py-4">
          <p className="text-xs text-[#7A5038]">
            Rising Foundation Academy
          </p>
        </div>
      </aside>

      {/* Shared desktop sidebar for pages that do not have one */}
      {showSharedDesktopSidebar && (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#C8A878] bg-[#F7F1E7] lg:flex">
          <Link
            href="/admin"
            className="flex min-h-24 items-center gap-3 border-b border-[#C8A878] px-5 py-5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C8A878] bg-[#4A2C20] text-lg font-bold text-[#F7F1E7]">
              RFA
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-bold leading-5 text-[#4A2C20]">
                RISING FOUNDATION
              </span>
              <span className="block text-sm font-semibold text-[#7A5038]">
                ACADEMY
              </span>
              <span className="mt-1 block text-xs text-[#7A5038]">
                Administration
              </span>
            </span>
          </Link>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-widest text-[#7A5038]">
              Main Menu
            </p>

            <NavigationLinks />
          </div>

          <div className="border-t border-[#C8A878] px-5 py-4">
            <p className="text-xs text-[#7A5038]">
              Rising Foundation Academy
            </p>
          </div>
        </aside>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigationItems = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Students", href: "/admin/students", icon: "students" },
  { label: "Teachers", href: "/admin/teachers", icon: "teachers" },
  { label: "Classes", href: "/admin/classes", icon: "classes" },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects" },
  { label: "Enrollment", href: "/admin/enrollments/new", icon: "enrollment" },
  { label: "Academic Sessions", href: "/admin/sessions", icon: "sessions" },
  { label: "Results", href: "/admin/results", icon: "results" },
  { label: "Result PINs", href: "/admin/result-pins", icon: "pin" },
  { label: "Assignments", href: "/admin/assignments", icon: "assignments" },
  { label: "Announcements", href: "/admin/announcements", icon: "announcements" },
] as const;

type IconName = (typeof navigationItems)[number]["icon"];

const pagesWithExistingDesktopSidebar = [
  "/admin",
  "/admin/students",
  "/admin/teachers",
  "/admin/subjects",
  "/admin/assignments",
  "/admin/enrollments/new",
  "/admin/results",
  "/admin/result-pins",
];

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "students":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "teachers":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 6h8M8 10h8M8 14h5" />
        </svg>
      );

    case "classes":
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-5h6v5M9 10h.01M15 10h.01" />
        </svg>
      );

    case "subjects":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 6h8M8 10h8M8 14h5" />
        </svg>
      );

    case "enrollment":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M16 11h6" />
        </svg>
      );

    case "sessions":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
        </svg>
      );

    case "results":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M12 17v5M5 3h14M7 3v6l-2 4h14l-2-4V3M8 13h8" />
        </svg>
      );

    case "assignments":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );

    case "announcements":
      return (
        <svg {...common}>
          <path d="M3 11h4l9-5v12l-9-5H3v-2Z" />
          <path d="M7 13v5M19 9.5a4 4 0 0 1 0 5M21 7a7 7 0 0 1 0 10" />
        </svg>
      );
  }
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
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
              active
                ? "bg-[#4A2C20] text-[#F7F1E7] shadow-sm"
                : "text-[#4A2C20] hover:bg-[#EFE3D0]"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <Icon name={item.icon} />
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

  const showSharedDesktopSidebar = !pagesWithExistingDesktopSidebar.some(
    (path) =>
      pathname === path || pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Mobile header: menu button on the LEFT */}
      <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-[#C8A878] bg-[#F7F1E7] px-4 shadow-sm lg:hidden">

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={
            mobileMenuOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-admin-navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#C8A878] text-[#4A2C20] hover:bg-[#EFE3D0]"
        >
          {mobileMenuOpen ? (
            <svg {...{
              width: 24,
              height: 24,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              strokeLinecap: "round" as const,
            }}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg {...{
              width: 24,
              height: 24,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              strokeLinecap: "round" as const,
            }}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C8A878] bg-[#4A2C20] text-sm font-bold text-[#F7F1E7]">
            RFA
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#4A2C20]">
              RISING FOUNDATION
            </span>
            <span className="block text-xs font-medium text-[#7A5038]">
              ACADEMY · ADMIN
            </span>
          </span>
        </Link>
      </header>

      {/* Backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        id="mobile-admin-navigation"
        aria-label="Admin menu"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col border-r border-[#C8A878] bg-[#F7F1E7] shadow-xl transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-[#C8A878] px-5 py-4">
          <div>
            <p className="text-sm font-bold text-[#4A2C20]">
              RISING FOUNDATION
            </p>
            <p className="mt-1 text-xs text-[#7A5038]">
              ACADEMY · ADMIN PANEL
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            tabIndex={mobileMenuOpen ? 0 : -1}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#4A2C20] hover:bg-[#EFE3D0]"
          >
            <svg {...{
              width: 22,
              height: 22,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              strokeLinecap: "round" as const,
            }}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
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

      {/* Desktop sidebar */}
      {showSharedDesktopSidebar && (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#C8A878] bg-[#F7F1E7] lg:flex">
          <Link
            href="/admin"
            className="flex min-h-24 items-center gap-3 border-b border-[#C8A878] px-5 py-5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C8A878] bg-[#4A2C20] text-sm font-bold text-[#F7F1E7]">
              RFA
            </span>

            <span>
              <span className="block text-sm font-bold text-[#4A2C20]">
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
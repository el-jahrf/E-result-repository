import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

function Icon({
  name,
}: {
  name:
    | "dashboard"
    | "students"
    | "teachers"
    | "classes"
    | "subjects"
    | "enrollment"
    | "sessions"
    | "results"
    | "pin"
    | "assignments"
    | "announcements";
}) {
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

  if (name === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "students") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "teachers") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 6h8" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    );
  }

  if (name === "classes") {
    return (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-5h6v5" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    );
  }

  if (name === "subjects") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 6h8" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    );
  }

  if (name === "enrollment") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    );
  }

  if (name === "sessions") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <path d="M8 13h.01" />
        <path d="M12 13h.01" />
        <path d="M16 13h.01" />
        <path d="M8 17h.01" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === "results") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...common}>
        <path d="M12 17v5" />
        <path d="M5 3h14" />
        <path d="M7 3v6l-2 4h14l-2-4V3" />
        <path d="M8 13h8" />
      </svg>
    );
  }

  if (name === "assignments") {
    return (
      <svg {...common}>
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3 11h4l9-5v12l-9-5H3v-2Z" />
      <path d="M7 13v5" />
      <path d="M19 9.5a4 4 0 0 1 0 5" />
      <path d="M21 7a7 7 0 0 1 0 10" />
    </svg>
  );
}

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "dashboard" as const,
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: "students" as const,
  },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: "teachers" as const,
  },
  {
    label: "Classes",
    href: "/admin/classes",
    icon: "classes" as const,
  },
  {
    label: "Subjects",
    href: "/admin/subjects",
    icon: "subjects" as const,
  },
  {
    label: "Enrollment",
    href: "/admin/enrollments/new",
    icon: "enrollment" as const,
  },
  {
    label: "Academic Sessions",
    href: "/admin/sessions",
    icon: "sessions" as const,
  },
  {
    label: "Results",
    href: "/admin/results",
    icon: "results" as const,
  },
  {
    label: "Result PINs",
    href: "/admin/result-pins",
    icon: "pin" as const,
  },
  {
    label: "Assignments",
    href: "/admin/assignments",
    icon: "assignments" as const,
  },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: "announcements" as const,
  },
];

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const currentSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeTerm = currentSession?.currentTerm ?? null;

  const termLabel =
    activeTerm === "FIRST"
      ? "First Term"
      : activeTerm === "SECOND"
        ? "Second Term"
        : activeTerm === "THIRD"
          ? "Third Term"
          : "No active term";

  return (
    <main className="min-h-screen bg-school">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-school bg-surface lg:flex lg:flex-col">
          <div className="flex h-[76px] items-center border-b border-school px-6">
            <div>
              <p className="text-[15px] font-bold tracking-tight text-primary">
                RISING FOUNDATION
              </p>

              <p className="mt-0.5 text-[11px] font-medium tracking-[0.18em] text-muted">
                ACADEMY
              </p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Main Menu
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const active = item.href === "/admin";

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-secondary hover:bg-school hover:text-primary"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-secondary group-hover:text-primary"
                      }`}
                    >
                      <Icon name={item.icon} />
                    </span>

                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-school p-4">
            <div className="flex items-center gap-3 rounded-lg bg-school px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">
                  Administrator
                </p>

                <p className="text-xs text-muted">System Admin</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-school bg-surface">
            <div className="flex min-h-[76px] items-center justify-between px-6 py-4 lg:px-8">
              <div>
                <p className="mb-1 text-xs font-medium text-muted">
                  Administration
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-primary">
                  Admin Dashboard
                </h1>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {currentSession?.name ?? "No active session"}
                </p>

                <p className="mt-0.5 text-xs text-muted">{termLabel}</p>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-primary">
                Welcome back, Administrator
              </h2>

              <p className="mt-1 text-sm text-muted">
                Manage students, teachers, classes, results and school
                operations from here.
              </p>
            </div>

            <section className="school-card rounded-2xl">
              <div className="border-b border-school px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-school text-primary">
                    <Icon name="dashboard" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-primary">
                      Current Academic Session
                    </h2>

                    <p className="mt-0.5 text-sm text-muted">
                      Current academic period for school operations
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 sm:grid-cols-2">
                <div className="border-b border-school px-6 py-5 sm:border-b-0 sm:border-r">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    Academic Session
                  </p>

                  <p className="mt-2 text-lg font-bold text-primary">
                    {currentSession?.name ?? "No active session"}
                  </p>
                </div>

                <div className="px-6 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    Active Term
                  </p>

                  <p className="mt-2 text-lg font-bold text-primary">
                    {termLabel}
                  </p>
                </div>
              </div>
            </section>

            <section className="school-card mt-6 rounded-2xl">
              <div className="border-b border-school px-6 py-5">
                <h2 className="text-base font-bold text-primary">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Frequently used administrative actions
                </p>
              </div>

              <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  href="/admin/students/new"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="students" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Add Student
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Register a new student
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/teachers/new"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="teachers" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Add Teacher
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Create a teacher profile
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/enrollments/new"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="enrollment" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Enrollment
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Manage student enrollment
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/sessions"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="sessions" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Academic Sessions
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Manage sessions and active term
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/results"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="results" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Results
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Review and publish results
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/result-pins"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="pin" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Result PINs
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Generate student result PINs
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/assignments"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="assignments" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Assignments
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Manage teacher assignments
                    </span>
                  </span>
                </a>

                <a
                  href="/admin/announcements"
                  className="group flex items-center gap-4 rounded-xl border border-school bg-surface p-4 transition hover:bg-school"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-school text-primary group-hover:bg-accent">
                    <Icon name="announcements" />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-primary">
                      Announcements
                    </span>

                    <span className="mt-0.5 block text-xs text-muted">
                      Publish school announcements
                    </span>
                  </span>
                </a>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
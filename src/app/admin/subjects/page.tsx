import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type IconName =
  | "dashboard"
  | "students"
  | "teachers"
  | "classes"
  | "subjects"
  | "enrollment"
  | "results"
  | "pin"
  | "assignments";

const sectionLabels: Record<string, string> = {
  NURSERY: "Nursery",
  PRIMARY: "Primary",
  JSS: "JSS",
  SS: "Senior Secondary",
};

const sectionOrder = ["NURSERY", "PRIMARY", "JSS", "SS"];

const navigation: {
  label: string;
  href: string;
  icon: IconName;
}[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Students", href: "/admin/students", icon: "students" },
  { label: "Teachers", href: "/admin/teachers", icon: "teachers" },
  { label: "Classes", href: "/admin/classes", icon: "classes" },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects" },
  { label: "Enrollment", href: "/admin/enrollments/new", icon: "enrollment" },
  { label: "Results", href: "/admin/results", icon: "results" },
  { label: "Result PINs", href: "/admin/result-pins", icon: "pin" },
  { label: "Assignments", href: "/admin/assignments", icon: "assignments" },
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
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
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
          <path d="M16 11h5" />
          <path d="M18.5 8.5v5" />
        </svg>
      );

    case "classes":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V5l7-3 7 3v16" />
          <path d="M9 9h1" />
          <path d="M14 9h1" />
          <path d="M9 13h1" />
          <path d="M14 13h1" />
          <path d="M10 21v-4h4v4" />
        </svg>
      );

    case "subjects":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 6h8" />
          <path d="M8 10h8" />
        </svg>
      );

    case "enrollment":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </svg>
      );

    case "results":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 3-4 3 2 5-6" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M12 17v5" />
          <path d="M8 3h8l-1 5 3 4H6l3-4-1-5Z" />
        </svg>
      );

    case "assignments":
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    default:
      return null;
  }
}

async function addSubject(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "CORE");
  const sectionValue = String(formData.get("section") ?? "").trim();

  if (!name || !code) {
    throw new Error("Subject name and subject code are required.");
  }

  if (type !== "CORE" && type !== "ELECTIVE") {
    throw new Error("Invalid subject type.");
  }

  const validSections = ["NURSERY", "PRIMARY", "JSS", "SS"];

  const section =
    sectionValue && validSections.includes(sectionValue)
      ? (sectionValue as "NURSERY" | "PRIMARY" | "JSS" | "SS")
      : null;

  const existing = await prisma.subject.findFirst({
    where: {
      OR: [{ code }, { name }],
    },
  });

  if (existing) {
    throw new Error("A subject with this name or code already exists.");
  }

  await prisma.subject.create({
    data: {
      name,
      code,
      type: type as "CORE" | "ELECTIVE",
      section,
    },
  });
}

async function allocateSubject(formData: FormData) {
  "use server";

  const classId = String(formData.get("classId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");

  if (!classId || !subjectId) {
    throw new Error("Class and subject are required.");
  }

  const schoolClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!schoolClass || !subject) {
    throw new Error("Class or subject not found.");
  }

  if (!schoolClass.isActive || !subject.isActive) {
    throw new Error("The selected class or subject is inactive.");
  }

  const existing = await prisma.classSubject.findUnique({
    where: {
      classId_subjectId: {
        classId,
        subjectId,
      },
    },
  });

  if (existing) {
    redirect(`/admin/subjects?classId=${encodeURIComponent(classId)}`);
  }

  await prisma.classSubject.create({
    data: {
      classId,
      subjectId,
    },
  });

  redirect(`/admin/subjects?classId=${encodeURIComponent(classId)}`);
}

async function removeSubject(formData: FormData) {
  "use server";

  const classSubjectId = String(
    formData.get("classSubjectId") ?? "",
  );

  if (!classSubjectId) {
    throw new Error("Class subject ID is required.");
  }

  const classSubject = await prisma.classSubject.findUnique({
    where: {
      id: classSubjectId,
    },
    select: {
      id: true,
      classId: true,
    },
  });

  if (!classSubject) {
    redirect("/admin/subjects");
  }

  await prisma.classSubject.delete({
    where: {
      id: classSubject.id,
    },
  });

  redirect(
    `/admin/subjects?classId=${encodeURIComponent(
      classSubject.classId,
    )}`,
  );
}

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const params = await searchParams;
  const selectedClassId = params.classId ?? "";

  const classes = await prisma.class.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { section: "asc" },
      { level: "asc" },
      { name: "asc" },
      { arm: "asc" },
    ],
    include: {
      classSubjects: {
        include: {
          subject: true,
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      },
    },
  });

  const subjects = await prisma.subject.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const selectedClass =
    classes.find(
      (schoolClass) => schoolClass.id === selectedClassId,
    ) ?? null;

  const selectedSubjectIds = new Set(
    selectedClass?.classSubjects.map(
      (item) => item.subjectId,
    ) ?? [],
  );

  const availableSubjects = subjects.filter(
    (subject) => !selectedSubjectIds.has(subject.id),
  );

  const classesBySection = sectionOrder.map((section) => ({
    section,
    classes: classes.filter(
      (schoolClass) => schoolClass.section === section,
    ),
  }));

  return (
    <div className="min-h-screen bg-school text-school">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-school bg-surface lg:flex lg:flex-col">
          <div className="border-b border-school px-6 py-6">
            <div className="text-lg font-bold tracking-tight text-primary">
              RISING FOUNDATION
            </div>
            <div className="mt-0.5 text-xs font-semibold tracking-[0.25em] text-muted">
              ACADEMY
            </div>
          </div>

          <div className="px-4 py-5">
            <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const active = item.label === "Subjects";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-secondary hover:bg-school hover:text-primary"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className="h-[18px] w-[18px]"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-school p-4">
            <div className="flex items-center gap-3 rounded-lg bg-school px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">
                  Administrator
                </p>
                <p className="truncate text-xs text-muted">
                  System Admin
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-school bg-surface">
            <div className="px-6 py-6 lg:px-8">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                Administration
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Subjects
              </h1>

              <p className="mt-1 text-sm text-muted">
                Manage the subject library and allocate subjects to school
                classes.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            {!selectedClass ? (
              <>
                <section className="rounded-xl border border-school bg-surface shadow-sm">
                  <div className="border-b border-school px-6 py-5">
                    <h2 className="text-lg font-semibold text-primary">
                      School Classes
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      Choose a class to view and manage its subjects.
                    </p>
                  </div>

                  <div className="space-y-8 p-6">
                    {classesBySection.map(
                      ({ section, classes: sectionClasses }) => {
                        if (sectionClasses.length === 0) {
                          return null;
                        }

                        return (
                          <div key={section}>
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                              {sectionLabels[section]}
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {sectionClasses.map((schoolClass) => (
                                <Link
                                  key={schoolClass.id}
                                  href={`/admin/subjects?classId=${schoolClass.id}`}
                                  className="group rounded-lg border border-school bg-surface p-5 transition hover:border-primary hover:shadow-md"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-primary">
                                        {schoolClass.name}
                                      </h4>

                                      <p className="mt-1 text-sm text-muted">
                                        {schoolClass.classSubjects.length}{" "}
                                        {schoolClass.classSubjects.length ===
                                        1
                                          ? "subject"
                                          : "subjects"}
                                      </p>
                                    </div>

                                    <span className="text-muted transition group-hover:translate-x-1 group-hover:text-primary">
                                      →
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-school bg-surface shadow-sm">
                  <div className="border-b border-school px-6 py-5">
                    <h2 className="text-lg font-semibold text-primary">
                      Subject Library
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      These are the subjects available to be assigned to
                      classes.
                    </p>
                  </div>

                  <div className="p-6">
                    <form
                      action={addSubject}
                      className="grid gap-4 md:grid-cols-4"
                    >
                      {[
                        ["name", "Subject Name", "e.g. Mathematics"],
                        ["code", "Subject Code", "e.g. MTH"],
                      ].map(([id, label, placeholder]) => (
                        <div key={id}>
                          <label
                            htmlFor={id}
                            className="mb-2 block text-sm font-medium text-secondary"
                          >
                            {label}
                          </label>

                          <input
                            id={id}
                            name={id}
                            type="text"
                            placeholder={placeholder}
                            required
                            className="school-input rounded-lg px-4 py-3 text-sm"
                          />
                        </div>
                      ))}

                      <div>
                        <label
                          htmlFor="type"
                          className="mb-2 block text-sm font-medium text-secondary"
                        >
                          Type
                        </label>

                        <select
                          id="type"
                          name="type"
                          defaultValue="CORE"
                          className="school-input rounded-lg bg-surface px-4 py-3 text-sm"
                        >
                          <option value="CORE">Core</option>
                          <option value="ELECTIVE">Elective</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="section"
                          className="mb-2 block text-sm font-medium text-secondary"
                        >
                          Section
                        </label>

                        <select
                          id="section"
                          name="section"
                          defaultValue=""
                          className="school-input rounded-lg bg-surface px-4 py-3 text-sm"
                        >
                          <option value="">All / Not specified</option>
                          <option value="NURSERY">Nursery</option>
                          <option value="PRIMARY">Primary</option>
                          <option value="JSS">JSS</option>
                          <option value="SS">Senior Secondary</option>
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <button
                          type="submit"
                          className="school-button rounded-lg px-6 py-3 text-sm font-semibold"
                        >
                          + Add Subject to Library
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <Link
                    href="/admin/subjects"
                    className="inline-flex items-center text-sm font-medium text-secondary hover:text-primary"
                  >
                    ← Back to Classes
                  </Link>
                </div>

                <section className="rounded-xl border border-school bg-surface shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-school px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {sectionLabels[selectedClass.section]}
                      </div>

                      <h2 className="mt-1 text-xl font-semibold text-primary">
                        {selectedClass.name} Subjects
                      </h2>

                      <p className="mt-1 text-sm text-muted">
                        Add or remove the subjects taught in this class.
                      </p>
                    </div>

                    <div className="rounded-full bg-school px-4 py-2 text-sm font-medium text-secondary">
                      {selectedClass.classSubjects.length}{" "}
                      {selectedClass.classSubjects.length === 1
                        ? "Subject"
                        : "Subjects"}
                    </div>
                  </div>

                  <div className="p-6">
                    {selectedClass.classSubjects.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-school bg-school px-6 py-12 text-center">
                        <h3 className="text-base font-semibold text-primary">
                          No subjects assigned yet
                        </h3>

                        <p className="mt-1 text-sm text-muted">
                          Use the Add Subject button below to assign subjects
                          to {selectedClass.name}.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedClass.classSubjects.map((classSubject) => (
                          <div
                            key={classSubject.id}
                            className="flex items-center justify-between rounded-lg border border-school bg-surface px-4 py-4"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-primary">
                                {classSubject.subject.name}
                              </p>

                              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
                                {classSubject.subject.code}
                                {" · "}
                                {classSubject.subject.type === "CORE"
                                  ? "Core"
                                  : "Elective"}
                              </p>
                            </div>

                            <form action={removeSubject}>
                              <input
                                type="hidden"
                                name="classSubjectId"
                                value={classSubject.id}
                              />

                              <button
                                type="submit"
                                title={`Remove ${classSubject.subject.name} from ${selectedClass.name}`}
                                aria-label={`Remove ${classSubject.subject.name} from ${selectedClass.name}`}
                                className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl font-medium leading-none text-muted transition hover:bg-school hover:text-danger"
                              >
                                ×
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-school bg-surface shadow-sm">
                  <div className="border-b border-school px-6 py-5">
                    <h2 className="text-lg font-semibold text-primary">
                      Add Subject
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      Select a subject from the existing Subject Library.
                    </p>
                  </div>

                  <div className="p-6">
                    {availableSubjects.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-school bg-school px-6 py-10 text-center">
                        <p className="text-sm font-medium text-secondary">
                          No more subjects are available to add.
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          All active subjects are already assigned to this
                          class.
                        </p>
                      </div>
                    ) : (
                      <form
                        action={allocateSubject}
                        className="flex flex-col gap-4 sm:flex-row sm:items-end"
                      >
                        <input
                          type="hidden"
                          name="classId"
                          value={selectedClass.id}
                        />

                        <div className="flex-1">
                          <label
                            htmlFor="subjectId"
                            className="mb-2 block text-sm font-medium text-secondary"
                          >
                            Subject
                          </label>

                          <select
                            id="subjectId"
                            name="subjectId"
                            required
                            defaultValue=""
                            className="school-input rounded-lg bg-surface px-4 py-3 text-sm"
                          >
                            <option value="" disabled>
                              Select a subject
                            </option>

                            {availableSubjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="school-button rounded-lg px-6 py-3 text-sm font-semibold"
                        >
                          + Add Subject
                        </button>
                      </form>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
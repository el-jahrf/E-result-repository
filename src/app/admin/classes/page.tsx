import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALL_OFFICIAL_SUBJECT_GROUPS,
  STANDARD_CLASSES,
} from "@/lib/school-structure";
import { redirect } from "next/navigation";

async function initializeSchoolStructure() {
  "use server";

  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  await prisma.$transaction(async (tx) => {
    for (const group of ALL_OFFICIAL_SUBJECT_GROUPS) {
      for (const subject of group.subjects) {
        await tx.subject.upsert({
          where: { code: subject.code },
          update: {
            name: subject.name,
            type: subject.type,
            section: group.section,
            isActive: true,
          },
          create: {
            code: subject.code,
            name: subject.name,
            type: subject.type,
            section: group.section,
            isActive: true,
          },
        });
      }
    }

    for (const classDefinition of STANDARD_CLASSES) {
      let schoolClass = await tx.class.findFirst({
        where: {
          name: classDefinition.name,
          arm: classDefinition.arm ?? null,
        },
      });

      if (!schoolClass) {
        schoolClass = await tx.class.create({
          data: {
            name: classDefinition.name,
            level: classDefinition.level,
            section: classDefinition.section,
            arm: classDefinition.arm ?? null,
            stream: classDefinition.stream ?? null,
            isActive: true,
          },
        });
      } else {
        schoolClass = await tx.class.update({
          where: { id: schoolClass.id },
          data: {
            level: classDefinition.level,
            section: classDefinition.section,
            arm: classDefinition.arm ?? null,
            stream: classDefinition.stream ?? null,
            isActive: true,
          },
        });
      }

      const subjectGroup =
        classDefinition.section === "NURSERY" ||
        classDefinition.section === "PRIMARY"
          ? ALL_OFFICIAL_SUBJECT_GROUPS.find(
              (group) => group.key === "LOWER",
            )
          : classDefinition.section === "JSS"
            ? ALL_OFFICIAL_SUBJECT_GROUPS.find(
                (group) => group.key === "JSS",
              )
            : ALL_OFFICIAL_SUBJECT_GROUPS.find(
                (group) => group.key === "SS",
              );

      if (!subjectGroup) {
        continue;
      }

      for (const subjectDefinition of subjectGroup.subjects) {
        const subject = await tx.subject.findUnique({
          where: { code: subjectDefinition.code },
        });

        if (!subject) {
          continue;
        }

        const existingAllocation = await tx.classSubject.findFirst({
          where: {
            classId: schoolClass.id,
            subjectId: subject.id,
          },
        });

        if (!existingAllocation) {
          await tx.classSubject.create({
            data: {
              classId: schoolClass.id,
              subjectId: subject.id,
            },
          });
        }
      }
    }
  });

  redirect("/admin/classes?initialized=1");
}

async function createClass(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const arm = String(formData.get("arm") ?? "").trim();
  const stream = String(formData.get("stream") ?? "").trim();
  const section = String(formData.get("section") ?? "").trim();

  if (!name || !level || !section) {
    redirect("/admin/classes?error=missing");
  }

  const validSections = ["NURSERY", "PRIMARY", "JSS", "SS"];

  if (!validSections.includes(section)) {
    redirect("/admin/classes?error=section");
  }

  const existing = await prisma.class.findFirst({
    where: {
      name,
      arm: arm || null,
    },
  });

  if (existing) {
    redirect("/admin/classes?error=exists");
  }

  await prisma.class.create({
    data: {
      name,
      level,
      arm: arm || null,
      stream: stream || null,
      section: section as "NURSERY" | "PRIMARY" | "JSS" | "SS",
      isActive: true,
    },
  });

  redirect("/admin/classes?created=1");
}

async function toggleClass(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/classes");
  }

  const schoolClass = await prisma.class.findUnique({
    where: { id },
  });

  if (!schoolClass) {
    redirect("/admin/classes?error=notfound");
  }

  await prisma.class.update({
    where: { id },
    data: {
      isActive: !schoolClass.isActive,
    },
  });

  redirect("/admin/classes");
}

function sectionLabel(section: string) {
  switch (section) {
    case "NURSERY":
      return "Nursery";
    case "PRIMARY":
      return "Primary";
    case "JSS":
      return "Junior Secondary";
    case "SS":
      return "Senior Secondary";
    default:
      return section;
  }
}

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{
    initialized?: string;
    created?: string;
    error?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;

  const classes = await prisma.class.findMany({
    orderBy: [
      { section: "asc" },
      { level: "asc" },
      { name: "asc" },
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
      _count: {
        select: {
          enrollments: true,
          assignments: true,
          classMasterAssignments: true,
        },
      },
    },
  });

  const activeClasses = classes.filter((item) => item.isActive);
  const inactiveClasses = classes.filter((item) => !item.isActive);

  const lowerCount =
    ALL_OFFICIAL_SUBJECT_GROUPS.find((group) => group.key === "LOWER")
      ?.subjects.length ?? 0;

  const jssCount =
    ALL_OFFICIAL_SUBJECT_GROUPS.find((group) => group.key === "JSS")
      ?.subjects.length ?? 0;

  const ssCount =
    ALL_OFFICIAL_SUBJECT_GROUPS.find((group) => group.key === "SS")
      ?.subjects.length ?? 0;

  const totalOfficialSubjects =
    lowerCount + jssCount + ssCount;

  return (
    <main className="min-h-screen bg-school text-school">
      <div className="border-b border-school bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-secondary">
                RISING FOUNDATION ACADEMY
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
                Classes
              </h1>

              <p className="mt-1 text-sm text-muted">
                Manage school classes and their subject structure.
              </p>
            </div>

            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-md border border-school bg-surface px-4 py-2 text-sm font-medium text-secondary shadow-sm transition hover:bg-school"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {params.initialized === "1" && (
          <div className="rounded-lg border border-success bg-school px-4 py-3 text-sm text-success">
            School structure initialized successfully. Existing records were
            preserved and missing classes/subjects/allocations were created.
          </div>
        )}

        {params.created === "1" && (
          <div className="rounded-lg border border-success bg-school px-4 py-3 text-sm text-success">
            Class created successfully.
          </div>
        )}

        {params.error && (
          <div className="rounded-lg border border-danger bg-school px-4 py-3 text-sm text-danger">
            {params.error === "exists"
              ? "A class with the same name and arm already exists."
              : params.error === "missing"
                ? "Please provide the class name, level and section."
                : "The requested class operation could not be completed."}
          </div>
        )}

        <section className="rounded-xl border border-school bg-surface shadow-sm">
          <div className="border-b border-school px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  School Structure
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                  Initialize the academy&apos;s standard classes and official
                  subject groups automatically. The setup is safe to run again
                  and does not create duplicates.
                </p>
              </div>

              <form action={initializeSchoolStructure}>
                <button
                  type="submit"
                  className="school-button inline-flex w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold shadow-sm lg:w-auto"
                >
                  Initialize School Structure
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            {[
              [
                "Nursery / Primary",
                lowerCount,
                "Shared subjects · Pre-Nursery to Primary 5",
              ],
              [
                "Junior Secondary",
                jssCount,
                "Shared subjects · JSS 1 to JSS 3",
              ],
              [
                "Senior Secondary",
                ssCount,
                "Shared subject group · SS 1 to SS 3",
              ],
            ].map(([title, count, description]) => (
              <div
                key={title}
                className="rounded-lg border border-school bg-school p-5"
              >
                <p className="text-sm font-medium text-muted">{title}</p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {count}
                </p>
                <p className="mt-1 text-xs text-muted">{description}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-school px-6 py-4">
            <p className="text-xs text-muted">
              Official subject library:{" "}
              <span className="font-semibold text-secondary">
                {totalOfficialSubjects} subjects
              </span>
              . Primary 6 is intentionally excluded from the standard school
              structure.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-school bg-surface shadow-sm">
          <div className="border-b border-school px-6 py-5">
            <h2 className="text-lg font-semibold text-primary">
              Add Class Manually
            </h2>

            <p className="mt-1 text-sm text-muted">
              Use this only when you need a class outside the standard school
              structure.
            </p>
          </div>

          <form
            action={createClass}
            className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-5"
          >
            {[
              ["name", "Class Name", "e.g. Primary 1"],
              ["level", "Level", "e.g. Primary 1"],
              ["arm", "Arm", "Optional"],
              ["stream", "Stream", "Optional"],
            ].map(([name, label, placeholder]) => (
              <div key={name}>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  {label}
                </label>

                <input
                  name={name}
                  required={name !== "arm" && name !== "stream"}
                  placeholder={placeholder}
                  className="school-input rounded-md px-3 py-2.5 text-sm"
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary">
                Section
              </label>

              <select
                name="section"
                required
                defaultValue=""
                className="school-input rounded-md bg-surface px-3 py-2.5 text-sm"
              >
                <option value="" disabled>
                  Select section
                </option>
                <option value="NURSERY">Nursery</option>
                <option value="PRIMARY">Primary</option>
                <option value="JSS">JSS</option>
                <option value="SS">Senior Secondary</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-5">
              <button
                type="submit"
                className="school-button rounded-md px-5 py-2.5 text-sm font-semibold"
              >
                Create Class
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-school bg-surface shadow-sm">
          <div className="border-b border-school px-6 py-5">
            <h2 className="text-lg font-semibold text-primary">
              Active Classes
            </h2>
            <p className="mt-1 text-sm text-muted">
              {activeClasses.length} active class
              {activeClasses.length === 1 ? "" : "es"}.
            </p>
          </div>

          {activeClasses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-secondary">
                No active classes found.
              </p>
              <p className="mt-1 text-sm text-muted">
                Use Initialize School Structure to create the academy classes.
              </p>
            </div>
          ) : (
            <div>
              {activeClasses.map((schoolClass) => (
                <div
                  key={schoolClass.id}
                  className="border-b border-school px-6 py-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-primary">
                          {schoolClass.name}
                        </h3>

                        <span className="rounded-full bg-school px-2.5 py-1 text-xs font-medium text-secondary">
                          {sectionLabel(schoolClass.section)}
                        </span>

                        {schoolClass.stream && (
                          <span className="rounded-full bg-school px-2.5 py-1 text-xs font-medium text-secondary">
                            {schoolClass.stream}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-muted">
                        {schoolClass.level}
                        {schoolClass.arm
                          ? ` · Arm ${schoolClass.arm}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-md border border-school px-2.5 py-1.5">
                        {schoolClass.classSubjects.length} subjects
                      </span>
                      <span className="rounded-md border border-school px-2.5 py-1.5">
                        {schoolClass._count.enrollments} students
                      </span>
                      <span className="rounded-md border border-school px-2.5 py-1.5">
                        {schoolClass._count.assignments} assignments
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {schoolClass.classSubjects.map((allocation) => (
                      <span
                        key={allocation.id}
                        className="rounded-md border border-school bg-school px-2.5 py-1.5 text-xs text-secondary"
                      >
                        {allocation.subject.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4">
                    <form action={toggleClass}>
                      <input
                        type="hidden"
                        name="id"
                        value={schoolClass.id}
                      />
                      <button
                        type="submit"
                        className="text-xs font-medium text-danger hover:text-danger"
                      >
                        Deactivate class
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {inactiveClasses.length > 0 && (
          <section className="rounded-xl border border-school bg-surface shadow-sm">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-lg font-semibold text-primary">
                Inactive Classes
              </h2>
            </div>

            <div>
              {inactiveClasses.map((schoolClass) => (
                <div
                  key={schoolClass.id}
                  className="flex flex-col gap-3 border-b border-school px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-primary">
                      {schoolClass.name}
                    </p>
                    <p className="text-xs text-muted">
                      {sectionLabel(schoolClass.section)}
                    </p>
                  </div>

                  <form action={toggleClass}>
                    <input
                      type="hidden"
                      name="id"
                      value={schoolClass.id}
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-school px-3 py-2 text-xs font-medium text-secondary hover:bg-school"
                    >
                      Reactivate
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
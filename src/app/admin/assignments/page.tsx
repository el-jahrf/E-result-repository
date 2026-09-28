import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isLowerSchool(section: string) {
  return section === "NURSERY" || section === "PRIMARY";
}

function getClassLabel(classItem: {
  name: string;
  arm: string | null;
  stream: string | null;
}) {
  const parts = [classItem.name];

  if (classItem.arm) {
    parts.push(classItem.arm);
  }

  if (
    classItem.stream &&
    classItem.stream !== classItem.arm
  ) {
    parts.push(classItem.stream);
  }

  return parts.join(" ");
}

function getTermLabel(term: string) {
  if (term === "FIRST") return "First Term";
  if (term === "SECOND") return "Second Term";
  return "Third Term";
}

async function assignClassTeacher(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const teacherId = String(
    formData.get("teacherId") ?? "",
  ).trim();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const sessionId = String(
    formData.get("sessionId") ?? "",
  ).trim();

  if (!teacherId || !classId || !sessionId) {
    redirect(
      "/admin/assignments?error=Missing+required+assignment+information",
    );
  }

  const [teacher, schoolClass, academicSession] =
    await Promise.all([
      prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isActive: true,
          user: {
            select: {
              isActive: true,
            },
          },
        },
      }),

      prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          name: true,
          section: true,
          isActive: true,
        },
      }),

      prisma.academicSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  if (
    !teacher ||
    !teacher.isActive ||
    !teacher.user.isActive
  ) {
    redirect(
      "/admin/assignments?error=Selected+teacher+is+inactive+or+does+not+exist",
    );
  }

  if (!schoolClass || !schoolClass.isActive) {
    redirect(
      "/admin/assignments?error=Selected+class+is+invalid+or+inactive",
    );
  }

  if (!academicSession) {
    redirect(
      "/admin/assignments?error=Selected+academic+session+does+not+exist",
    );
  }

  if (!isLowerSchool(schoolClass.section)) {
    redirect(
      "/admin/assignments?error=Class+Teacher+assignments+are+only+for+Nursery+and+Primary",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.classMasterAssignment.deleteMany({
      where: {
        classId,
        sessionId,
      },
    });

    await tx.classMasterAssignment.create({
      data: {
        teacherId,
        classId,
        sessionId,
      },
    });

    await tx.teacherAssignment.deleteMany({
      where: {
        classId,
        sessionId,
      },
    });
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");

  redirect(
    "/admin/assignments?success=Class+Teacher+assigned+successfully",
  );
}

async function removeClassTeacher(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const assignmentId = String(
    formData.get("assignmentId") ?? "",
  ).trim();

  if (!assignmentId) {
    redirect(
      "/admin/assignments?error=Assignment+ID+is+required",
    );
  }

  await prisma.classMasterAssignment.delete({
    where: {
      id: assignmentId,
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");

  redirect(
    "/admin/assignments?success=Class+Teacher+removed+successfully",
  );
}

async function assignSubjectTeacher(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const teacherId = String(
    formData.get("teacherId") ?? "",
  ).trim();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const subjectId = String(
    formData.get("subjectId") ?? "",
  ).trim();

  const sessionId = String(
    formData.get("sessionId") ?? "",
  ).trim();

  const term = String(
    formData.get("term") ?? "",
  )
    .trim()
    .toUpperCase();

  if (
    !teacherId ||
    !classId ||
    !subjectId ||
    !sessionId ||
    !term
  ) {
    redirect(
      "/admin/assignments?error=Missing+required+subject+assignment+information",
    );
  }

  if (
    term !== "FIRST" &&
    term !== "SECOND" &&
    term !== "THIRD"
  ) {
    redirect(
      "/admin/assignments?error=Invalid+academic+term",
    );
  }

  const [
    teacher,
    schoolClass,
    subject,
    academicSession,
  ] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
        user: {
          select: {
            isActive: true,
          },
        },
      },
    }),

    prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        section: true,
        isActive: true,
        classSubjects: {
          where: {
            subjectId,
          },
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        section: true,
        isActive: true,
      },
    }),

    prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (
    !teacher ||
    !teacher.isActive ||
    !teacher.user.isActive
  ) {
    redirect(
      "/admin/assignments?error=Selected+teacher+is+inactive+or+does+not+exist",
    );
  }

  if (!schoolClass || !schoolClass.isActive) {
    redirect(
      "/admin/assignments?error=Selected+class+is+invalid+or+inactive",
    );
  }

  if (!subject || !subject.isActive) {
    redirect(
      "/admin/assignments?error=Selected+subject+is+invalid+or+inactive",
    );
  }

  if (!academicSession) {
    redirect(
      "/admin/assignments?error=Selected+academic+session+does+not+exist",
    );
  }

  if (isLowerSchool(schoolClass.section)) {
    redirect(
      "/admin/assignments?error=Nursery+and+Primary+use+Class+Teachers+instead+of+subject+teachers",
    );
  }

  if (schoolClass.classSubjects.length === 0) {
    redirect(
      "/admin/assignments?error=This+subject+is+not+assigned+to+the+selected+class",
    );
  }

  if (
    subject.section &&
    subject.section !== schoolClass.section
  ) {
    redirect(
      "/admin/assignments?error=The+selected+subject+does+not+belong+to+this+class+section",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacherAssignment.deleteMany({
      where: {
        classId,
        subjectId,
        sessionId,
        term: term as "FIRST" | "SECOND" | "THIRD",
      },
    });

    await tx.teacherAssignment.create({
      data: {
        teacherId,
        classId,
        subjectId,
        sessionId,
        term: term as "FIRST" | "SECOND" | "THIRD",
      },
    });
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");

  redirect(
    "/admin/assignments?success=Subject+Teacher+assigned+successfully",
  );
}

async function removeSubjectTeacher(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const assignmentId = String(
    formData.get("assignmentId") ?? "",
  ).trim();

  if (!assignmentId) {
    redirect(
      "/admin/assignments?error=Assignment+ID+is+required",
    );
  }

  await prisma.teacherAssignment.delete({
    where: {
      id: assignmentId,
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");

  redirect(
    "/admin/assignments?success=Subject+Teacher+removed+successfully",
  );
}

async function assignFormMaster(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const teacherId = String(
    formData.get("teacherId") ?? "",
  ).trim();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const sessionId = String(
    formData.get("sessionId") ?? "",
  ).trim();

  if (!teacherId || !classId || !sessionId) {
    redirect(
      "/admin/assignments?error=Missing+required+form+master+information",
    );
  }

  const [teacher, schoolClass, academicSession] =
    await Promise.all([
      prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isActive: true,
          user: {
            select: {
              isActive: true,
            },
          },
        },
      }),

      prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          name: true,
          section: true,
          isActive: true,
        },
      }),

      prisma.academicSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  if (
    !teacher ||
    !teacher.isActive ||
    !teacher.user.isActive
  ) {
    redirect(
      "/admin/assignments?error=Selected+teacher+is+inactive+or+does+not+exist",
    );
  }

  if (!schoolClass || !schoolClass.isActive) {
    redirect(
      "/admin/assignments?error=Selected+class+is+invalid+or+inactive",
    );
  }

  if (!academicSession) {
    redirect(
      "/admin/assignments?error=Selected+academic+session+does+not+exist",
    );
  }

  if (isLowerSchool(schoolClass.section)) {
    redirect(
      "/admin/assignments?error=Lower+school+classes+use+Class+Teacher+instead+of+Form+Master",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.classMasterAssignment.deleteMany({
      where: {
        classId,
        sessionId,
      },
    });

    await tx.classMasterAssignment.create({
      data: {
        teacherId,
        classId,
        sessionId,
      },
    });
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");

  redirect(
    "/admin/assignments?success=Form+Master+assigned+successfully",
  );
}

async function removeFormMaster(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const assignmentId = String(
    formData.get("assignmentId") ?? "",
  ).trim();

  if (!assignmentId) {
    redirect(
      "/admin/assignments?error=Assignment+ID+is+required",
    );
  }

  await prisma.classMasterAssignment.delete({
    where: {
      id: assignmentId,
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");

  redirect(
    "/admin/assignments?success=Form+Master+removed+successfully",
  );
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;

  const [
    teachers,
    classes,
    academicSessions,
    subjectAssignments,
    classMasterAssignments,
  ] = await Promise.all([
    prisma.teacher.findMany({
      where: {
        isActive: true,
        user: {
          isActive: true,
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),

    prisma.class.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { section: "asc" },
        { level: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        level: true,
        arm: true,
        stream: true,
        section: true,
        classSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                section: true,
              },
            },
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
        },
      },
    }),

    prisma.academicSession.findMany({
      orderBy: {
        startDate: "desc",
      },
      select: {
        id: true,
        name: true,
        isCurrent: true,
      },
    }),

    prisma.teacherAssignment.findMany({
      orderBy: [
        { class: { name: "asc" } },
        { subject: { name: "asc" } },
        { term: "asc" },
      ],
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            arm: true,
            stream: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        AcademicSession: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
      },
    }),

    prisma.classMasterAssignment.findMany({
      orderBy: [
        { class: { name: "asc" } },
        { teacher: { lastName: "asc" } },
      ],
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            arm: true,
            stream: true,
            section: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
      },
    }),
  ]);

  const lowerClasses = classes.filter((schoolClass) =>
    isLowerSchool(schoolClass.section),
  );

  const upperClasses = classes.filter(
    (schoolClass) =>
      !isLowerSchool(schoolClass.section),
  );

  const currentSession =
    academicSessions.find(
      (academicSession) =>
        academicSession.isCurrent,
    ) ?? academicSessions[0];

  return (
    <main className="min-h-screen bg-school text-school">
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
              {[
                ["Dashboard", "/admin"],
                ["Students", "/admin/students"],
                ["Teachers", "/admin/teachers"],
                ["Classes", "/admin/classes"],
                ["Subjects", "/admin/subjects"],
                ["Enrollment", "/admin/enrollments/new"],
                ["Results", "/admin/results"],
                ["Result PINs", "/admin/result-pins"],
                ["Assignments", "/admin/assignments"],
              ].map(([label, href]) => {
                const active =
                  href === "/admin/assignments";

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-secondary hover:bg-school hover:text-primary"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-school p-4">
            <div className="rounded-lg bg-school px-3 py-3">
              <p className="text-sm font-semibold text-primary">
                Administrator
              </p>

              <p className="text-xs text-muted">
                System Admin
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-school bg-surface">
            <div className="flex min-h-[76px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
              <div>
                <p className="mb-1 text-xs font-medium text-muted">
                  Administration
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-primary">
                  Teacher Assignments
                </h1>

                <p className="mt-1 text-sm text-muted">
                  Assign, change, and remove Class Teachers,
                  Subject Teachers, and Form Masters.
                </p>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-8">
            {params.success && (
              <div className="rounded-xl border border-success bg-surface px-4 py-3 text-sm font-medium text-success">
                {params.success}
              </div>
            )}

            {params.error && (
              <div className="rounded-xl border border-danger bg-surface px-4 py-3 text-sm font-medium text-danger">
                {params.error}
              </div>
            )}

            {!academicSessions.length ? (
              <div className="rounded-2xl border border-warning bg-surface p-6">
                <h2 className="font-bold text-warning">
                  No academic session exists
                </h2>

                <p className="mt-1 text-sm text-secondary">
                  Create an academic session before assigning
                  teachers.
                </p>
              </div>
            ) : (
              <>
                {/* LOWER SCHOOL */}
                <section className="school-card overflow-hidden rounded-2xl">
                  <div className="border-b border-school px-6 py-5">
                    <h2 className="text-base font-bold text-primary">
                      Nursery & Primary — Class Teachers
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      One Class Teacher handles all subjects for
                      each lower-school class.
                    </p>
                  </div>

                  <div className="p-6">
                    <form
                      action={assignClassTeacher}
                      className="grid gap-4 md:grid-cols-4"
                    >
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Class
                        </label>

                        <select
                          name="classId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select class
                          </option>

                          {lowerClasses.map(
                            (schoolClass) => (
                              <option
                                key={schoolClass.id}
                                value={schoolClass.id}
                              >
                                {getClassLabel(schoolClass)}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Class Teacher
                        </label>

                        <select
                          name="teacherId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select teacher
                          </option>

                          {teachers.map((teacher) => (
                            <option
                              key={teacher.id}
                              value={teacher.id}
                            >
                              {teacher.firstName}{" "}
                              {teacher.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Academic Session
                        </label>

                        <select
                          name="sessionId"
                          required
                          defaultValue={
                            currentSession?.id ?? ""
                          }
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          {academicSessions.map(
                            (academicSession) => (
                              <option
                                key={academicSession.id}
                                value={
                                  academicSession.id
                                }
                              >
                                {academicSession.name}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="school-button w-full px-4 py-2.5 text-sm font-semibold"
                        >
                          Assign / Change Teacher
                        </button>
                      </div>
                    </form>

                    <div className="mt-8 overflow-x-auto">
                      <table className="min-w-full divide-y divide-[var(--border)]">
                        <thead className="bg-school">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Class
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Teacher
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Session
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--border)]">
                          {classMasterAssignments
                            .filter((assignment) =>
                              isLowerSchool(
                                assignment.class
                                  .section,
                              ),
                            )
                            .map((assignment) => (
                              <tr key={assignment.id}>
                                <td className="px-4 py-4 text-sm font-semibold text-primary">
                                  {getClassLabel(
                                    assignment.class,
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.teacher.firstName}{" "}
                                  {assignment.teacher.lastName}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.session.name}
                                </td>

                                <td className="px-4 py-4 text-right">
                                  <form
                                    action={
                                      removeClassTeacher
                                    }
                                  >
                                    <input
                                      type="hidden"
                                      name="assignmentId"
                                      value={
                                        assignment.id
                                      }
                                    />

                                    <button
                                      type="submit"
                                      className="rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger transition hover:bg-school"
                                    >
                                      Remove
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            ))}

                          {classMasterAssignments.filter(
                            (assignment) =>
                              isLowerSchool(
                                assignment.class
                                  .section,
                              ),
                          ).length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-10 text-center text-sm text-muted"
                              >
                                No lower-school Class Teachers
                                assigned yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* JSS / SS SUBJECT TEACHERS */}
                <section className="school-card overflow-hidden rounded-2xl">
                  <div className="border-b border-school px-6 py-5">
                    <h2 className="text-base font-bold text-primary">
                      JSS & Senior Secondary — Subject Teachers
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      Each class subject has one assigned teacher
                      per academic term.
                    </p>
                  </div>

                  <div className="p-6">
                    <form
                      action={assignSubjectTeacher}
                      className="grid gap-4 md:grid-cols-5"
                    >
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Class
                        </label>

                        <select
                          name="classId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select class
                          </option>

                          {upperClasses.map(
                            (schoolClass) => (
                              <option
                                key={schoolClass.id}
                                value={schoolClass.id}
                              >
                                {getClassLabel(schoolClass)}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Subject
                        </label>

                        <select
                          name="subjectId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select subject
                          </option>

                          {upperClasses
                            .flatMap(
                              (schoolClass) =>
                                schoolClass.classSubjects.map(
                                  (classSubject) => ({
                                    id: `${schoolClass.id}:${classSubject.subject.id}`,
                                    subjectId:
                                      classSubject
                                        .subject.id,
                                    className:
                                      getClassLabel(
                                        schoolClass,
                                      ),
                                    subjectName:
                                      classSubject
                                        .subject.name,
                                  }),
                                ),
                            )
                            .map((item) => (
                              <option
                                key={item.id}
                                value={item.subjectId}
                              >
                                {item.subjectName}
                              </option>
                            ))}
                        </select>

                        <p className="mt-1 text-[11px] text-muted">
                          The selected subject must belong to the
                          selected class.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Teacher
                        </label>

                        <select
                          name="teacherId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select teacher
                          </option>

                          {teachers.map((teacher) => (
                            <option
                              key={teacher.id}
                              value={teacher.id}
                            >
                              {teacher.firstName}{" "}
                              {teacher.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Session
                        </label>

                        <select
                          name="sessionId"
                          required
                          defaultValue={
                            currentSession?.id ?? ""
                          }
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          {academicSessions.map(
                            (academicSession) => (
                              <option
                                key={academicSession.id}
                                value={
                                  academicSession.id
                                }
                              >
                                {academicSession.name}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Term
                        </label>

                        <select
                          name="term"
                          required
                          defaultValue="FIRST"
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="FIRST">
                            First Term
                          </option>

                          <option value="SECOND">
                            Second Term
                          </option>

                          <option value="THIRD">
                            Third Term
                          </option>
                        </select>
                      </div>

                      <div className="md:col-span-5">
                        <button
                          type="submit"
                          className="school-button px-5 py-2.5 text-sm font-semibold"
                        >
                          Assign / Change Subject Teacher
                        </button>
                      </div>
                    </form>

                    <div className="mt-8 overflow-x-auto">
                      <table className="min-w-full divide-y divide-[var(--border)]">
                        <thead className="bg-school">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Class
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Subject
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Teacher
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Term
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Session
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--border)]">
                          {subjectAssignments.map(
                            (assignment) => (
                              <tr key={assignment.id}>
                                <td className="px-4 py-4 text-sm font-semibold text-primary">
                                  {getClassLabel(
                                    assignment.class,
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.subject.name}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.teacher.firstName}{" "}
                                  {assignment.teacher.lastName}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {getTermLabel(
                                    assignment.term,
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.AcademicSession.name}
                                </td>

                                <td className="px-4 py-4 text-right">
                                  <form
                                    action={
                                      removeSubjectTeacher
                                    }
                                  >
                                    <input
                                      type="hidden"
                                      name="assignmentId"
                                      value={
                                        assignment.id
                                      }
                                    />

                                    <button
                                      type="submit"
                                      className="rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger transition hover:bg-school"
                                    >
                                      Remove
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            ),
                          )}

                          {subjectAssignments.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-10 text-center text-sm text-muted"
                              >
                                No JSS/SS subject teachers
                                assigned yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* FORM MASTERS */}
                <section className="school-card overflow-hidden rounded-2xl">
                  <div className="border-b border-school px-6 py-5">
                    <h2 className="text-base font-bold text-primary">
                      JSS & Senior Secondary — Form Masters
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      Each JSS/SS class has one Form Master for the
                      academic session.
                    </p>
                  </div>

                  <div className="p-6">
                    <form
                      action={assignFormMaster}
                      className="grid gap-4 md:grid-cols-4"
                    >
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Class
                        </label>

                        <select
                          name="classId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select class
                          </option>

                          {upperClasses.map(
                            (schoolClass) => (
                              <option
                                key={schoolClass.id}
                                value={schoolClass.id}
                              >
                                {getClassLabel(schoolClass)}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Form Master
                        </label>

                        <select
                          name="teacherId"
                          required
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          <option value="">
                            Select teacher
                          </option>

                          {teachers.map((teacher) => (
                            <option
                              key={teacher.id}
                              value={teacher.id}
                            >
                              {teacher.firstName}{" "}
                              {teacher.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Academic Session
                        </label>

                        <select
                          name="sessionId"
                          required
                          defaultValue={
                            currentSession?.id ?? ""
                          }
                          className="school-input px-3 py-2.5 text-sm"
                        >
                          {academicSessions.map(
                            (academicSession) => (
                              <option
                                key={academicSession.id}
                                value={
                                  academicSession.id
                                }
                              >
                                {academicSession.name}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="school-button w-full px-4 py-2.5 text-sm font-semibold"
                        >
                          Assign / Change Form Master
                        </button>
                      </div>
                    </form>

                    <div className="mt-8 overflow-x-auto">
                      <table className="min-w-full divide-y divide-[var(--border)]">
                        <thead className="bg-school">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Class
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Form Master
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                              Session
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--border)]">
                          {classMasterAssignments
                            .filter(
                              (assignment) =>
                                !isLowerSchool(
                                  assignment.class
                                    .section,
                                ),
                            )
                            .map((assignment) => (
                              <tr key={assignment.id}>
                                <td className="px-4 py-4 text-sm font-semibold text-primary">
                                  {getClassLabel(
                                    assignment.class,
                                  )}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.teacher.firstName}{" "}
                                  {assignment.teacher.lastName}
                                </td>

                                <td className="px-4 py-4 text-sm text-secondary">
                                  {assignment.session.name}
                                </td>

                                <td className="px-4 py-4 text-right">
                                  <form
                                    action={
                                      removeFormMaster
                                    }
                                  >
                                    <input
                                      type="hidden"
                                      name="assignmentId"
                                      value={
                                        assignment.id
                                      }
                                    />

                                    <button
                                      type="submit"
                                      className="rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger transition hover:bg-school"
                                    >
                                      Remove
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            ))}

                          {classMasterAssignments.filter(
                            (assignment) =>
                              !isLowerSchool(
                                assignment.class
                                  .section,
                              ),
                          ).length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-10 text-center text-sm text-muted"
                              >
                                No JSS/SS Form Masters assigned
                                yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
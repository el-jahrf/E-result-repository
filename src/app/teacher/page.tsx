import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getClassLabel(classItem: {
  name: string;
  arm: string | null;
  stream: string | null;
}) {
  const parts = [classItem.name];

  if (classItem.arm) {
    parts.push(classItem.arm);
  }

  if (classItem.stream && classItem.stream !== classItem.arm) {
    parts.push(classItem.stream);
  }

  return parts.join(" ");
}

function isLowerSchool(section: string) {
  return section === "NURSERY" || section === "PRIMARY";
}

export default async function TeacherDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          email: true,
          profileCompleted: true,
        },
      },
    },
  });

  if (!teacher) {
    return (
      <main className="min-h-screen bg-school p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-danger bg-surface p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-danger">
            Teacher Profile Not Found
          </h1>

          <p className="mt-2 text-sm text-muted">
            Your teacher account exists, but your teacher profile could not
            be found. Please contact the administrator.
          </p>
        </div>
      </main>
    );
  }

  if (!teacher.user.profileCompleted) {
    redirect("/teacher/setup");
  }

  if (!teacher.isActive) {
    return (
      <main className="min-h-screen bg-school p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-warning bg-surface p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-warning">
            Account Inactive
          </h1>

          <p className="mt-2 text-sm text-muted">
            Your teacher account is currently inactive. Please contact the
            school administrator.
          </p>
        </div>
      </main>
    );
  }

  const currentSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  if (!currentSession) {
    return (
      <main className="min-h-screen bg-school p-6">
        <div className="mx-auto max-w-5xl">
          <div className="school-card p-8">
            <h1 className="text-2xl font-semibold text-primary">
              Teacher Dashboard
            </h1>

            <p className="mt-2 text-sm text-muted">
              Welcome, {teacher.firstName} {teacher.lastName}.
            </p>

            <div className="mt-6 rounded-lg border border-warning bg-school p-4 text-sm text-warning">
              No current academic session has been configured yet.
            </div>
          </div>
        </div>
      </main>
    );
  }

  const [subjectAssignments, classMasterAssignments] = await Promise.all([
    prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.id,
        sessionId: currentSession.id,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
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
            section: true,
          },
        },
      },
      orderBy: [
        {
          class: {
            name: "asc",
          },
        },
        {
          subject: {
            name: "asc",
          },
        },
      ],
    }),

    prisma.classMasterAssignment.findMany({
      where: {
        teacherId: teacher.id,
        sessionId: currentSession.id,
      },
      include: {
        class: {
          include: {
            classSubjects: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
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
        },
      },
      orderBy: {
        class: {
          name: "asc",
        },
      },
    }),
  ]);

  /*
   * Lower-school classes are determined entirely by
   * ClassMasterAssignment.
   *
   * We deliberately do NOT look at TeacherAssignment here.
   */
  const lowerClassAssignments = classMasterAssignments.filter((assignment) =>
    isLowerSchool(assignment.class.section),
  );

  /*
   * JSS / SS subject assignments only.
   */
  const subjectTeacherAssignments = subjectAssignments.filter(
    (assignment) => !isLowerSchool(assignment.class.section),
  );

  const lowerClasses = lowerClassAssignments.map((assignment) => ({
    id: assignment.class.id,
    name: assignment.class.name,
    level: assignment.class.level,
    arm: assignment.class.arm,
    stream: assignment.class.stream,
    section: assignment.class.section,
    subjects: assignment.class.classSubjects.map((classSubject) => ({
      id: classSubject.subject.id,
      name: classSubject.subject.name,
      code: classSubject.subject.code,
    })),
  }));

  /*
   * Count every class the teacher is actually responsible for.
   */
  const uniqueClassIds = new Set([
    ...subjectAssignments.map((assignment) => assignment.class.id),
    ...classMasterAssignments.map((assignment) => assignment.class.id),
  ]);

  const uniqueSubjectCount = new Set(
    subjectTeacherAssignments.map((assignment) => assignment.subject.id),
  ).size;

  const totalRoles =
    lowerClassAssignments.length +
    subjectTeacherAssignments.length +
    classMasterAssignments.filter(
      (assignment) => !isLowerSchool(assignment.class.section),
    ).length;

  return (
    <main className="min-h-screen bg-school">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-school pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary">
              RISING FOUNDATION ACADEMY
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary">
              Teacher Dashboard
            </h1>

            <p className="mt-1 text-sm text-muted">
              Welcome, {teacher.firstName} {teacher.lastName}
            </p>
          </div>

          <div className="school-card px-4 py-3 text-sm">
            <p className="font-medium text-primary">
              {currentSession.name}
            </p>

            <p className="text-muted">Current Academic Session</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="school-card p-5">
            <p className="text-sm text-muted">My Classes</p>

            <p className="mt-2 text-3xl font-semibold text-primary">
              {uniqueClassIds.size}
            </p>
          </div>

          <div className="school-card p-5">
            <p className="text-sm text-muted">My Subjects</p>

            <p className="mt-2 text-3xl font-semibold text-primary">
              {uniqueSubjectCount}
            </p>
          </div>

          <div className="school-card p-5">
            <p className="text-sm text-muted">Form / Class Master</p>

            <p className="mt-2 text-3xl font-semibold text-primary">
              {classMasterAssignments.length}
            </p>
          </div>

          <div className="school-card p-5">
            <p className="text-sm text-muted">Active Roles</p>

            <p className="mt-2 text-3xl font-semibold text-primary">
              {totalRoles}
            </p>
          </div>
        </div>

        {/* Lower School Classes */}
        {lowerClasses.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary">
                My Classes
              </h2>

              <p className="mt-1 text-sm text-muted">
                Lower-school classes where you are the Class Teacher.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {lowerClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="school-card p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Class Teacher
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-primary">
                        {getClassLabel(classItem)}
                      </h3>
                    </div>

                    <span className="rounded-full bg-school px-3 py-1 text-xs font-medium text-secondary">
                      {classItem.section}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-school pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Subjects</span>

                      <span className="font-medium text-primary">
                        {classItem.subjects.length}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted">
                      You can enter complete student results for all subjects
                      in this class.
                    </p>
                  </div>

                  <div className="mt-5">
                    <Link
                      href={`/teacher/class/${classItem.id}`}
                      className="school-button block w-full px-4 py-2.5 text-center text-sm font-medium"
                    >
                      Open Class
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Subject Assignments */}
        {subjectTeacherAssignments.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary">
                My Subjects
              </h2>

              <p className="mt-1 text-sm text-muted">
                JSS and Senior Secondary subjects assigned to you.
              </p>
            </div>

            <div className="school-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-school bg-school">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-secondary">
                        Class
                      </th>

                      <th className="px-5 py-3 font-semibold text-secondary">
                        Subject
                      </th>

                      <th className="px-5 py-3 font-semibold text-secondary">
                        Term
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-secondary">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-school">
                    {subjectTeacherAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-primary">
                            {getClassLabel(assignment.class)}
                          </p>

                          <p className="text-xs text-muted">
                            {assignment.class.section}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-primary">
                            {assignment.subject.name}
                          </p>

                          <p className="text-xs text-muted">
                            {assignment.subject.code}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-secondary">
                          {assignment.term}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/teacher/results?assignmentId=${assignment.id}`}
                            className="inline-flex rounded-lg border border-school bg-surface px-3 py-2 text-xs font-medium text-secondary transition hover:bg-school"
                          >
                            Enter Results
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Form Classes */}
        {classMasterAssignments.filter(
          (assignment) => !isLowerSchool(assignment.class.section),
        ).length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary">
                My Form Classes
              </h2>

              <p className="mt-1 text-sm text-muted">
                JSS and Senior Secondary classes where you are the Form
                Master.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {classMasterAssignments
                .filter(
                  (assignment) =>
                    !isLowerSchool(assignment.class.section),
                )
                .map((assignment) => (
                  <div
                    key={assignment.id}
                    className="school-card p-6"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Form Master
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-primary">
                      {getClassLabel(assignment.class)}
                    </h3>

                    <p className="mt-2 text-sm text-muted">
                      {assignment.class.section} · {currentSession.name}
                    </p>

                    <div className="mt-5">
                      <Link
                        href={`/teacher/class/${assignment.class.id}`}
                        className="block w-full rounded-lg border border-school bg-surface px-4 py-2.5 text-center text-sm font-medium text-secondary transition hover:bg-school"
                      >
                        Open Form Class
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* No Assignments */}
        {subjectAssignments.length === 0 &&
          classMasterAssignments.length === 0 && (
            <div className="school-card mt-8 p-8 text-center">
              <h2 className="text-lg font-semibold text-primary">
                No assignments yet
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
                Your administrator has not assigned you a class, subject,
                or form class for the current academic session.
              </p>
            </div>
          )}

        {/* Session Information */}
        <div className="school-card mt-8 p-5">
          <p className="text-sm font-medium text-primary">
            Current session: {currentSession.name}
          </p>

          <p className="mt-1 text-sm text-muted">
            Your available classes, subjects, and form-master
            responsibilities are determined by the assignments made by the
            school administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
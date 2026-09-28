import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const terms = [
  {
    value: "FIRST",
    label: "First Term",
  },
  {
    value: "SECOND",
    label: "Second Term",
  },
  {
    value: "THIRD",
    label: "Third Term",
  },
] as const;

type Term = (typeof terms)[number]["value"];

function isValidTerm(value: string): value is Term {
  return value === "FIRST" || value === "SECOND" || value === "THIRD";
}

function getTermLabel(term: Term) {
  return terms.find((item) => item.value === term)?.label ?? "First Term";
}

async function createSession(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const name = String(formData.get("name") || "").trim();
  const startDateValue = String(formData.get("startDate") || "").trim();
  const endDateValue = String(formData.get("endDate") || "").trim();
  const currentTermValue = String(
    formData.get("currentTerm") || "FIRST",
  ).trim();

  if (!name || !startDateValue || !endDateValue) {
    return;
  }

  if (!isValidTerm(currentTermValue)) {
    return;
  }

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.academicSession.updateMany({
      data: {
        isCurrent: false,
      },
    });

    await tx.academicSession.create({
      data: {
        name,
        startDate,
        endDate,
        isCurrent: true,
        currentTerm: currentTermValue,
      },
    });
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/student/results");
}

async function setCurrentSession(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") || "").trim();
  const currentTermValue = String(
    formData.get("term") || "FIRST",
  ).trim();

  if (!sessionId || !isValidTerm(currentTermValue)) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.academicSession.updateMany({
      data: {
        isCurrent: false,
      },
    });

    await tx.academicSession.update({
      where: {
        id: sessionId,
      },
      data: {
        isCurrent: true,
        currentTerm: currentTermValue,
      },
    });
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/student/results");
}

async function updateSessionTerm(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") || "").trim();
  const termValue = String(formData.get("term") || "").trim();

  if (!sessionId || !isValidTerm(termValue)) {
    return;
  }

  await prisma.academicSession.update({
    where: {
      id: sessionId,
    },
    data: {
      currentTerm: termValue,
    },
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/student/results");
}

export default async function AcademicSessionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const sessions = await prisma.academicSession.findMany({
    orderBy: {
      startDate: "desc",
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          results: true,
        },
      },
    },
  });

  const currentSession = sessions.find((item) => item.isCurrent);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Academic Sessions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage academic sessions and their active terms.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Session
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Creating a new session will make it the current session.
            </p>

            <form action={createSession} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Session Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="2026/2027"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>

                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>

                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="currentTerm"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Current Term
                </label>

                <select
                  id="currentTerm"
                  name="currentTerm"
                  defaultValue="FIRST"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500"
                >
                  {terms.map((term) => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Create Session
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Existing Sessions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Each session keeps its own current term. Only one session can
                be the active session at a time.
              </p>
            </div>

            {currentSession && (
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                <p className="text-sm text-gray-500">Current Session</p>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-gray-900">
                    {currentSession.name}
                  </p>

                  <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                    {getTermLabel(currentSession.currentTerm as Term)}
                  </span>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  No academic sessions have been created yet.
                </div>
              ) : (
                sessions.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {item.name}
                          </h3>

                          {item.isCurrent && (
                            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {item.startDate.toLocaleDateString()} —{" "}
                          {item.endDate.toLocaleDateString()}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          {item._count.enrollments} enrollment
                          {item._count.enrollments === 1 ? "" : "s"} ·{" "}
                          {item._count.results} result
                          {item._count.results === 1 ? "" : "s"}
                        </p>
                      </div>

                      <form
                        action={updateSessionTerm}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                      >
                        <input
                          type="hidden"
                          name="sessionId"
                          value={item.id}
                        />

                        <select
                          name="term"
                          defaultValue={item.currentTerm}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500"
                        >
                          {terms.map((term) => (
                            <option key={term.value} value={term.value}>
                              {term.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Save Term
                        </button>

                        {!item.isCurrent && (
                          <button
                            type="submit"
                            formAction={setCurrentSession}
                            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                          >
                            Make Current
                          </button>
                        )}
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
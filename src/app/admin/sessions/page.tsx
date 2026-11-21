import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const terms = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
] as const;

type Term = (typeof terms)[number]["value"];

function isValidTerm(value: string): value is Term {
  return value === "FIRST" || value === "SECOND" || value === "THIRD";
}

function getTermLabel(term: Term) {
  return terms.find((item) => item.value === term)?.label ?? "First Term";
}

function parseDate(value: string): Date | null {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function getNextResumptionDate(item: {
  currentTerm: Term;
  firstTermResumptionDate: Date | null;
  secondTermResumptionDate: Date | null;
  thirdTermResumptionDate: Date | null;
}) {
  switch (item.currentTerm) {
    case "FIRST":
      return item.secondTermResumptionDate;
    case "SECOND":
      return item.thirdTermResumptionDate;
    case "THIRD":
      return item.firstTermResumptionDate;
  }
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
  const currentTermValue = String(formData.get("currentTerm") || "FIRST").trim();

  if (!name || !startDateValue || !endDateValue) return;
  if (!isValidTerm(currentTermValue)) return;

  const startDate = parseDate(startDateValue);
  const endDate = parseDate(endDateValue);

  if (!startDate || !endDate || endDate <= startDate) return;

  await prisma.$transaction(async (tx) => {
    await tx.academicSession.updateMany({
      data: { isCurrent: false },
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

  redirect("/admin/sessions");
}

async function setCurrentSession(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") || "").trim();
  const currentTermValue = String(formData.get("term") || "FIRST").trim();

  if (!sessionId || !isValidTerm(currentTermValue)) return;

  await prisma.$transaction(async (tx) => {
    await tx.academicSession.updateMany({
      data: { isCurrent: false },
    });

    await tx.academicSession.update({
      where: { id: sessionId },
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

  redirect("/admin/sessions");
}

async function updateSessionTerm(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") || "").trim();
  const termValue = String(formData.get("term") || "").trim();

  if (!sessionId || !isValidTerm(termValue)) return;

  await prisma.academicSession.update({
    where: { id: sessionId },
    data: { currentTerm: termValue },
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/student/results");

  redirect("/admin/sessions");
}

async function saveResumptionDate(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") || "").trim();
  const dateValue = String(formData.get("nextTermResumptionDate") || "").trim();

  if (!sessionId || !dateValue) {
    redirect("/admin/sessions?resumption=missing");
  }

  const date = parseDate(dateValue);

  if (!date) {
    redirect("/admin/sessions?resumption=invalid");
  }

  const academicSession = await prisma.academicSession.findUnique({
    where: { id: sessionId },
    select: {
      currentTerm: true,
    },
  });

  if (!academicSession) {
    redirect("/admin/sessions?resumption=error");
  }

  let updateData;

  switch (academicSession.currentTerm) {
    case "FIRST":
      updateData = { secondTermResumptionDate: date };
      break;

    case "SECOND":
      updateData = { thirdTermResumptionDate: date };
      break;

    case "THIRD":
      updateData = { firstTermResumptionDate: date };
      break;

    default:
      redirect("/admin/sessions?resumption=error");
  }

  await prisma.academicSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/student/results");
  revalidatePath("/admin/results");

  redirect("/admin/sessions?resumption=saved");
}

export default async function AcademicSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ resumption?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;

  const sessions = await prisma.academicSession.findMany({
    orderBy: { startDate: "desc" },
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
    <main className="min-h-screen bg-[#F7F1E7] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#2B211C]">
            Academic Sessions
          </h1>

          <p className="mt-1 text-sm text-[#7A5038]">
            Create and manage academic sessions, active terms and resumption dates.
          </p>
        </div>

        {params.resumption === "saved" && (
          <div className="mb-5 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            Next term resumption date saved successfully.
          </div>
        )}

        {params.resumption === "missing" && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Please select a resumption date before saving.
          </div>
        )}

        {params.resumption === "invalid" && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            The selected date is invalid. Please try again.
          </div>
        )}

        {params.resumption === "error" && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            The date could not be saved. Please refresh and try again.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-xl border border-[#C8A878] bg-[#FFFCF7] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B211C]">
              Create New Session
            </h2>

            <p className="mt-1 text-sm text-[#7A5038]">
              Creating a new session will make it the current session.
            </p>

            <form action={createSession} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-[#4A2C20]">
                  Session Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="2026/2027"
                  required
                  className="w-full rounded-md border border-[#C8A878] px-3 py-2 text-sm outline-none focus:border-[#4A2C20]"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-[#4A2C20]">
                  Start Date
                </label>

                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="w-full rounded-md border border-[#C8A878] px-3 py-2 text-sm outline-none focus:border-[#4A2C20]"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-[#4A2C20]">
                  End Date
                </label>

                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="w-full rounded-md border border-[#C8A878] px-3 py-2 text-sm outline-none focus:border-[#4A2C20]"
                />
              </div>

              <div>
                <label htmlFor="currentTerm" className="mb-1 block text-sm font-medium text-[#4A2C20]">
                  Current Term
                </label>

                <select
                  id="currentTerm"
                  name="currentTerm"
                  defaultValue="FIRST"
                  className="w-full rounded-md border border-[#C8A878] bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#4A2C20]"
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
                className="w-full rounded-md bg-[#4A2C20] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3A2118]"
              >
                Create Session
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-[#C8A878] bg-[#FFFCF7] shadow-sm">
            <div className="border-b border-[#C8A878] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#2B211C]">
                Existing Sessions
              </h2>

              <p className="mt-1 text-sm text-[#7A5038]">
                Each session keeps its own current term and next resumption date.
                Only one session can be active at a time.
              </p>
            </div>

            {currentSession && (
              <div className="border-b border-[#C8A878] bg-[#F7F1E7] px-5 py-4">
                <p className="text-sm text-[#7A5038]">Current Session</p>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-[#2B211C]">
                    {currentSession.name}
                  </p>

                  <span className="rounded-full bg-[#4A2C20] px-2.5 py-1 text-xs font-medium text-white">
                    {getTermLabel(currentSession.currentTerm as Term)}
                  </span>
                </div>
              </div>
            )}

            <div className="divide-y divide-[#C8A878]">
              {sessions.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-[#7A5038]">
                  No academic sessions have been created yet.
                </div>
              ) : (
                sessions.map((item) => {
                  const nextResumptionDate = getNextResumptionDate({
                    currentTerm: item.currentTerm as Term,
                    firstTermResumptionDate: item.firstTermResumptionDate,
                    secondTermResumptionDate: item.secondTermResumptionDate,
                    thirdTermResumptionDate: item.thirdTermResumptionDate,
                  });

                  return (
                    <div key={item.id} className="px-5 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-[#2B211C]">
                              {item.name}
                            </h3>

                            {item.isCurrent && (
                              <span className="rounded-full bg-[#4A2C20] px-2.5 py-1 text-xs font-medium text-white">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-[#7A5038]">
                            {item.startDate.toLocaleDateString()} —{" "}
                            {item.endDate.toLocaleDateString()}
                          </p>

                          <p className="mt-2 text-xs text-[#7A5038]">
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
                          <input type="hidden" name="sessionId" value={item.id} />

                          <select
                            name="term"
                            defaultValue={item.currentTerm}
                            className="rounded-md border border-[#C8A878] bg-[#FFFCF7] px-3 py-2 text-sm text-[#4A2C20] outline-none focus:border-[#4A2C20]"
                          >
                            {terms.map((term) => (
                              <option key={term.value} value={term.value}>
                                {term.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="rounded-md border border-[#C8A878] px-3 py-2 text-sm font-medium text-[#4A2C20] hover:bg-[#F7F1E7]"
                          >
                            Save Term
                          </button>

                          {!item.isCurrent && (
                            <button
                              type="submit"
                              formAction={setCurrentSession}
                              className="rounded-md bg-[#4A2C20] px-3 py-2 text-sm font-medium text-white hover:bg-[#3A2118]"
                            >
                              Make Current
                            </button>
                          )}
                        </form>
                      </div>

                      <div className="mt-5 rounded-lg border border-[#E2D2B8] bg-[#FDF9F2] p-4">
                        <h4 className="text-sm font-semibold text-[#4A2C20]">
                          Next Term Resumption Date
                        </h4>

                        <p className="mt-1 text-xs text-[#7A5038]">
                          Enter when students should resume after{" "}
                          {getTermLabel(item.currentTerm as Term)}.
                        </p>

                        <form
                          action={saveResumptionDate}
                          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                          <input
                            type="hidden"
                            name="sessionId"
                            value={item.id}
                          />

                          <div className="flex-1">
                            <label
                              htmlFor={`next-resumption-${item.id}`}
                              className="mb-1 block text-xs font-medium text-[#4A2C20]"
                            >
                              Resumption Date
                            </label>

                            <input
                              id={`next-resumption-${item.id}`}
                              type="date"
                              name="nextTermResumptionDate"
                              required
                              defaultValue={dateInputValue(nextResumptionDate)}
                              className="w-full rounded-md border border-[#C8A878] bg-white px-3 py-2.5 text-sm text-[#2B211C] outline-none focus:border-[#4A2C20]"
                            />
                          </div>

                          <button
                            type="submit"
                            className="rounded-md bg-[#4A2C20] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A2118]"
                          >
                            Save Resumption Date
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
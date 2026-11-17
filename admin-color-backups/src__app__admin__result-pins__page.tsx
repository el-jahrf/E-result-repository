"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  admissionNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  isActive: boolean;
};

type AcademicSession = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type SchoolClass = {
  id: string;
  name: string;
  level: string;
  arm: string | null;
  stream: string | null;
  section: string;
};

type ResultPin = {
  id: string;
  pin: string;
  studentId: string;
  sessionId: string;
  term: "FIRST" | "SECOND" | "THIRD";
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
  };
  session: {
    id: string;
    name: string;
  };
};

type GenerationMode = "student" | "class" | "all";

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

function Icon({
  name,
  active = false,
}: {
  name: IconName;
  active?: boolean;
}) {
  const common = {
    className: `h-5 w-5 shrink-0 ${
      active ? "text-white" : "text-gray-500"
    }`,
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
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </svg>
      );

    case "classes":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V8l7-5 7 5v13" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
        </svg>
      );

    case "subjects":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
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
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M21 10H3" />
          <path d="M7 6h10l1 4H6l1-4Z" />
          <path d="M8 14h8" />
          <path d="M10 18h4" />
          <path d="M12 10v10" />
        </svg>
      );

    case "assignments":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
          <path d="M8 17h3" />
        </svg>
      );
  }
}

const navigation: {
  name: string;
  href: string;
  icon: IconName;
}[] = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "Students", href: "/admin/students", icon: "students" },
  { name: "Teachers", href: "/admin/teachers", icon: "teachers" },
  { name: "Classes", href: "/admin/classes", icon: "classes" },
  { name: "Subjects", href: "/admin/subjects", icon: "subjects" },
  {
    name: "Enrollment",
    href: "/admin/enrollments/new",
    icon: "enrollment",
  },
  { name: "Results", href: "/admin/results", icon: "results" },
  {
    name: "Result PINs",
    href: "/admin/result-pins",
    icon: "pin",
  },
  {
    name: "Assignments",
    href: "/admin/assignments",
    icon: "assignments",
  },
];

const terms = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
];

function studentName(student: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

function className(classItem: SchoolClass) {
  return [classItem.name, classItem.arm, classItem.stream]
    .filter(Boolean)
    .join(" ");
}

export default function ResultPinsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [resultPins, setResultPins] = useState<ResultPin[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [term, setTerm] = useState("FIRST");

  const [mode, setMode] = useState<GenerationMode>("student");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");

  const [maxUses, setMaxUses] = useState("5");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [printPinId, setPrintPinId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [studentsResponse, sessionsResponse, classesResponse] =
        await Promise.all([
          fetch("/api/admin/students"),
          fetch("/api/admin/sessions"),
          fetch("/api/admin/result-pins/classes"),
        ]);

      const studentsData = await studentsResponse.json();
      const sessionsData = await sessionsResponse.json();
      const classesData = await classesResponse.json();

      if (!studentsResponse.ok || !studentsData.success) {
        throw new Error(
          studentsData.error || "Failed to load students."
        );
      }

      if (!sessionsResponse.ok || !sessionsData.success) {
        throw new Error(
          sessionsData.error || "Failed to load sessions."
        );
      }

      if (!classesResponse.ok || !classesData.success) {
        throw new Error(
          classesData.error || "Failed to load classes."
        );
      }

      setStudents(studentsData.students || []);
      setSessions(sessionsData.sessions || []);
      setClasses(classesData.classes || []);

      const currentSession =
        sessionsData.sessions?.find(
          (item: AcademicSession) => item.isCurrent
        ) || sessionsData.sessions?.[0];

      if (currentSession) {
        setSessionId(currentSession.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load page data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPins() {
    if (!sessionId) {
      setResultPins([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/result-pins?sessionId=${encodeURIComponent(
          sessionId
        )}&term=${encodeURIComponent(term)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load result PINs."
        );
      }

      setResultPins(data.resultPins || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load result PINs."
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPins();
  }, [sessionId, term]);

  async function generatePins() {
    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/result-pins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId:
            mode === "student" ? studentId : undefined,
          classId: mode === "class" ? classId : undefined,
          sessionId,
          term,
          mode,
          maxUses: Number(maxUses) || 5,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to generate PINs."
        );
      }

      setMessage(
        `Done. ${data.createdCount} new PIN${
          data.createdCount === 1 ? "" : "s"
        } generated${
          data.existingCount
            ? `, ${data.existingCount} existing PIN${
                data.existingCount === 1 ? "" : "s"
              } kept.`
            : "."
        }`
      );

      await loadPins();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate PINs."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function togglePin(pin: ResultPin) {
    try {
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/result-pins", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pin.id,
          isActive: !pin.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to update PIN."
        );
      }

      await loadPins();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update PIN."
      );
    }
  }

  const filteredPins = useMemo(() => {
    return resultPins.filter(
      (pin) =>
        pin.sessionId === sessionId &&
        pin.term === term
    );
  }, [resultPins, sessionId, term]);

  const activePins = useMemo(() => {
    return filteredPins.filter((pin) => pin.isActive);
  }, [filteredPins]);

  const printablePins = useMemo(() => {
    if (!printPinId) {
      return activePins;
    }

    return activePins.filter((pin) => pin.id === printPinId);
  }, [activePins, printPinId]);

  const selectedSession = sessions.find(
    (session) => session.id === sessionId
  );

  function printCards() {
    if (activePins.length === 0) {
      setError("There are no active PINs to print.");
      return;
    }

    setPrintPinId(null);

    setTimeout(() => {
      window.print();
    }, 50);
  }

  function printSingleCard(pin: ResultPin) {
    if (!pin.isActive) {
      setError("Only active PINs can be printed.");
      return;
    }

    setError("");
    setMessage("");
    setPrintPinId(pin.id);

    setTimeout(() => {
      window.print();
    }, 50);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Loading Result PIN management...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7f8fa] text-gray-900 print:hidden">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
            <div className="flex h-20 items-center border-b border-gray-100 px-6">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-950">
                  RISING FOUNDATION
                </h1>
                <p className="text-xs font-medium tracking-wide text-gray-500">
                  ACADEMY
                </p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-5">
              {navigation.map((item) => {
                const active = item.name === "Result PINs";

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      active={active}
                    />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </nav>

            <div className="border-t border-gray-100 p-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[10px] font-bold tracking-wider text-gray-500">
                  CURRENT SESSION
                </p>

                <p className="mt-1 text-sm font-bold text-gray-900">
                  {selectedSession?.name || "No current session"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Result PIN Management
                </p>
              </div>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex min-h-20 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 lg:px-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Administration
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-950">
                  Result PINs
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  AD
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">
                    Admin
                  </p>

                  <p className="text-xs text-gray-500">
                    Administrator
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 p-6 lg:p-10">
              <div className="mx-auto max-w-7xl space-y-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Student Result Access
                  </p>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                    Result PINs
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                    Generate, manage and print student result
                    access PINs for published results.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {message}
                  </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                        <Icon name="pin" active />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-gray-950">
                          Generate Result PINs
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-500">
                          PINs contain 15 numbers and use the
                          format 4443-4443-4443-444.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-800">
                        Academic Session
                      </label>

                      <select
                        value={sessionId}
                        onChange={(event) =>
                          setSessionId(event.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        {sessions.map((session) => (
                          <option
                            key={session.id}
                            value={session.id}
                          >
                            {session.name}
                            {session.isCurrent
                              ? " — Current"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-800">
                        Term
                      </label>

                      <select
                        value={term}
                        onChange={(event) =>
                          setTerm(event.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        {terms.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-800">
                        Generate For
                      </label>

                      <select
                        value={mode}
                        onChange={(event) => {
                          setMode(
                            event.target.value as GenerationMode
                          );
                          setStudentId("");
                          setClassId("");
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        <option value="student">
                          Individual Student
                        </option>

                        <option value="class">
                          Entire Class
                        </option>

                        <option value="all">
                          All Students
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-800">
                        Maximum Uses
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={maxUses}
                        onChange={(event) =>
                          setMaxUses(event.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      />
                    </div>

                    {mode === "student" && (
                      <div className="md:col-span-2 lg:col-span-4">
                        <label className="mb-2 block text-sm font-bold text-gray-800">
                          Student
                        </label>

                        <select
                          value={studentId}
                          onChange={(event) =>
                            setStudentId(event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="">
                            Select a student
                          </option>

                          {students
                            .filter(
                              (student) => student.isActive
                            )
                            .map((student) => (
                              <option
                                key={student.id}
                                value={student.id}
                              >
                                {student.admissionNo} —{" "}
                                {studentName(student)}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {mode === "class" && (
                      <div className="md:col-span-2 lg:col-span-4">
                        <label className="mb-2 block text-sm font-bold text-gray-800">
                          Class
                        </label>

                        <select
                          value={classId}
                          onChange={(event) =>
                            setClassId(event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="">
                            Select a class
                          </option>

                          {classes.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {className(item)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-gray-100 px-6 py-5">
                    <button
                      type="button"
                      onClick={generatePins}
                      disabled={
                        generating ||
                        !sessionId ||
                        (mode === "student" && !studentId) ||
                        (mode === "class" && !classId)
                      }
                      className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generating
                        ? "Generating..."
                        : mode === "student"
                          ? "Generate PIN"
                          : mode === "class"
                            ? "Generate Missing Class PINs"
                            : "Generate Missing PINs for All Students"}
                    </button>

                    <button
                      type="button"
                      onClick={printCards}
                      disabled={activePins.length === 0}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Print Scratch Cards ({activePins.length})
                    </button>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/70 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-950">
                        Generated PINs
                      </h2>

                      <p className="mt-1 text-xs text-gray-500">
                        {selectedSession?.name ||
                          "Selected session"}{" "}
                        ·{" "}
                        {
                          terms.find(
                            (item) => item.value === term
                          )?.label
                        }
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
                      {filteredPins.length} PIN
                      {filteredPins.length === 1
                        ? ""
                        : "s"}{" "}
                      found
                    </div>
                  </div>

                  {filteredPins.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Icon name="pin" />
                      </div>

                      <h3 className="mt-4 text-base font-bold text-gray-950">
                        No PINs generated
                      </h3>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                        No result access PINs have been
                        generated for this academic session
                        and term.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="border-b border-gray-200 bg-white">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Student
                            </th>

                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Admission No.
                            </th>

                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                              PIN
                            </th>

                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Uses
                            </th>

                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Status
                            </th>

                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {filteredPins.map((pin) => (
                            <tr
                              key={pin.id}
                              className="transition hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {studentName(pin.student)}
                              </td>

                              <td className="px-6 py-4 text-gray-600">
                                {pin.student.admissionNo}
                              </td>

                              <td className="px-6 py-4">
                                <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-gray-900">
                                  {pin.pin}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-gray-600">
                                <span className="font-semibold">
                                  {pin.usedCount}
                                </span>{" "}
                                / {pin.maxUses}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                    pin.isActive
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {pin.isActive
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-4">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      printSingleCard(pin)
                                    }
                                    disabled={!pin.isActive}
                                    className="text-sm font-bold text-gray-700 transition hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Print
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePin(pin)
                                    }
                                    className="text-sm font-bold text-gray-700 transition hover:text-gray-950"
                                  >
                                    {pin.isActive
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>

      <section className="hidden print:block">
        <div className="print-page">
          <div className="print-grid">
            {printablePins.map((pin) => (
              <article
                key={pin.id}
                className="scratch-card"
              >
                <div className="scratch-card-header">
                  <div>
                    <h2>RISING FOUNDATION ACADEMY</h2>
                    <p>STUDENT RESULT ACCESS PIN</p>
                  </div>

                  <div className="pin-badge">
                    RESULT PIN
                  </div>
                </div>

                <div className="scratch-card-body">
                  <div className="student-info">
                    <p>
                      <strong>Student:</strong>{" "}
                      {studentName(pin.student)}
                    </p>

                    <p>
                      <strong>Admission No:</strong>{" "}
                      {pin.student.admissionNo}
                    </p>

                    <p>
                      <strong>Session:</strong>{" "}
                      {pin.session.name}
                    </p>

                    <p>
                      <strong>Term:</strong>{" "}
                      {
                        terms.find(
                          (item) => item.value === pin.term
                        )?.label
                      }
                    </p>
                  </div>

                  <div className="pin-display">
                    <p>YOUR RESULT PIN</p>
                    <strong>{pin.pin}</strong>
                  </div>

                  <div className="scratch-instructions">
                    <p>
                      Use this PIN to access your published
                      result.
                    </p>

                    <p>
                      Maximum uses: {pin.maxUses}
                    </p>
                  </div>
                </div>

                <div className="scratch-card-footer">
                  <span>Keep this PIN secure.</span>
                  <span>
                    RISING FOUNDATION ACADEMY
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .print-page,
          .print-page * {
            visibility: visible;
          }

          .print-page {
            display: block !important;
            width: 100%;
          }

          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8mm;
            width: 100%;
          }

          .scratch-card {
            box-sizing: border-box;
            min-height: 55mm;
            border: 1px dashed #555;
            padding: 5mm;
            break-inside: avoid;
            page-break-inside: avoid;
            font-family: Arial, Helvetica, sans-serif;
          }

          .scratch-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 4mm;
            border-bottom: 1px solid #999;
            padding-bottom: 3mm;
          }

          .scratch-card-header h2 {
            margin: 0;
            font-size: 10pt;
            font-weight: 700;
          }

          .scratch-card-header p {
            margin: 1mm 0 0;
            font-size: 7pt;
            color: #555;
          }

          .pin-badge {
            border: 1px solid #777;
            padding: 1.5mm 2mm;
            font-size: 6.5pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .scratch-card-body {
            padding-top: 3mm;
          }

          .student-info {
            font-size: 7.5pt;
            line-height: 1.45;
          }

          .student-info p {
            margin: 0.5mm 0;
          }

          .pin-display {
            margin: 3mm 0;
            border: 1px solid #333;
            padding: 2.5mm;
            text-align: center;
          }

          .pin-display p {
            margin: 0 0 1mm;
            font-size: 6.5pt;
            font-weight: 700;
          }

          .pin-display strong {
            font-family: "Courier New", monospace;
            font-size: 15pt;
            letter-spacing: 1px;
          }

          .scratch-instructions {
            font-size: 6.5pt;
            line-height: 1.35;
            color: #444;
          }

          .scratch-instructions p {
            margin: 0.5mm 0;
          }

          .scratch-card-footer {
            display: flex;
            justify-content: space-between;
            gap: 3mm;
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 1px solid #bbb;
            font-size: 5.5pt;
            color: #555;
          }
        }
      `}</style>
    </>
  );
}
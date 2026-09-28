"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SessionOption = {
  id: string;
  name: string;
  isCurrent?: boolean;
};

type ClassOption = {
  id: string;
  name: string;
  level: string;
  arm: string | null;
  stream: string | null;
};

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
    | "results"
    | "pin"
    | "assignments";
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

  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

const navigation = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" as const },
  { label: "Students", href: "/admin/students", icon: "students" as const },
  { label: "Teachers", href: "/admin/teachers", icon: "teachers" as const },
  { label: "Classes", href: "/admin/classes", icon: "classes" as const },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects" as const },
  {
    label: "Enrollment",
    href: "/admin/enrollments/new",
    icon: "enrollment" as const,
  },
  { label: "Results", href: "/admin/results", icon: "results" as const },
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
];

const terms = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
];

export default function NewStudentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    admissionNo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    sessionId: "",
    classId: "",
    term: "FIRST",
  });

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadEnrollmentOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const [sessionsResponse, classesResponse] = await Promise.all([
          fetch("/api/admin/sessions"),
          fetch("/api/admin/result-pins/classes"),
        ]);

        const sessionsData = await sessionsResponse.json();
        const classesData = await classesResponse.json();

        if (!sessionsResponse.ok) {
          throw new Error(
            sessionsData.error || "Failed to load academic sessions."
          );
        }

        if (!classesResponse.ok) {
          throw new Error(classesData.error || "Failed to load classes.");
        }

        const loadedSessions: SessionOption[] =
          sessionsData.sessions || [];

        const loadedClasses: ClassOption[] = classesData.classes || [];

        setSessions(loadedSessions);
        setClasses(loadedClasses);

        const currentSession =
          loadedSessions.find((session) => session.isCurrent) ||
          loadedSessions[0];

        if (currentSession) {
          setForm((current) => ({
            ...current,
            sessionId: currentSession.id,
          }));
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load enrollment options."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadEnrollmentOptions();
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Passport photograph must be JPG, PNG, or WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError("Passport photograph must be 1.5MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setPhotoName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoData(reader.result);
      }
    };

    reader.onerror = () => {
      setError("Unable to read the passport photograph.");
    };

    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoData(null);
    setPhotoName("");

    const input = document.getElementById(
      "photo"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.sessionId) {
      setError("Please select an academic session.");
      return;
    }

    if (!form.classId) {
      setError("Please select a class.");
      return;
    }

    if (!form.term) {
      setError("Please select a term.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          photoData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create student.");
        return;
      }

      router.push("/admin/students");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-[76px] items-center border-b border-gray-200 px-6">
            <div>
              <p className="text-[15px] font-bold tracking-tight text-gray-950">
                RISING FOUNDATION
              </p>
              <p className="mt-0.5 text-[11px] font-medium tracking-[0.18em] text-gray-500">
                ACADEMY
              </p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Main Menu
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const active = item.href === "/admin/students";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-gray-500 group-hover:text-gray-900"
                      }`}
                    >
                      <Icon name={item.icon} />
                    </span>

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  Administrator
                </p>
                <p className="text-xs text-gray-500">System Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <header className="border-b border-gray-200 bg-white">
            <div className="flex min-h-[76px] items-center justify-between px-6 py-4 lg:px-8">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Student Management
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                  Add Student
                </h1>
              </div>

              <Link
                href="/admin/students"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                ← Back to Students
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-gray-950">
                Register New Student
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create the student account and enroll the student for the
                selected academic session and term.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              {error && (
                <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Passport */}
              <div className="border-b border-gray-200 p-6 lg:p-8">
                <h3 className="text-base font-bold text-gray-950">
                  Student Passport Photograph
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Upload the student&apos;s passport photograph. JPG, PNG, or
                  WebP, maximum 1.5MB.
                </p>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-gray-100">
                    {photoData ? (
                      <img
                        src={photoData}
                        alt="Student passport preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="px-3 text-center text-xs text-gray-400">
                        Passport Photo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <label
                      htmlFor="photo"
                      className="inline-flex w-fit cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {photoData
                        ? "Replace Photograph"
                        : "Upload Photograph"}
                    </label>

                    <input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                    {photoName && (
                      <p className="text-xs text-gray-500">{photoName}</p>
                    )}

                    {photoData && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="w-fit text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove Photograph
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="border-b border-gray-200 p-6 lg:p-8">
                <h3 className="text-base font-bold text-gray-950">
                  Student Information
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the student&apos;s basic information.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admissionNo"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Admission Number *
                    </label>

                    <input
                      id="admissionNo"
                      name="admissionNo"
                      value={form.admissionNo}
                      onChange={handleChange}
                      required
                      placeholder="e.g. ADM-2026-007"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Gender *
                    </label>

                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      First Name *
                    </label>

                    <input
                      id="firstName"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      placeholder="First name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="middleName"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Middle Name
                    </label>

                    <input
                      id="middleName"
                      name="middleName"
                      value={form.middleName}
                      onChange={handleChange}
                      placeholder="Middle name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Last Name *
                    </label>

                    <input
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Last name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />

                    <p className="mt-1.5 text-xs text-gray-400">
                      This will be the student&apos;s default password.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Date of Birth
                    </label>

                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Enrollment */}
              <div className="border-b border-gray-200 bg-gray-50/60 p-6 lg:p-8">
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    Initial Enrollment
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    The student will be enrolled automatically when the
                    student record is saved.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="sessionId"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Academic Session *
                    </label>

                    <select
                      id="sessionId"
                      name="sessionId"
                      value={form.sessionId}
                      onChange={handleChange}
                      required
                      disabled={loadingOptions}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingOptions
                          ? "Loading sessions..."
                          : "Select session"}
                      </option>

                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name}
                          {session.isCurrent ? " (Current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="term"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Term *
                    </label>

                    <select
                      id="term"
                      name="term"
                      value={form.term}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    >
                      {terms.map((term) => (
                        <option key={term.value} value={term.value}>
                          {term.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="classId"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Class *
                    </label>

                    <select
                      id="classId"
                      name="classId"
                      value={form.classId}
                      onChange={handleChange}
                      required
                      disabled={loadingOptions}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingOptions
                          ? "Loading classes..."
                          : "Select class"}
                      </option>

                      {classes.map((schoolClass) => (
                        <option key={schoolClass.id} value={schoolClass.id}>
                          {schoolClass.name}
                          {schoolClass.arm
                            ? ` ${schoolClass.arm}`
                            : ""}
                          {schoolClass.stream
                            ? ` - ${schoolClass.stream}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-800">
                    Enrollment summary
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    This student will be registered for{" "}
                    <strong>
                      {terms.find((term) => term.value === form.term)
                        ?.label || "the selected term"}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {sessions.find(
                        (session) => session.id === form.sessionId
                      )?.name || "the selected session"}
                    </strong>{" "}
                    in{" "}
                    <strong>
                      {(() => {
                        const selectedClass = classes.find(
                          (schoolClass) => schoolClass.id === form.classId
                        );

                        if (!selectedClass) return "the selected class";

                        return `${selectedClass.name}${
                          selectedClass.arm
                            ? ` ${selectedClass.arm}`
                            : ""
                        }${
                          selectedClass.stream
                            ? ` - ${selectedClass.stream}`
                            : ""
                        }`;
                      })()}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Login */}
              <div className="p-6 lg:p-8">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">
                    Student Login
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Username: <strong>Admission Number</strong>
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Default Password: <strong>Last Name</strong>
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
                  <Link
                    href="/admin/students"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={saving || loadingOptions}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving Student..."
                      : "Save Student & Enroll"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Option = {
  id: string;
  name: string;
  code?: string | null;
  level?: string | null;
  arm?: string | null;
  stream?: string | null;
  section?: string | null;
};

type SessionOption = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type Assignment = {
  classId: string;
  subjectId: string;
};

type ClassMasterAssignment = {
  classId: string;
};

const navigation = [
  ["Dashboard", "/admin"],
  ["Students", "/admin/students"],
  ["Teachers", "/admin/teachers"],
  ["Classes", "/admin/classes"],
  ["Subjects", "/admin/subjects"],
  ["Enrollment", "/admin/enrollments/new"],
  ["Results", "/admin/results"],
  ["Result PINs", "/admin/result-pins"],
  ["Assignments", "/admin/assignments"],
];

function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, React.ReactNode> = {
    Dashboard: (
      <>
        <path d="M3 13h8V3H3v10Z" />
        <path d="M13 21h8V11h-8v10Z" />
        <path d="M13 3h8v4h-8V3Z" />
        <path d="M3 17h8v4H3v-4Z" />
      </>
    ),
    Students: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21c0-3.2 2.7-5 6-5s6 1.8 6 5" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8" />
        <path d="M18 16.5c1.8.7 3 2 3 4.5" />
      </>
    ),
    Teachers: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21c0-3.2 2.7-5 6-5s6 1.8 6 5" />
        <path d="M16 11h5" />
        <path d="M18.5 8.5v5" />
      </>
    ),
    Classes: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    Subjects: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    Enrollment: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 9h8M8 13h5" />
        <path d="M16 16h4M18 14v4" />
      </>
    ),
    Results: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 3-4 3 2 5-7" />
      </>
    ),
    "Result PINs": (
      <>
        <circle cx="8" cy="12" r="4" />
        <path d="m11 15 8 5M14 17l2-2M16 19l2-2" />
      </>
    ),
    Assignments: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function NewTeacherPage() {
  const [staffNo, setStaffNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [term, setTerm] = useState("FIRST");

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [classMasterSessionId, setClassMasterSessionId] = useState("");
  const [classMasterClassId, setClassMasterClassId] = useState("");
  const [classMasterAssignments, setClassMasterAssignments] = useState<
    ClassMasterAssignment[]
  >([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch("/api/admin/teachers/options");

        if (!response.ok) {
          throw new Error("Unable to load teacher options.");
        }

        const data = await response.json();

        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
        setSessions(data.sessions || []);

        const current = (data.sessions || []).find(
          (item: SessionOption) => item.isCurrent,
        );

        if (current) {
          setSessionId(current.id);
          setClassMasterSessionId(current.id);
        } else if (data.sessions?.length) {
          setSessionId(data.sessions[0].id);
          setClassMasterSessionId(data.sessions[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load teacher options.",
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  function addAssignment() {
    setError("");

    if (!sessionId) {
      setError("Please select an academic session.");
      return;
    }

    if (!classId) {
      setError("Please select a class.");
      return;
    }

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    const duplicate = assignments.some(
      (item) =>
        item.classId === classId && item.subjectId === subjectId,
    );

    if (duplicate) {
      setError("This teacher is already assigned to that class and subject.");
      return;
    }

    setAssignments((current) => [
      ...current,
      {
        classId,
        subjectId,
      },
    ]);

    setClassId("");
    setSubjectId("");
  }

  function removeAssignment(index: number) {
    setAssignments((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function addClassMasterAssignment() {
    setError("");

    if (!classMasterSessionId) {
      setError("Please select an academic session for the permanent class.");
      return;
    }

    if (!classMasterClassId) {
      setError("Please select a class for the class master.");
      return;
    }

    const duplicate = classMasterAssignments.some(
      (item) => item.classId === classMasterClassId,
    );

    if (duplicate) {
      setError("This class is already selected as a permanent class.");
      return;
    }

    setClassMasterAssignments((current) => [
      ...current,
      {
        classId: classMasterClassId,
      },
    ]);

    setClassMasterClassId("");
  }

  function removeClassMasterAssignment(index: number) {
    setClassMasterAssignments((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function classLabel(item: Option) {
    return [item.name, item.arm, item.stream]
      .filter(Boolean)
      .join(" - ");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!staffNo || !firstName || !lastName || !email || !password) {
      setError("Please complete all required teacher details.");
      return;
    }

    if (!sessionId) {
      setError("Please select an academic session.");
      return;
    }

    for (const classMasterAssignment of classMasterAssignments) {
      if (!classMasterSessionId) {
        setError(
          "Please select an academic session for the permanent classes.",
        );
        return;
      }

      if (!classMasterAssignment.classId) {
        setError("One of the permanent class selections is invalid.");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffNo,
          firstName,
          lastName,
          email,
          password,
          signatureData: null,
          assignments: assignments.map((assignment) => ({
            classId: assignment.classId,
            subjectId: assignment.subjectId,
            sessionId,
            term,
          })),
          classMasterAssignments: classMasterAssignments.map((assignment) => ({
            classId: assignment.classId,
            sessionId: classMasterSessionId,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create teacher.");
      }

      setSuccess(
        `Teacher created successfully with ${
          data.assignmentCount || 0
        } teaching assignment(s) and ${
          data.classMasterAssignmentCount || 0
        } permanent class assignment(s).`,
      );

      setTimeout(() => {
        window.location.href = "/admin/teachers";
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create teacher.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-900">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="text-[15px] font-bold tracking-wide text-gray-900">
            RISING FOUNDATION
          </div>
          <div className="text-[11px] font-medium tracking-[0.18em] text-gray-500">
            ACADEMY
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map(([label, href]) => {
            const active = label === "Teachers";

            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-gray-900 bg-gray-100 text-gray-900"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon name={label} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 px-5 py-4">
          <div className="text-xs font-semibold text-gray-800">
            Administrator
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            School Management System
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <div className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Add Teacher
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create a teacher account, teaching assignments, and permanent
                class responsibilities.
              </p>
            </div>

            <Link
              href="/admin/teachers"
              className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Teachers
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-base font-semibold">
                  Teacher Information
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Basic information and login credentials.
                </p>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Staff Number *
                  </label>
                  <input
                    value={staffNo}
                    onChange={(e) => setStaffNo(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                    placeholder="e.g. TCH001"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                    placeholder="teacher@school.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    First Name *
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Last Name *
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    The teacher will be prompted to change this password and
                    create their signature when they complete their first-login
                    setup.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-base font-semibold">
                  Teaching Assignments
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Assign this teacher to the classes and subjects they teach.
                  These are subject-teaching assignments.
                </p>
              </div>

              <div className="p-6">
                {loadingOptions ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Loading classes, subjects and academic sessions...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Academic Session *
                        </label>
                        <select
                          value={sessionId}
                          onChange={(e) => setSessionId(e.target.value)}
                          className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                        >
                          <option value="">Select session</option>
                          {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                              {session.name}
                              {session.isCurrent ? " (Current)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Term *
                        </label>
                        <select
                          value={term}
                          onChange={(e) => setTerm(e.target.value)}
                          className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                        >
                          <option value="FIRST">First Term</option>
                          <option value="SECOND">Second Term</option>
                          <option value="THIRD">Third Term</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Class
                        </label>
                        <select
                          value={classId}
                          onChange={(e) => setClassId(e.target.value)}
                          className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                        >
                          <option value="">Select class</option>
                          {classes.map((item) => (
                            <option key={item.id} value={item.id}>
                              {classLabel(item)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Subject
                        </label>
                        <select
                          value={subjectId}
                          onChange={(e) => setSubjectId(e.target.value)}
                          className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                        >
                          <option value="">Select subject</option>
                          {subjects.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.code ? `${item.code} — ` : ""}
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addAssignment}
                      className="mt-5 border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      + Add Teaching Assignment
                    </button>

                    <div className="mt-6 border-t border-gray-200 pt-5">
                      <div className="mb-3 text-sm font-semibold">
                        Selected Teaching Assignments
                      </div>

                      {assignments.length === 0 ? (
                        <div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          No teaching assignments added yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {assignments.map((assignment, index) => {
                            const selectedClass = classes.find(
                              (item) => item.id === assignment.classId,
                            );

                            const selectedSubject = subjects.find(
                              (item) => item.id === assignment.subjectId,
                            );

                            return (
                              <div
                                key={`${assignment.classId}-${assignment.subjectId}`}
                                className="flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-3"
                              >
                                <div>
                                  <div className="text-sm font-medium">
                                    {selectedClass
                                      ? classLabel(selectedClass)
                                      : "Unknown class"}
                                  </div>
                                  <div className="mt-0.5 text-xs text-gray-500">
                                    {selectedSubject
                                      ? `${
                                          selectedSubject.code
                                            ? `${selectedSubject.code} — `
                                            : ""
                                        }${selectedSubject.name}`
                                      : "Unknown subject"}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeAssignment(index)}
                                  className="text-xs font-medium text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-base font-semibold">
                  Permanent Class / Class Master
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Assign the teacher as the permanent class/form master for
                  one or more classes. This is separate from the subjects the
                  teacher teaches.
                </p>
              </div>

              <div className="p-6">
                {loadingOptions ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Loading academic sessions...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Academic Session *
                        </label>
                        <select
                          value={classMasterSessionId}
                          onChange={(e) =>
                            setClassMasterSessionId(e.target.value)
                          }
                          className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                        >
                          <option value="">Select session</option>
                          {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                              {session.name}
                              {session.isCurrent ? " (Current)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Permanent Class
                        </label>
                        <select
                          value={classMasterClassId}
                          onChange={(e) =>
                            setClassMasterClassId(e.target.value)
                          }
                          className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-600"
                        >
                          <option value="">Select permanent class</option>
                          {classes.map((item) => (
                            <option key={item.id} value={item.id}>
                              {classLabel(item)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addClassMasterAssignment}
                      className="mt-5 border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      + Add Permanent Class
                    </button>

                    <div className="mt-6 border-t border-gray-200 pt-5">
                      <div className="mb-3 text-sm font-semibold">
                        Selected Permanent Classes
                      </div>

                      {classMasterAssignments.length === 0 ? (
                        <div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          No permanent classes assigned yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {classMasterAssignments.map(
                            (assignment, index) => {
                              const selectedClass = classes.find(
                                (item) => item.id === assignment.classId,
                              );

                              return (
                                <div
                                  key={assignment.classId}
                                  className="flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-3"
                                >
                                  <div>
                                    <div className="text-sm font-medium">
                                      {selectedClass
                                        ? classLabel(selectedClass)
                                        : "Unknown class"}
                                    </div>

                                    <div className="mt-0.5 text-xs text-gray-500">
                                      Class/Form Master ·{" "}
                                      {
                                        sessions.find(
                                          (session) =>
                                            session.id ===
                                            classMasterSessionId,
                                        )?.name
                                      }
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeClassMasterAssignment(index)
                                    }
                                    className="text-xs font-medium text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Link
                href="/admin/teachers"
                className="border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving || loadingOptions}
                className="border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Teacher & Assignments"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
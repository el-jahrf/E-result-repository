"use client";

import { useMemo, useState } from "react";

type StudentRow = {
  studentId: string;
  admissionNo: string;
  name: string;
  ca1: string;
  ca2: string;
  exam: string;
  teacherRemark: string;
  status: string;
};

type ResultEntryFormProps = {
  assignmentId: string;
  students: StudentRow[];
};

type ScoreState = {
  ca1: string;
  ca2: string;
  exam: string;
  teacherRemark: string;
};

export default function ResultEntryForm({
  assignmentId,
  students,
}: ResultEntryFormProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.studentId ?? null,
  );

  const [search, setSearch] = useState("");

  const [scores, setScores] = useState<Record<string, ScoreState>>(
    Object.fromEntries(
      students.map((student) => [
        student.studentId,
        {
          ca1: student.ca1,
          ca2: student.ca2,
          exam: student.exam,
          teacherRemark: student.teacherRemark,
        },
      ]),
    ),
  );

  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(
      students.map((student) => [student.studentId, student.status]),
    ),
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedStudent = students.find(
    (student) => student.studentId === selectedStudentId,
  );

  const selectedScores = selectedStudentId
    ? scores[selectedStudentId] ?? {
        ca1: "",
        ca2: "",
        exam: "",
        teacherRemark: "",
      }
    : {
        ca1: "",
        ca2: "",
        exam: "",
        teacherRemark: "",
      };

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.admissionNo.toLowerCase().includes(query),
    );
  }, [search, students]);

  const caTotal =
    Number(selectedScores.ca1 || 0) + Number(selectedScores.ca2 || 0);

  const total = caTotal + Number(selectedScores.exam || 0);

  const validateScore = (
    value: string,
    maximum: number,
  ): string | null => {
    if (value === "") {
      return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "Invalid score";
    }

    if (number < 0 || number > maximum) {
      return `Score must be between 0 and ${maximum}`;
    }

    return null;
  };

  const ca1Error = validateScore(selectedScores.ca1, 20);
  const ca2Error = validateScore(selectedScores.ca2, 20);
  const examError = validateScore(selectedScores.exam, 60);

  const hasInvalidScore =
    ca1Error !== null ||
    ca2Error !== null ||
    examError !== null;

  const updateScore = (
    field: keyof ScoreState,
    value: string,
  ) => {
    if (!selectedStudentId) {
      return;
    }

    setScores((current) => ({
      ...current,
      [selectedStudentId]: {
        ...current[selectedStudentId],
        [field]: value,
      },
    }));

    setMessage("");
    setError("");
  };

  const selectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setMessage("");
    setError("");
  };

  const saveResults = async (action: "DRAFT" | "SUBMIT") => {
    if (!selectedStudentId) {
      setError("Please select a student first.");
      return;
    }

    if (hasInvalidScore) {
      setError("Please correct the invalid scores before saving.");
      return;
    }

    if (
      action === "SUBMIT" &&
      (!selectedScores.ca1 ||
        !selectedScores.ca2 ||
        !selectedScores.exam)
    ) {
      setError(
        "CA1, CA2 and examination scores must all be entered before submitting.",
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/teacher/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          action,
          results: [
            {
              studentId: selectedStudentId,
              ca1: selectedScores.ca1,
              ca2: selectedScores.ca2,
              exam: selectedScores.exam,
              teacherRemark: selectedScores.teacherRemark,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save result.");
      }

      const newStatus =
        action === "SUBMIT" ? "SUBMITTED" : "DRAFT";

      setStatuses((current) => ({
        ...current,
        [selectedStudentId]: newStatus,
      }));

      setMessage(
        data.message ||
          (action === "SUBMIT"
            ? "Result submitted for approval."
            : "Result saved as draft."),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid min-h-[520px] md:grid-cols-[320px_1fr]">
        {/* Student List */}
        <aside className="border-r border-school bg-school">
          <div className="border-b border-school bg-surface px-5 py-5">
            <h3 className="text-lg font-bold text-primary">
              Students
            </h3>

            <p className="mt-1 text-xs text-muted">
              Select a student to enter their result.
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student..."
                className="school-input px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted">
                No student found.
              </div>
            ) : (
              filteredStudents.map((student, index) => {
                const isSelected =
                  student.studentId === selectedStudentId;

                const status =
                  statuses[student.studentId] ?? student.status;

                return (
                  <button
                    key={student.studentId}
                    type="button"
                    onClick={() => selectStudent(student.studentId)}
                    className={`w-full border-b border-school px-5 py-4 text-left transition ${
                      isSelected
                        ? "bg-surface shadow-sm"
                        : "hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isSelected
                              ? "text-primary"
                              : "text-secondary"
                          }`}
                        >
                          {index + 1}. {student.name}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {student.admissionNo}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                          status === "SUBMITTED"
                            ? "bg-success text-white"
                            : status === "DRAFT"
                              ? "bg-warning text-white"
                              : "bg-surface text-muted"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Result Editor */}
        <section className="bg-surface">
          {!selectedStudent ? (
            <div className="flex min-h-[520px] items-center justify-center px-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-primary">
                  Select a student
                </h3>

                <p className="mt-2 text-sm text-muted">
                  Choose a student from the list to enter their result.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Student Header */}
              <div className="border-b border-school px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Student Result
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-primary">
                      {selectedStudent.name}
                    </h3>

                    <p className="mt-1 text-sm text-secondary">
                      Admission No: {selectedStudent.admissionNo}
                    </p>
                  </div>

                  <div className="rounded-lg bg-school px-4 py-3">
                    <p className="text-xs font-medium text-muted">
                      Current Status
                    </p>

                    <p className="mt-1 text-sm font-bold text-primary">
                      {statuses[selectedStudent.studentId] ??
                        selectedStudent.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                {/* Scores */}
                <div className="mb-6">
                  <h4 className="text-base font-bold text-primary">
                    Enter Scores
                  </h4>

                  <p className="mt-1 text-sm text-muted">
                    CA contributes 40 marks and the examination contributes
                    60 marks.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {/* CA1 */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-secondary">
                      CA 1
                      <span className="ml-1 text-xs font-normal text-muted">
                        /20
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.01"
                      value={selectedScores.ca1}
                      onChange={(event) =>
                        updateScore("ca1", event.target.value)
                      }
                      className={`school-input px-4 py-3 text-lg font-semibold ${
                        ca1Error
                          ? "border-danger focus:border-danger"
                          : ""
                      }`}
                    />

                    {ca1Error && (
                      <p className="mt-1 text-xs text-danger">
                        {ca1Error}
                      </p>
                    )}
                  </div>

                  {/* CA2 */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-secondary">
                      CA 2
                      <span className="ml-1 text-xs font-normal text-muted">
                        /20
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.01"
                      value={selectedScores.ca2}
                      onChange={(event) =>
                        updateScore("ca2", event.target.value)
                      }
                      className={`school-input px-4 py-3 text-lg font-semibold ${
                        ca2Error
                          ? "border-danger focus:border-danger"
                          : ""
                      }`}
                    />

                    {ca2Error && (
                      <p className="mt-1 text-xs text-danger">
                        {ca2Error}
                      </p>
                    )}
                  </div>

                  {/* Examination */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-secondary">
                      Examination
                      <span className="ml-1 text-xs font-normal text-muted">
                        /60
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.01"
                      value={selectedScores.exam}
                      onChange={(event) =>
                        updateScore("exam", event.target.value)
                      }
                      className={`school-input px-4 py-3 text-lg font-semibold ${
                        examError
                          ? "border-danger focus:border-danger"
                          : ""
                      }`}
                    />

                    {examError && (
                      <p className="mt-1 text-xs text-danger">
                        {examError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-school bg-school p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      CA Total
                    </p>

                    <p className="mt-2 text-3xl font-bold text-primary">
                      {caTotal.toFixed(2)}
                      <span className="ml-1 text-sm font-medium text-muted">
                        /40
                      </span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-school bg-school p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Total Score
                    </p>

                    <p className="mt-2 text-3xl font-bold text-primary">
                      {total.toFixed(2)}
                      <span className="ml-1 text-sm font-medium text-muted">
                        /100
                      </span>
                    </p>
                  </div>
                </div>

                {/* Teacher Remark */}
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-semibold text-secondary">
                    Teacher&apos;s Subject Remark
                  </label>

                  <textarea
                    value={selectedScores.teacherRemark}
                    onChange={(event) =>
                      updateScore("teacherRemark", event.target.value)
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Enter a remark about this student's performance..."
                    className="school-input resize-none px-4 py-3 text-sm"
                  />

                  <p className="mt-1 text-xs text-muted">
                    This remark will appear on the student&apos;s result.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-school bg-school px-6 py-5">
                {message && (
                  <div className="mb-4 rounded-lg border border-success bg-success px-4 py-3 text-sm font-semibold text-white">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded-lg border border-danger bg-danger px-4 py-3 text-sm font-semibold text-white">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">
                    Save as draft while working, or submit the result for
                    approval when complete.
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={saving || hasInvalidScore}
                      onClick={() => saveResults("DRAFT")}
                      className="rounded-lg border border-school bg-surface px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                      type="button"
                      disabled={saving || hasInvalidScore}
                      onClick={() => saveResults("SUBMIT")}
                      className="school-button px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Submit for Approval"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
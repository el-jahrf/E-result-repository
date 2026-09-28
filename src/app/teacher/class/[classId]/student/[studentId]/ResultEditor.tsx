"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type SubjectData = {
  subjectId: string;
  subjectName: string;
  ca1: string;
  ca2: string;
  exam: string;
  teacherRemark: string;
  total: string;
  grade: string;
  status: string;
};

type AffectiveRating = {
  item: string;
  rating: number;
};

type InitialData = {
  classId: string;
  studentId: string;
  term: "FIRST" | "SECOND" | "THIRD";
  subjects: SubjectData[];

  attendanceOpened: string;
  attendancePresent: string;
  attendanceAbsent: string;

  punctualityRating: string;
  classTeacherComment: string;

  affectiveRatings: AffectiveRating[];

  studentName: string;
  admissionNo: string;
  className: string;
  sessionName: string;
};

type Props = {
  initialData: InitialData;
  teacherName: string;
  hasSignature: boolean;
};

const AFFECTIVE_ITEMS = [
  "Attentiveness",
  "Neatness",
  "Cooperation",
  "Respect",
  "Leadership",
];

function calculateTotal(
  ca1: string,
  ca2: string,
  exam: string,
) {
  const first = Number(ca1);
  const second = Number(ca2);
  const examination = Number(exam);

  if (
    ca1 === "" &&
    ca2 === "" &&
    exam === ""
  ) {
    return "";
  }

  return (
    (Number.isFinite(first) ? first : 0) +
    (Number.isFinite(second) ? second : 0) +
    (Number.isFinite(examination) ? examination : 0)
  ).toFixed(2);
}

function gradeFor(total: string) {
  if (total === "") return "";

  const score = Number(total);

  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
}

export default function ResultEditor({
  initialData,
  teacherName,
  hasSignature,
}: Props) {
  const [subjects, setSubjects] = useState(
    initialData.subjects,
  );

  const [attendanceOpened, setAttendanceOpened] =
    useState(initialData.attendanceOpened);

  const [attendancePresent, setAttendancePresent] =
    useState(initialData.attendancePresent);

  const [attendanceAbsent, setAttendanceAbsent] =
    useState(initialData.attendanceAbsent);

  const [punctualityRating, setPunctualityRating] =
    useState(initialData.punctualityRating);

  const [classTeacherComment, setClassTeacherComment] =
    useState(initialData.classTeacherComment);

  const [affectiveRatings, setAffectiveRatings] =
    useState<AffectiveRating[]>(() =>
      AFFECTIVE_ITEMS.map((item) => ({
        item,
        rating:
          initialData.affectiveRatings.find(
            (rating) => rating.item === item,
          )?.rating ?? 0,
      })),
    );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const completion = useMemo(() => {
    const completed = subjects.filter(
      (subject) =>
        subject.ca1 !== "" &&
        subject.ca2 !== "" &&
        subject.exam !== "",
    ).length;

    return {
      completed,
      total: subjects.length,
      percentage:
        subjects.length > 0
          ? Math.round(
              (completed / subjects.length) * 100,
            )
          : 0,
    };
  }, [subjects]);

  function updateSubject(
    subjectId: string,
    field: keyof SubjectData,
    value: string,
  ) {
    setSubjects((current) =>
      current.map((subject) => {
        if (subject.subjectId !== subjectId) {
          return subject;
        }

        const updated = {
          ...subject,
          [field]: value,
        };

        if (
          field === "ca1" ||
          field === "ca2" ||
          field === "exam"
        ) {
          updated.total = calculateTotal(
            updated.ca1,
            updated.ca2,
            updated.exam,
          );

          updated.grade = gradeFor(updated.total);
        }

        return updated;
      }),
    );
  }

  function updateAffective(
    item: string,
    rating: string,
  ) {
    setAffectiveRatings((current) =>
      current.map((entry) =>
        entry.item === item
          ? {
              ...entry,
              rating: Number(rating),
            }
          : entry,
      ),
    );
  }

  async function save(action: "DRAFT" | "SUBMIT") {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (action === "SUBMIT") {
        const incomplete = subjects.find(
          (subject) =>
            subject.ca1 === "" ||
            subject.ca2 === "" ||
            subject.exam === "",
        );

        if (incomplete) {
          throw new Error(
            `Complete CA1, CA2 and Examination for ${incomplete.subjectName} before submitting.`,
          );
        }

        if (
          attendanceOpened === "" ||
          attendancePresent === "" ||
          attendanceAbsent === ""
        ) {
          throw new Error(
            "Complete all attendance fields before submitting.",
          );
        }
      }

      const response = await fetch(
        "/api/teacher/class-result",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: initialData.classId,
            studentId: initialData.studentId,
            term: initialData.term,
            action,

            subjects: subjects.map((subject) => ({
              subjectId: subject.subjectId,
              ca1: subject.ca1,
              ca2: subject.ca2,
              exam: subject.exam,
              teacherRemark: subject.teacherRemark,
            })),

            attendanceOpened,
            attendancePresent,
            attendanceAbsent,

            punctualityRating,
            classTeacherComment,

            affectiveRatings:
              affectiveRatings
                .filter((rating) => rating.rating > 0)
                .map((rating) => ({
                  item: rating.item,
                  rating: rating.rating,
                })),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save the result.",
        );
      }

      setMessage(data.message);

      if (action === "SUBMIT") {
        setSubjects((current) =>
          current.map((subject) => ({
            ...subject,
            status: "SUBMITTED",
          })),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the result.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Student Header */}
      <div className="school-card mb-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted">
              {initialData.sessionName} ·{" "}
              {initialData.term === "FIRST"
                ? "First"
                : initialData.term === "SECOND"
                  ? "Second"
                  : "Third"}{" "}
              Term
            </p>

            <h1 className="mt-1 text-2xl font-bold text-primary">
              {initialData.studentName}
            </h1>

            <p className="mt-1 text-sm text-secondary">
              {initialData.admissionNo} ·{" "}
              {initialData.className}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted">
              Result Completion
            </p>

            <p className="text-2xl font-bold text-primary">
              {completion.percentage}%
            </p>

            <p className="text-xs text-muted">
              {completion.completed} of{" "}
              {completion.total} subjects complete
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {message && (
        <div className="mb-6 rounded-lg border border-success bg-success px-4 py-3 text-sm font-medium text-white">
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-danger bg-danger px-4 py-3 text-sm font-medium text-white">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Academic Results */}
        <section className="school-card overflow-hidden">
          <div className="border-b border-school px-6 py-5">
            <h2 className="text-lg font-semibold text-primary">
              Academic Results
            </h2>

            <p className="mt-1 text-sm text-muted">
              CA1 and CA2 are each out of 20. Examination is
              out of 60.
            </p>
          </div>

          <div className="divide-y divide-school">
            {subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="p-6"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold text-primary">
                    {subject.subjectName}
                  </h3>

                  <span className="rounded-full bg-school px-3 py-1 text-xs font-medium text-secondary">
                    {subject.status}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-secondary">
                      CA 1 / 20
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.01"
                      value={subject.ca1}
                      onChange={(event) =>
                        updateSubject(
                          subject.subjectId,
                          "ca1",
                          event.target.value,
                        )
                      }
                      className="school-input px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-secondary">
                      CA 2 / 20
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.01"
                      value={subject.ca2}
                      onChange={(event) =>
                        updateSubject(
                          subject.subjectId,
                          "ca2",
                          event.target.value,
                        )
                      }
                      className="school-input px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-secondary">
                      Examination / 60
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.01"
                      value={subject.exam}
                      onChange={(event) =>
                        updateSubject(
                          subject.subjectId,
                          "exam",
                          event.target.value,
                        )
                      }
                      className="school-input px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-school p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Total / 100
                    </p>

                    <p className="mt-1 text-xl font-bold text-primary">
                      {subject.total || "—"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-school p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Grade
                    </p>

                    <p className="mt-1 text-xl font-bold text-primary">
                      {subject.grade || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-secondary">
                    Teacher Remark
                  </label>

                  <textarea
                    rows={2}
                    maxLength={500}
                    value={subject.teacherRemark}
                    onChange={(event) =>
                      updateSubject(
                        subject.subjectId,
                        "teacherRemark",
                        event.target.value,
                      )
                    }
                    placeholder="Enter subject remark..."
                    className="school-input px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* Attendance */}
          <section className="school-card p-6">
            <h2 className="font-semibold text-primary">
              Attendance
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">
                  School Days Opened
                </label>

                <input
                  type="number"
                  min="0"
                  value={attendanceOpened}
                  onChange={(event) =>
                    setAttendanceOpened(
                      event.target.value,
                    )
                  }
                  className="school-input px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">
                  Days Present
                </label>

                <input
                  type="number"
                  min="0"
                  value={attendancePresent}
                  onChange={(event) =>
                    setAttendancePresent(
                      event.target.value,
                    )
                  }
                  className="school-input px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">
                  Days Absent
                </label>

                <input
                  type="number"
                  min="0"
                  value={attendanceAbsent}
                  onChange={(event) =>
                    setAttendanceAbsent(
                      event.target.value,
                    )
                  }
                  className="school-input px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Class Assessment */}
          <section className="school-card p-6">
            <h2 className="font-semibold text-primary">
              Class Assessment
            </h2>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-secondary">
                Punctuality
              </label>

              <select
                value={punctualityRating}
                onChange={(event) =>
                  setPunctualityRating(
                    event.target.value,
                  )
                }
                className="school-input px-3 py-2.5 text-sm"
              >
                <option value="">Select rating</option>
                <option value="5">
                  5 - Excellent
                </option>
                <option value="4">
                  4 - Very Good
                </option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">
                  1 - Needs Improvement
                </option>
              </select>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-secondary">
                Class Teacher&apos;s General Remark
              </label>

              <textarea
                rows={4}
                maxLength={1000}
                value={classTeacherComment}
                onChange={(event) =>
                  setClassTeacherComment(
                    event.target.value,
                  )
                }
                placeholder="Enter the overall remark..."
                className="school-input px-3 py-2.5 text-sm"
              />
            </div>

            <div className="mt-4 rounded-lg bg-school p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Class Teacher Signature
              </p>

              <p className="mt-1 text-sm font-semibold text-primary">
                {teacherName}
              </p>

              <p
                className={`mt-1 text-xs ${
                  hasSignature
                    ? "text-success"
                    : "text-warning"
                }`}
              >
                {hasSignature
                  ? "Signature configured."
                  : "Signature not configured."}
              </p>
            </div>
          </section>

          {/* Affective Assessment */}
          <section className="school-card p-6">
            <h2 className="font-semibold text-primary">
              Behaviour / Affective Assessment
            </h2>

            <p className="mt-1 text-xs text-muted">
              Rate each item from 1 to 5.
            </p>

            <div className="mt-4 space-y-4">
              {affectiveRatings.map((rating) => (
                <div key={rating.item}>
                  <label className="mb-1 block text-sm font-medium text-secondary">
                    {rating.item}
                  </label>

                  <select
                    value={
                      rating.rating
                        ? String(rating.rating)
                        : ""
                    }
                    onChange={(event) =>
                      updateAffective(
                        rating.item,
                        event.target.value,
                      )
                    }
                    className="school-input px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select rating
                    </option>
                    <option value="5">
                      5 - Excellent
                    </option>
                    <option value="4">
                      4 - Very Good
                    </option>
                    <option value="3">
                      3 - Good
                    </option>
                    <option value="2">
                      2 - Fair
                    </option>
                    <option value="1">
                      1 - Needs Improvement
                    </option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Actions */}
      <div className="school-card mt-6 flex flex-col gap-3 p-6 sm:flex-row sm:justify-end">
        <Link
          href={`/teacher/class/${initialData.classId}?term=${initialData.term}`}
          className="rounded-lg border border-school px-5 py-3 text-center text-sm font-medium text-secondary transition hover:bg-school"
        >
          Back to Students
        </Link>

        <button
          type="button"
          disabled={saving}
          onClick={() => save("DRAFT")}
          className="rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => save("SUBMIT")}
          className="school-button px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Processing..." : "Submit Result"}
        </button>
      </div>
    </>
  );
}
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RatingKey =
  | "Attentiveness"
  | "Neatness"
  | "Cooperation"
  | "Respect"
  | "Leadership";

type Props = {
  classId: string;
  studentId: string;
  term: "FIRST" | "SECOND" | "THIRD";
  sessionId: string;
  sessionName: string;
  className: string;
  studentName: string;
  admissionNo: string;
  teacherName: string;
  signatureUrl: string | null;
  signatureData: string | null;
  attendanceOpened: string;
  attendancePresent: string;
  attendanceAbsent: string;
  punctualityRating: string;
  formMasterRemark: string;
  affectiveRatings: Record<RatingKey, number>;
};

const RATING_ITEMS: RatingKey[] = [
  "Attentiveness",
  "Neatness",
  "Cooperation",
  "Respect",
  "Leadership",
];

export default function FormMasterEditor({
  classId,
  studentId,
  term,
  sessionId,
  sessionName,
  className,
  studentName,
  admissionNo,
  teacherName,
  signatureUrl,
  signatureData,
  attendanceOpened: initialOpened,
  attendancePresent: initialPresent,
  attendanceAbsent: initialAbsent,
  punctualityRating: initialPunctuality,
  formMasterRemark: initialRemark,
  affectiveRatings: initialRatings,
}: Props) {
  const router = useRouter();

  const [attendanceOpened, setAttendanceOpened] =
    useState(initialOpened);

  const [attendancePresent, setAttendancePresent] =
    useState(initialPresent);

  const [attendanceAbsent, setAttendanceAbsent] =
    useState(initialAbsent);

  const [punctualityRating, setPunctualityRating] =
    useState(initialPunctuality);

  const [formMasterRemark, setFormMasterRemark] =
    useState(initialRemark);

  const [ratings, setRatings] = useState(
    initialRatings,
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const attendancePercentage = useMemo(() => {
    const opened = Number(attendanceOpened);
    const present = Number(attendancePresent);

    if (
      !Number.isFinite(opened) ||
      !Number.isFinite(present) ||
      opened <= 0 ||
      present < 0
    ) {
      return "";
    }

    const percentage = Math.min(
      100,
      Math.max(0, (present / opened) * 100),
    );

    return percentage.toFixed(2);
  }, [attendanceOpened, attendancePresent]);

  function updateRating(
    item: RatingKey,
    value: number,
  ) {
    setRatings((current) => ({
      ...current,
      [item]: value,
    }));
  }

  async function saveAssessment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const opened = Number(attendanceOpened);
      const present = Number(attendancePresent);
      const absent = Number(attendanceAbsent);

      if (
        !Number.isInteger(opened) ||
        opened < 0
      ) {
        throw new Error(
          "Enter a valid number of school days opened.",
        );
      }

      if (
        !Number.isInteger(present) ||
        present < 0 ||
        present > opened
      ) {
        throw new Error(
          "Days present cannot be greater than days school was opened.",
        );
      }

      if (
        !Number.isInteger(absent) ||
        absent < 0 ||
        absent > opened
      ) {
        throw new Error(
          "Days absent cannot be greater than days school was opened.",
        );
      }

      if (present + absent > opened) {
        throw new Error(
          "Days present and absent cannot exceed days school was opened.",
        );
      }

      const punctuality =
        punctualityRating === ""
          ? null
          : Number(punctualityRating);

      if (
        punctuality !== null &&
        (!Number.isInteger(punctuality) ||
          punctuality < 1 ||
          punctuality > 5)
      ) {
        throw new Error(
          "Punctuality must be between 1 and 5.",
        );
      }

      const response = await fetch(
        "/api/teacher/form-master",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            studentId,
            sessionId,
            term,
            attendanceOpened: opened,
            attendancePresent: present,
            attendanceAbsent: absent,
            punctualityRating: punctuality,
            formMasterRemark,
            affectiveRatings: RATING_ITEMS.map(
              (item) => ({
                item,
                rating: ratings[item],
              }),
            ),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save Form Master assessment.",
        );
      }

      setMessage(
        "Form Master assessment saved successfully.",
      );

      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save assessment.",
      );
    } finally {
      setSaving(false);
    }
  }

  const signature =
    signatureUrl || signatureData;

  const termLabel =
    term === "FIRST"
      ? "First Term"
      : term === "SECOND"
        ? "Second Term"
        : "Third Term";

  return (
    <main className="min-h-screen bg-school">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/teacher/class/${classId}?term=${term}`,
                )
              }
              className="text-secondary transition hover:text-primary"
            >
              Form Class
            </button>

            <span>/</span>

            <span>Student Assessment</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Form Master Assessment
          </h1>

          <p className="mt-1 text-secondary">
            Complete the attendance, punctuality,
            behaviour and general assessment for this
            student.
          </p>
        </div>

        {/* Student Information */}
        <section className="school-card mb-6 p-6">
          <div className="grid gap-5 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Student
              </p>

              <p className="mt-1 font-bold text-primary">
                {studentName}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Admission No.
              </p>

              <p className="mt-1 font-semibold text-secondary">
                {admissionNo}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Class
              </p>

              <p className="mt-1 font-semibold text-secondary">
                {className}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Term
              </p>

              <p className="mt-1 font-semibold text-secondary">
                {termLabel} · {sessionName}
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={saveAssessment}
          className="space-y-6"
        >
          {/* Attendance */}
          <section className="school-card">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-xl font-bold text-primary">
                Attendance
              </h2>

              <p className="mt-1 text-sm text-muted">
                Record the student's attendance for the term.
              </p>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="text-sm font-semibold text-secondary">
                  Days School Opened
                </span>

                <input
                  type="number"
                  min="0"
                  value={attendanceOpened}
                  onChange={(event) =>
                    setAttendanceOpened(
                      event.target.value,
                    )
                  }
                  className="school-input mt-2 px-4 py-3 text-base"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-secondary">
                  Days Present
                </span>

                <input
                  type="number"
                  min="0"
                  value={attendancePresent}
                  onChange={(event) =>
                    setAttendancePresent(
                      event.target.value,
                    )
                  }
                  className="school-input mt-2 px-4 py-3 text-base"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-secondary">
                  Days Absent
                </span>

                <input
                  type="number"
                  min="0"
                  value={attendanceAbsent}
                  onChange={(event) =>
                    setAttendanceAbsent(
                      event.target.value,
                    )
                  }
                  className="school-input mt-2 px-4 py-3 text-base"
                />
              </label>

              <div className="rounded-lg bg-school px-4 py-3">
                <p className="text-sm font-semibold text-secondary">
                  Attendance %
                </p>

                <p className="mt-2 text-2xl font-bold text-primary">
                  {attendancePercentage
                    ? `${attendancePercentage}%`
                    : "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Punctuality */}
          <section className="school-card">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-xl font-bold text-primary">
                Punctuality
              </h2>

              <p className="mt-1 text-sm text-muted">
                Rate the student's punctuality from 1 to 5.
              </p>
            </div>

            <div className="p-6">
              <select
                value={punctualityRating}
                onChange={(event) =>
                  setPunctualityRating(
                    event.target.value,
                  )
                }
                className="school-input max-w-md px-4 py-3 text-base"
              >
                <option value="">
                  Select punctuality rating
                </option>

                <option value="5">
                  5 — Excellent
                </option>

                <option value="4">
                  4 — Very Good
                </option>

                <option value="3">
                  3 — Good
                </option>

                <option value="2">
                  2 — Fair
                </option>

                <option value="1">
                  1 — Needs Improvement
                </option>
              </select>
            </div>
          </section>

          {/* Behaviour */}
          <section className="school-card">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-xl font-bold text-primary">
                Behaviour & Affective Assessment
              </h2>

              <p className="mt-1 text-sm text-muted">
                Rate each area from 1 to 5.
              </p>
            </div>

            <div className="divide-y divide-school">
              {RATING_ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-primary">
                      {item}
                    </p>

                    <p className="text-xs text-muted">
                      1 = Needs Improvement · 5 = Excellent
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            updateRating(
                              item,
                              value,
                            )
                          }
                          className={`h-11 w-11 rounded-lg border text-sm font-bold transition ${
                            ratings[item] === value
                              ? "border-primary bg-primary text-white"
                              : "border-school bg-surface text-secondary hover:bg-school"
                          }`}
                        >
                          {value}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Form Master Remark */}
          <section className="school-card">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-xl font-bold text-primary">
                Form Master Remark
              </h2>

              <p className="mt-1 text-sm text-muted">
                Give a general comment about the student's
                conduct and overall progress.
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={formMasterRemark}
                onChange={(event) =>
                  setFormMasterRemark(
                    event.target.value,
                  )
                }
                maxLength={500}
                rows={5}
                placeholder="Enter the Form Master's general remark..."
                className="school-input px-4 py-3 text-base"
              />

              <p className="mt-2 text-right text-xs text-muted">
                {formMasterRemark.length}/500
              </p>
            </div>
          </section>

          {/* Signature */}
          <section className="school-card">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-xl font-bold text-primary">
                Form Master Signature
              </h2>

              <p className="mt-1 text-sm text-muted">
                Your saved teacher signature will automatically
                appear on the student's report.
              </p>
            </div>

            <div className="p-6">
              {signature ? (
                <div className="inline-flex min-h-24 min-w-64 items-center justify-center rounded-lg border border-school bg-school p-5">
                  <img
                    src={signature}
                    alt="Form Master signature"
                    className="max-h-20 max-w-56 object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-warning bg-school p-4 text-sm text-warning">
                  No signature has been saved to your teacher
                  profile yet.
                </div>
              )}

              <p className="mt-3 text-sm text-muted">
                {teacherName}
              </p>
            </div>
          </section>

          {/* Messages */}
          {message && (
            <div
              role="status"
              className="rounded-lg border border-success bg-success px-4 py-3 text-sm font-medium text-white"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger bg-danger px-4 py-3 text-sm font-medium text-white"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/teacher/class/${classId}?term=${term}`,
                )
              }
              className="rounded-lg border border-school bg-surface px-6 py-3 text-sm font-semibold text-secondary transition hover:bg-school"
            >
              Back to Students
            </button>

            <button
              type="submit"
              disabled={saving}
              className="school-button px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Form Master Assessment"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
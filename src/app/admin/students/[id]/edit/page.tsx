"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type StudentData = {
  id: string;
  admissionNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string | null;
  photoData: string | null;
  isActive: boolean;
};

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();

  const studentId = String(params.id);

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    admissionNo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    password: "",
    isActive: true,
  });

  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");

  useEffect(() => {
    async function loadStudent() {
      try {
        const response = await fetch(
          `/api/admin/students/${studentId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load student.");
        }

        const loadedStudent = data.student as StudentData;

        setStudent(loadedStudent);

        setForm({
          admissionNo: loadedStudent.admissionNo,
          firstName: loadedStudent.firstName,
          middleName: loadedStudent.middleName || "",
          lastName: loadedStudent.lastName,
          gender: loadedStudent.gender,
          dateOfBirth: loadedStudent.dateOfBirth
            ? loadedStudent.dateOfBirth.slice(0, 10)
            : "",
          password: "",
          isActive: loadedStudent.isActive,
        });

        setPhotoData(loadedStudent.photoData || null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load student."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [studentId]);

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Passport photograph must be JPG, PNG or WebP.");
      return;
    }

    const maxSize = 1.5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Passport photograph must not exceed 1.5MB.");
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

    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoData(null);
    setPhotoName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        id: studentId,
        admissionNo: form.admissionNo,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        photoData,
        isActive: form.isActive,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update student."
        );
      }

      setSuccess("Student updated successfully.");

      setTimeout(() => {
        router.push(`/admin/students/${studentId}`);
        router.refresh();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update student."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading student information...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              Student not found
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {error || "The requested student could not be found."}
            </p>

            <Link
              href="/admin/students"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            >
              Back to Students
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2 text-sm text-gray-500">
              Admin Dashboard / Students / Edit Student
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Edit Student
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update the student&apos;s personal information, passport
              photograph, account status, or password.
            </p>
          </div>

          <Link
            href={`/admin/students/${studentId}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Profile
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Passport Photograph
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              JPG, PNG or WebP. Maximum size: 1.5MB.
            </p>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                {photoData ? (
                  <img
                    src={photoData}
                    alt="Student passport"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-4 text-center text-xs text-gray-400">
                    No passport photo
                  </span>
                )}
              </div>

              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-600"
                />

                {photoName && (
                  <p className="mt-2 text-xs text-gray-500">
                    Selected: {photoName}
                  </p>
                )}

                {photoData && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove passport photo
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Student Information
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Admission Number
                </label>

                <input
                  value={form.admissionNo}
                  onChange={(e) =>
                    updateField("admissionNo", e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Gender
                </label>

                <select
                  value={form.gender}
                  onChange={(e) =>
                    updateField("gender", e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  First Name
                </label>

                <input
                  value={form.firstName}
                  onChange={(e) =>
                    updateField("firstName", e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Middle Name
                </label>

                <input
                  value={form.middleName}
                  onChange={(e) =>
                    updateField("middleName", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Last Name
                </label>

                <input
                  value={form.lastName}
                  onChange={(e) =>
                    updateField("lastName", e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    updateField("dateOfBirth", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Student Login
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The student logs in using their admission number.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Login ID
                </label>

                <input
                  value={form.admissionNo}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Login ID is the admission number.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    updateField("password", e.target.value)
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Leave blank if you do not want to change the password.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Account Status
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  updateField("isActive", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />

              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Student account is active
              </label>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              An inactive student cannot log in.
            </p>
          </section>

          {(error || success) && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {error || success}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/admin/students/${studentId}`}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
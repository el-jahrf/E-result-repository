"use client";

import { useState } from "react";

type Props = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
};

export default function TeacherPasswordReset({
  teacherId,
  teacherName,
  teacherEmail,
}: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function close() {
    if (loading) return;

    setOpen(false);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setError("");
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Temporary password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          teacherId,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to reset teacher password.",
        );
      }

      setMessage(
        "Password reset successfully. The teacher must create a new password when they log in.",
      );

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reset teacher password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Reset Password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">
                    Reset Teacher Password
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Set a temporary password for this teacher.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="text-xl leading-none text-gray-400 hover:text-gray-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleReset} className="px-6 py-6">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {teacherName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {teacherEmail}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor={`reset-password-${teacherId}`}
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    Temporary Password
                  </label>

                  <input
                    id={`reset-password-${teacherId}`}
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    minLength={6}
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={`confirm-reset-password-${teacherId}`}
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    Confirm Temporary Password
                  </label>

                  <input
                    id={`confirm-reset-password-${teacherId}`}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    minLength={6}
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    placeholder="Enter it again"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
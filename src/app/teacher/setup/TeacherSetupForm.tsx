"use client";

import { useRef, useState } from "react";

type TeacherSetupFormProps = {
  teacher: {
    firstName: string;
    lastName: string;
    staffNo: string;
    email: string;
  };
};

export default function TeacherSetupForm({
  teacher,
}: TeacherSetupFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getCanvasPoint = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const point = getCanvasPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);

    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#2B211C";

    setDrawing(true);
    setHasSignature(true);
  };

  const draw = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (!drawing) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const point = getCanvasPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    setDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    setHasSignature(false);
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Your new password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (!hasSignature) {
      setError("Please provide your signature.");
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      setError("Unable to read your signature.");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");

    setSaving(true);

    try {
      const response = await fetch("/api/teacher/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          signatureData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to complete account setup.",
        );
      }

      window.location.href = "/teacher";
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
    <form
      onSubmit={handleSubmit}
      className="school-card overflow-hidden"
    >
      <div className="border-b border-school px-6 py-5">
        <h2 className="text-lg font-bold text-primary">
          Teacher Information
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Name
            </p>

            <p className="mt-1 font-semibold text-primary">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Staff Number
            </p>

            <p className="mt-1 font-semibold text-primary">
              {teacher.staffNo}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Email
            </p>

            <p className="mt-1 font-semibold text-primary">
              {teacher.email}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-6 py-6">
        <div>
          <h3 className="font-bold text-primary">
            Create Your Password
          </h3>

          <p className="mt-1 text-sm text-muted">
            Choose a password you will use for future teacher portal
            logins.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">
                New Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={8}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="school-input px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={8}
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="school-input px-4 py-3"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-bold text-primary">
                Your Signature
              </h3>

              <p className="mt-1 text-sm text-muted">
                Draw your signature below. It will be saved to your teacher
                profile and used on your result sheets.
              </p>
            </div>

            <button
              type="button"
              onClick={clearSignature}
              className="w-fit text-sm font-semibold text-secondary transition hover:text-primary"
            >
              Clear Signature
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-school bg-surface">
            <canvas
              ref={canvasRef}
              width={1000}
              height={300}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className="h-56 w-full touch-none cursor-crosshair"
            />
          </div>

          <p className="mt-2 text-xs text-muted">
            Use your mouse, trackpad, touchscreen, or stylus to sign.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-danger bg-danger px-4 py-3 text-sm font-semibold text-white">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="school-button w-full px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Completing Setup..."
            : "Complete Teacher Setup"}
        </button>

        <p className="text-center text-xs leading-5 text-muted">
          You must complete this setup before accessing your teacher
          dashboard.
        </p>
      </div>
    </form>
  );
}
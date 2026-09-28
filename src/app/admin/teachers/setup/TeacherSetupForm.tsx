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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getCanvasCoordinates = (
    event:
      | React.PointerEvent<HTMLCanvasElement>
      | React.MouseEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
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

    const { x, y } = getCanvasCoordinates(event);

    context.beginPath();
    context.moveTo(x, y);

    setIsDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
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

    const { x, y } = getCanvasCoordinates(event);

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) {
      return;
    }

    setIsDrawing(false);

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    setSignatureData(canvas.toDataURL("image/png"));
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
    setSignatureData("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!signatureData) {
      setError("Please provide your signature.");
      return;
    }

    setLoading(true);

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
        setError(data.error || "Unable to complete account setup.");
        setLoading(false);
        return;
      }

      window.location.href = "/teacher";
    } catch {
      setError(
        "Something went wrong while completing your account setup.",
      );
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Teacher Information
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="mt-1 font-semibold text-gray-950">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Staff Number</p>
            <p className="mt-1 font-semibold text-gray-950">
              {teacher.staffNo}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">Email</p>
            <p className="mt-1 font-semibold text-gray-950">
              {teacher.email}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-900"
          >
            Create Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-gray-900"
          >
            Confirm Password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            minLength={8}
            required
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            placeholder="Enter the same password again"
          />
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your Signature
              </label>

              <p className="mt-1 text-xs text-gray-500">
                Draw your normal signature inside the box. It will be used
                on your students&apos; result sheets.
              </p>
            </div>

            <button
              type="button"
              onClick={clearSignature}
              className="text-sm font-medium text-gray-600 hover:text-gray-950"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-gray-300 bg-white">
            <canvas
              ref={canvasRef}
              width={900}
              height={260}
              className="block h-52 w-full touch-none cursor-crosshair bg-white"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Use your mouse or touchpad to draw your signature.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Completing Setup..." : "Complete Teacher Setup"}
        </button>
      </div>
    </form>
  );
}
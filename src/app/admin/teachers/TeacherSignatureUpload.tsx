"use client";

import { useRef, useState } from "react";

type TeacherSignatureUploadProps = {
  teacherId: string;
  teacherName: string;
  signatureData: string | null;
};

export default function TeacherSignatureUpload({
  teacherId,
  teacherName,
  signatureData,
}: TeacherSignatureUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [signature, setSignature] = useState<string | null>(signatureData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSignature(data: string | null) {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId,
          signatureData: data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save signature.");
      }

      setSignature(data);
      setMessage(
        data
          ? "Signature saved."
          : "Signature removed."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save signature."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);
    setError(null);

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a PNG, JPEG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError("Signature image must be smaller than 1.5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setError("Could not read the signature image.");
        return;
      }

      await saveSignature(result);
      event.target.value = "";
    };

    reader.onerror = () => {
      setError("Could not read the signature image.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  async function handleRemove() {
    await saveSignature(null);
  }

  return (
    <div className="min-w-[220px]">
      {signature ? (
        <div className="space-y-2">
          <div className="flex h-14 w-36 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
            <img
              src={signature}
              alt={`${teacherName} signature`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Replace"}
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Upload Signature"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {message && (
        <p className="mt-1 text-xs text-emerald-600">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-1 max-w-[220px] text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
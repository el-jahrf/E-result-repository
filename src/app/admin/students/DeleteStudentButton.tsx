"use client";

import { useState } from "react";

type DeleteStudentButtonProps = {
  studentId: string;
  studentName: string;
};

export default function DeleteStudentButton({
  studentId,
  studentName,
}: DeleteStudentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${studentName}?\n\nThis will permanently remove the student and their result/enrollment records. This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete student.");
      }

      window.location.reload();
    } catch (error) {
      console.error("Delete student error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete student. Please try again."
      );

      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
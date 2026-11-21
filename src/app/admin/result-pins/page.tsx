"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";
import SchoolLogo from "@/components/SchoolLogo";

type Student = {
  id: string;
  admissionNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  isActive: boolean;
};

type AcademicSession = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type SchoolClass = {
  id: string;
  name: string;
  level: string;
  arm: string | null;
  stream: string | null;
  section: string;
};

type ResultPin = {
  id: string;
  pin: string;
  studentId: string;
  sessionId: string;
  term: "FIRST" | "SECOND" | "THIRD";
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    enrollments: {
      class: SchoolClass;
    }[];
  };
  session: {
    id: string;
    name: string;
  };
};

type GenerationMode = "student" | "class" | "all";

const terms = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
];

function studentName(student: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

function className(item: SchoolClass) {
  return [item.name, item.arm, item.stream]
    .filter(Boolean)
    .join(" ");
}

function getPinClass(pin: ResultPin) {
  return pin.student.enrollments?.[0]?.class || null;
}

function getClassLabel(pin: ResultPin) {
  const item = getPinClass(pin);
  return item ? className(item) : "Unassigned";
}

function cleanFilename(value: string) {
  return value.replace(/[^a-z0-9-_]/gi, "-");
}

async function generatePinPdf(
  pins: ResultPin[],
  sessionName: string,
  termLabel: string
) {
  if (!pins.length) {
    throw new Error("There are no PINs to export.");
  }

  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await pdf.embedFont(StandardFonts.CourierBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 28;
  const gap = 12;
  const columns = 2;
  const rows = 4;

  const cardWidth = (pageWidth - margin * 2 - gap) / columns;
  const cardHeight = (pageHeight - margin * 2 - gap * 3) / rows;

  const brown = rgb(0.29, 0.17, 0.125);
  const secondary = rgb(0.48, 0.31, 0.22);
  const cream = rgb(0.97, 0.945, 0.905);
  const border = rgb(0.78, 0.66, 0.47);
  const white = rgb(1, 1, 1);

  for (let index = 0; index < pins.length; index++) {
    if (index % 8 === 0) {
      pdf.addPage([pageWidth, pageHeight]);
    }

    const page = pdf.getPages()[pdf.getPageCount() - 1];

    const position = index % 8;
    const column = position % columns;
    const row = Math.floor(position / columns);

    const x = margin + column * (cardWidth + gap);
    const y =
      pageHeight -
      margin -
      (row + 1) * cardHeight -
      row * gap;

    const pin = pins[index];
    const student = pin.student;

    page.drawRectangle({
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      color: white,
      borderColor: border,
      borderWidth: 1.2,
    });

    page.drawRectangle({
      x,
      y: y + cardHeight - 53,
      width: cardWidth,
      height: 53,
      color: cream,
    });

    page.drawText("RISING FOUNDATION ACADEMY", {
      x: x + 12,
      y: y + cardHeight - 22,
      size: 10,
      font: boldFont,
      color: brown,
      maxWidth: cardWidth - 24,
    });

    page.drawText("STUDENT RESULT ACCESS PIN", {
      x: x + 12,
      y: y + cardHeight - 38,
      size: 7,
      font: boldFont,
      color: secondary,
    });

    page.drawText("RESULT PIN", {
      x: x + cardWidth - 64,
      y: y + cardHeight - 50,
      size: 6,
      font: boldFont,
      color: secondary,
    });

    const details = [
      ["Student", studentName(student)],
      ["Admission No.", student.admissionNo],
      ["Class", getClassLabel(pin)],
      ["Session", pin.session.name || sessionName],
      ["Term", termLabel],
    ];

    let detailY = y + cardHeight - 76;

    for (const [label, value] of details) {
      page.drawText(`${label}:`, {
        x: x + 12,
        y: detailY,
        size: 7,
        font: boldFont,
        color: secondary,
      });

      page.drawText(value.slice(0, 42), {
        x: x + 82,
        y: detailY,
        size: 7,
        font: regularFont,
        color: brown,
        maxWidth: cardWidth - 94,
      });

      detailY -= 17;
    }

    const pinBoxY = y + 35;

    page.drawRectangle({
      x: x + 12,
      y: pinBoxY,
      width: cardWidth - 24,
      height: 48,
      color: cream,
      borderColor: border,
      borderWidth: 0.8,
    });

    page.drawText("YOUR RESULT PIN", {
      x: x + 12,
      y: pinBoxY + 34,
      size: 6.5,
      font: boldFont,
      color: secondary,
      maxWidth: cardWidth - 24,
    });

    page.drawText(pin.pin, {
      x: x + 12,
      y: pinBoxY + 12,
      size: 15,
      font: monoFont,
      color: brown,
      maxWidth: cardWidth - 24,
    });

    page.drawText(`Maximum uses: ${pin.maxUses}`, {
      x: x + 12,
      y: y + 23,
      size: 6.5,
      font: regularFont,
      color: secondary,
    });

    page.drawText("Keep this PIN secure.", {
      x: x + 12,
      y: y + 10,
      size: 6,
      font: regularFont,
      color: secondary,
    });
  }

  const bytes = await pdf.save();

  const blob = new Blob([bytes as BlobPart], {
    type: "application/pdf",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `RFA-Result-PINs-${cleanFilename(
    sessionName
  )}-${cleanFilename(termLabel)}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function Icon({
  name,
}: {
  name:
    | "dashboard"
    | "students"
    | "teachers"
    | "classes"
    | "subjects"
    | "enrollment"
    | "results"
    | "pin"
    | "assignments";
}) {
  const common = {
    className: "h-5 w-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    students: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
    teachers: (
      <>
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
        <path d="M19 8v6M16 11h6" />
      </>
    ),
    classes: (
      <>
        <path d="M3 21h18M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
    subjects: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    enrollment: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M16 11h6" />
      </>
    ),
    results: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </>
    ),
    pin: (
      <>
        <path d="M21 10H3M7 6h10l1 4H6l1-4Z" />
        <path d="M8 14h8M10 18h4M12 10v10" />
      </>
    ),
    assignments: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "Students", href: "/admin/students", icon: "students" },
  { name: "Teachers", href: "/admin/teachers", icon: "teachers" },
  { name: "Classes", href: "/admin/classes", icon: "classes" },
  { name: "Subjects", href: "/admin/subjects", icon: "subjects" },
  { name: "Enrollment", href: "/admin/enrollments/new", icon: "enrollment" },
  { name: "Results", href: "/admin/results", icon: "results" },
  { name: "Result PINs", href: "/admin/result-pins", icon: "pin" },
  { name: "Assignments", href: "/admin/assignments", icon: "assignments" },
] as const;

export default function ResultPinsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [resultPins, setResultPins] = useState<ResultPin[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [term, setTerm] = useState("FIRST");

  const [mode, setMode] = useState<GenerationMode>("student");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [maxUses, setMaxUses] = useState("5");

  const [studentSearch, setStudentSearch] = useState("");
  const [pinSearch, setPinSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPinId, setExportingPinId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [studentsResponse, sessionsResponse, classesResponse] =
        await Promise.all([
          fetch("/api/admin/students"),
          fetch("/api/admin/sessions"),
          fetch("/api/admin/result-pins/classes"),
        ]);

      const [studentsData, sessionsData, classesData] =
        await Promise.all([
          studentsResponse.json(),
          sessionsResponse.json(),
          classesResponse.json(),
        ]);

      if (!studentsResponse.ok || !studentsData.success) {
        throw new Error(studentsData.error || "Failed to load students.");
      }

      if (!sessionsResponse.ok || !sessionsData.success) {
        throw new Error(sessionsData.error || "Failed to load sessions.");
      }

      if (!classesResponse.ok || !classesData.success) {
        throw new Error(classesData.error || "Failed to load classes.");
      }

      setStudents(studentsData.students || []);
      setSessions(sessionsData.sessions || []);
      setClasses(classesData.classes || []);

      const currentSession =
        sessionsData.sessions?.find(
          (item: AcademicSession) => item.isCurrent
        ) || sessionsData.sessions?.[0];

      if (currentSession) {
        setSessionId(currentSession.id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load page data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPins() {
    if (!sessionId) {
      setResultPins([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/result-pins?sessionId=${encodeURIComponent(
          sessionId
        )}&term=${encodeURIComponent(term)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load result PINs.");
      }

      setResultPins(data.resultPins || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load result PINs."
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPins();
  }, [sessionId, term]);

  async function generatePins() {
    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/result-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: mode === "student" ? studentId : undefined,
          classId: mode === "class" ? classId : undefined,
          sessionId,
          term,
          mode,
          maxUses: Number(maxUses) || 5,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate PINs.");
      }

      setMessage(
        `Done. ${data.createdCount} new PIN${
          data.createdCount === 1 ? "" : "s"
        } generated${
          data.existingCount
            ? `; ${data.existingCount} existing PIN${
                data.existingCount === 1 ? "" : "s"
              } kept.`
            : "."
        }`
      );

      await loadPins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate PINs."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function togglePin(pin: ResultPin) {
    try {
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/result-pins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pin.id,
          isActive: !pin.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update PIN.");
      }

      await loadPins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update PIN."
      );
    }
  }

  const selectedSession = sessions.find(
    (item) => item.id === sessionId
  );

  const termLabel =
    terms.find((item) => item.value === term)?.label || "First Term";

  const filteredPins = useMemo(() => {
    const query = pinSearch.trim().toLowerCase();

    return resultPins.filter((pin) => {
      if (!query) return true;

      return (
        pin.pin.toLowerCase().includes(query) ||
        pin.student.admissionNo.toLowerCase().includes(query) ||
        studentName(pin.student).toLowerCase().includes(query) ||
        getClassLabel(pin).toLowerCase().includes(query)
      );
    });
  }, [resultPins, pinSearch]);

  const activePins = filteredPins.filter((pin) => pin.isActive);

  const displayedPins = useMemo(() => {
    if (selectedClass === "ALL") return filteredPins;

    if (selectedClass === "UNASSIGNED") {
      return filteredPins.filter((pin) => !getPinClass(pin));
    }

    return filteredPins.filter(
      (pin) => getPinClass(pin)?.id === selectedClass
    );
  }, [filteredPins, selectedClass]);

  const groupedClasses = useMemo(() => {
    const groups = new Map<string, number>();

    filteredPins.forEach((pin) => {
      const item = getPinClass(pin);
      const key = item?.id || "UNASSIGNED";
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return groups;
  }, [filteredPins]);

  const filteredStudents = students.filter((student) => {
    if (!student.isActive) return false;

    const query = studentSearch.trim().toLowerCase();

    return (
      !query || student.admissionNo.toLowerCase().includes(query)
    );
  });

  const filteredClasses = classes.filter((item) => {
    const query = classSearch.trim().toLowerCase();
    return !query || className(item).toLowerCase().includes(query);
  });

  async function downloadPdf(pins: ResultPin[], single = false) {
    if (!pins.length) {
      setError("There are no active PINs to download.");
      return;
    }

    try {
      setError("");
      setMessage("");

      if (single) {
        setExportingPinId(pins[0].id);
      } else {
        setExporting(true);
      }

      await generatePinPdf(
        pins,
        selectedSession?.name || "Academic-Session",
        termLabel
      );

      setMessage(
        single
          ? "The scratch card PDF has been generated."
          : `${pins.length} scratch cards have been exported to PDF.`
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the PDF file."
      );
    } finally {
      setExporting(false);
      setExportingPinId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F1E7] p-6 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#C8A878] bg-[#FFFCF7] p-8">
          <p className="text-sm font-semibold text-[#7A5038]">
            Loading Result PIN management...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F1E7] text-[#2B211C]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#C8A878] bg-[#FFFCF7] lg:flex">
          <div className="flex h-20 items-center gap-3 border-b border-[#C8A878] px-5">
            <SchoolLogo
              size={48}
              className="rounded-lg bg-white"
              imageClassName="object-contain"
            />

            <div>
              <h1 className="text-sm font-extrabold text-[#2B211C]">
                RISING FOUNDATION
              </h1>
              <p className="text-xs font-semibold tracking-widest text-[#7A5038]">
                ACADEMY
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {navigation.map((item) => {
              const active = item.name === "Result PINs";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[#4A2C20] text-white"
                      : "text-[#7A5038] hover:bg-[#EFE3D0]"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#C8A878] p-4">
            <div className="rounded-xl border border-[#C8A878] bg-[#F7F1E7] p-4">
              <p className="text-[10px] font-bold tracking-wider text-[#7A5038]">
                CURRENT SESSION
              </p>
              <p className="mt-1 text-sm font-bold text-[#2B211C]">
                {selectedSession?.name || "No current session"}
              </p>
              <p className="mt-1 text-xs text-[#7A5038]">
                Result PIN Management
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-20 items-center justify-between border-b border-[#C8A878] bg-[#FFFCF7] px-5 py-4 lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A5038]">
                Administration
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#2B211C]">
                Result PINs
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4A2C20] text-sm font-bold text-white">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold">Admin</p>
                <p className="text-xs text-[#7A5038]">Administrator</p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-6 lg:p-10">
            <div className="mx-auto max-w-7xl space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#7A5038]">
                  Student Result Access
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Result PIN Management
                </h1>
                <p className="mt-2 text-sm text-[#7A5038]">
                  Generate, organise and export student result access PINs.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </div>
              )}

              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: "Total PINs",
                    value: resultPins.length,
                  },
                  {
                    label: "Active PINs",
                    value: resultPins.filter((pin) => pin.isActive).length,
                  },
                  {
                    label: "Inactive PINs",
                    value: resultPins.filter((pin) => !pin.isActive).length,
                  },
                  {
                    label: "Classes with PINs",
                    value: groupedClasses.size,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#C8A878] bg-[#FFFCF7] p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold text-[#7A5038]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#4A2C20]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#C8A878] bg-[#FFFCF7] shadow-sm">
                <div className="border-b border-[#C8A878] bg-[#F7F1E7] px-5 py-5 sm:px-6">
                  <h2 className="font-bold">Generate Result PINs</h2>
                  <p className="mt-1 text-xs text-[#7A5038]">
                    Each PIN contains 15 numbers.
                  </p>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4A2C20]">
                      Academic Session
                    </label>
                    <select
                      value={sessionId}
                      onChange={(event) => setSessionId(event.target.value)}
                      className="w-full rounded-xl border border-[#C8A878] bg-white px-3 py-3 text-sm text-[#4A2C20] outline-none focus:ring-1 focus:ring-[#C8A878]"
                    >
                      {sessions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.isCurrent ? " (Current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4A2C20]">
                      Term
                    </label>
                    <select
                      value={term}
                      onChange={(event) => setTerm(event.target.value)}
                      className="w-full rounded-xl border border-[#C8A878] bg-white px-3 py-3 text-sm text-[#4A2C20] outline-none focus:ring-1 focus:ring-[#C8A878]"
                    >
                      {terms.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4A2C20]">
                      Generate For
                    </label>
                    <select
                      value={mode}
                      onChange={(event) => {
                        setMode(event.target.value as GenerationMode);
                        setStudentId("");
                        setClassId("");
                      }}
                      className="w-full rounded-xl border border-[#C8A878] bg-white px-3 py-3 text-sm text-[#4A2C20] outline-none focus:ring-1 focus:ring-[#C8A878]"
                    >
                      <option value="student">Individual Student</option>
                      <option value="class">Entire Class</option>
                      <option value="all">All Students</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4A2C20]">
                      Maximum Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={maxUses}
                      onChange={(event) => setMaxUses(event.target.value)}
                      className="w-full rounded-xl border border-[#C8A878] bg-white px-3 py-3 text-sm text-[#4A2C20] outline-none focus:ring-1 focus:ring-[#C8A878]"
                    />
                  </div>

                  {mode === "student" && (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="mb-2 block text-sm font-bold text-[#4A2C20]">
                        Find Student by Admission Number
                      </label>

                      <input
                        type="search"
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder="Search admission number..."
                        className="mb-3 w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8A878]"
                      />

                      <select
                        value={studentId}
                        onChange={(event) => setStudentId(event.target.value)}
                        className="w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8A878]"
                      >
                        <option value="">Select admission number</option>
                        {filteredStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.admissionNo}
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-xs text-[#7A5038]">
                        {filteredStudents.length} matching students
                      </p>
                    </div>
                  )}

                  {mode === "class" && (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="mb-2 block text-sm font-bold text-[#4A2C20]">
                        Select Class
                      </label>

                      <input
                        type="search"
                        value={classSearch}
                        onChange={(event) => setClassSearch(event.target.value)}
                        placeholder="Search classes..."
                        className="mb-3 w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8A878]"
                      />

                      <select
                        value={classId}
                        onChange={(event) => setClassId(event.target.value)}
                        className="w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8A878]"
                      >
                        <option value="">Select a class</option>
                        {filteredClasses.map((item) => (
                          <option key={item.id} value={item.id}>
                            {className(item)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[#C8A878] px-5 py-5 sm:px-6">
                  <button
                    type="button"
                    onClick={generatePins}
                    disabled={
                      generating ||
                      !sessionId ||
                      (mode === "student" && !studentId) ||
                      (mode === "class" && !classId)
                    }
                    className="rounded-xl bg-[#4A2C20] px-5 py-3 text-sm font-bold text-white hover:bg-[#392117] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating
                      ? "Generating..."
                      : mode === "student"
                        ? "Generate PIN"
                        : mode === "class"
                          ? "Generate Missing Class PINs"
                          : "Generate Missing PINs for All Students"}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadPdf(activePins)}
                    disabled={activePins.length === 0 || exporting}
                    className="rounded-xl border border-[#C8A878] bg-[#FFFCF7] px-5 py-3 text-sm font-bold text-[#4A2C20] hover:bg-[#F7F1E7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {exporting
                      ? "Creating PDF..."
                      : `Download All Active PINs (${
                          resultPins.filter((pin) => pin.isActive).length
                        })`}
                  </button>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#C8A878] bg-[#FFFCF7] shadow-sm">
                <div className="border-b border-[#C8A878] bg-[#F7F1E7] p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="font-bold">Generated PINs</h2>
                      <p className="mt-1 text-xs text-[#7A5038]">
                        {selectedSession?.name || "Selected session"} · {termLabel}
                      </p>
                    </div>

                    <span className="w-fit rounded-lg border border-[#C8A878] bg-white px-3 py-2 text-xs font-semibold text-[#7A5038]">
                      {resultPins.length} PINs found
                    </span>
                  </div>

                  <input
                    type="search"
                    value={pinSearch}
                    onChange={(event) => setPinSearch(event.target.value)}
                    placeholder="Search by admission number, student, PIN or class..."
                    className="mt-4 w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8A878]"
                  />
                </div>

                <div className="border-b border-[#C8A878] p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClass("ALL")}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        selectedClass === "ALL"
                          ? "bg-[#4A2C20] text-white"
                          : "border border-[#C8A878] bg-white text-[#7A5038]"
                      }`}
                    >
                      All Classes ({filteredPins.length})
                    </button>

                    {classes.map((item) => {
                      const count = groupedClasses.get(item.id) || 0;

                      if (!count) return null;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setSelectedClass(item.id)}
                          className={`rounded-lg px-3 py-2 text-xs font-bold ${
                            selectedClass === item.id
                              ? "bg-[#4A2C20] text-white"
                              : "border border-[#C8A878] bg-white text-[#7A5038]"
                          }`}
                        >
                          {className(item)} ({count})
                        </button>
                      );
                    })}

                    {(groupedClasses.get("UNASSIGNED") || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedClass("UNASSIGNED")}
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          selectedClass === "UNASSIGNED"
                            ? "bg-[#4A2C20] text-white"
                            : "border border-[#C8A878] bg-white text-[#7A5038]"
                        }`}
                      >
                        Unassigned ({groupedClasses.get("UNASSIGNED")})
                      </button>
                    )}
                  </div>
                </div>

                {displayedPins.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <h3 className="font-bold text-[#2B211C]">
                      No PINs found
                    </h3>
                    <p className="mt-2 text-sm text-[#7A5038]">
                      Try another search or generate PINs for this session and term.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-[#C8A878] bg-[#FFFCF7]">
                        <tr>
                          {[
                            "Admission No.",
                            "Class",
                            "PIN",
                            "Uses",
                            "Status",
                            "Actions",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#7A5038]"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#C8A878]">
                        {displayedPins.map((pin) => (
                          <tr
                            key={pin.id}
                            className="hover:bg-[#F7F1E7]"
                          >
                            <td className="px-5 py-4 font-semibold text-[#2B211C]">
                              {pin.student.admissionNo}
                            </td>

                            <td className="px-5 py-4 text-[#7A5038]">
                              {getClassLabel(pin)}
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-lg border border-[#C8A878] bg-[#F7F1E7] px-3 py-1.5 font-mono font-bold text-[#2B211C]">
                                {pin.pin}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-[#7A5038]">
                              {pin.usedCount} / {pin.maxUses}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  pin.isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-[#EFE3D0] text-[#7A5038]"
                                }`}
                              >
                                {pin.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  disabled={!pin.isActive || exportingPinId === pin.id}
                                  onClick={() => downloadPdf([pin], true)}
                                  className="font-bold text-[#4A2C20] hover:underline disabled:opacity-40"
                                >
                                  {exportingPinId === pin.id
                                    ? "Creating..."
                                    : "PDF"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => togglePin(pin)}
                                  className="font-bold text-[#4A2C20] hover:underline"
                                >
                                  {pin.isActive ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <p className="text-xs leading-5 text-[#7A5038]">
                Only active PINs can be exported. Deactivated PINs remain in the records and can be activated again.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
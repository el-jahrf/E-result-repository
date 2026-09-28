import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ResultEditor from "./ResultEditor";
import FormMasterEditor from "./FormMasterEditor";

type StudentResultPageProps = {
  params: Promise<{
    classId: string;
    studentId: string;
  }>;
  searchParams: Promise<{
    term?: "FIRST" | "SECOND" | "THIRD";
  }>;
};

export default async function StudentResultPage({
  params,
  searchParams,
}: StudentResultPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const teacherId = session.user.teacherId;

  if (!teacherId) {
    redirect("/teacher");
  }

  const { classId, studentId } = await params;
  const { term = "FIRST" } = await searchParams;

  const currentSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!currentSession) {
    redirect("/teacher");
  }

  const teacher = await prisma.teacher.findUnique({
    where: {
      id: teacherId,
    },
    select: {
      firstName: true,
      lastName: true,
      signatureUrl: true,
      signatureData: true,
    },
  });

  if (!teacher) {
    redirect("/teacher");
  }

  const classRecord = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    include: {
      classSubjects: {
        include: {
          subject: true,
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!classRecord) {
    redirect("/teacher");
  }

  const isLowerSchool =
    classRecord.section === "NURSERY" ||
    classRecord.section === "PRIMARY";

  /*
   * NURSERY / PRIMARY
   *
   * Keep the existing complete Class Teacher workflow untouched.
   */
  if (isLowerSchool) {
    const classMasterAssignment =
      await prisma.classMasterAssignment.findFirst({
        where: {
          teacherId,
          classId,
          sessionId: currentSession.id,
        },
      });

    if (!classMasterAssignment) {
      redirect(`/teacher/class/${classId}?term=${term}`);
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        classId,
        sessionId: currentSession.id,
        term,
      },
      include: {
        student: true,
        results: {
          include: {
            subject: true,
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
        },
        TermSummary: {
          include: {
            AffectiveRatingRecord: true,
          },
        },
      },
    });

    if (!enrollment) {
      redirect(`/teacher/class/${classId}?term=${term}`);
    }

    const existingResultMap = new Map(
      enrollment.results.map((result) => [
        result.subjectId,
        result,
      ]),
    );

    const initialData = {
      classId,
      studentId,
      term,

      studentName: `${enrollment.student.firstName}${
        enrollment.student.middleName
          ? ` ${enrollment.student.middleName}`
          : ""
      } ${enrollment.student.lastName}`,

      admissionNo: enrollment.student.admissionNo,
      className: classRecord.name,
      sessionName: currentSession.name,

      subjects: classRecord.classSubjects.map(
        ({ subject }) => {
          const result = existingResultMap.get(subject.id);

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            ca1: result?.ca1Score?.toString() ?? "",
            ca2: result?.ca2Score?.toString() ?? "",
            exam: result?.examScore?.toString() ?? "",
            teacherRemark:
              result?.teacherRemark ?? "",
            total:
              result?.totalScore?.toString() ?? "",
            grade: result?.grade ?? "",
            status:
              result?.status ?? "DRAFT",
          };
        },
      ),

      attendanceOpened:
        enrollment.attendanceOpened?.toString() ?? "",

      attendancePresent:
        enrollment.attendancePresent?.toString() ?? "",

      attendanceAbsent:
        enrollment.attendanceAbsent?.toString() ?? "",

      attendancePercentage:
        enrollment.attendancePercentage?.toString() ?? "",

      punctualityRating:
        enrollment.TermSummary?.punctualityRating?.toString() ?? "",

      classTeacherComment:
        enrollment.TermSummary?.classTeacherComment ?? "",

      affectiveRatings:
        enrollment.TermSummary?.AffectiveRatingRecord?.map(
          (rating) => ({
            item: rating.item,
            rating: rating.rating,
          }),
        ) ?? [],
    };

    return (
      <ResultEditor
        initialData={initialData}
        teacherName={`${teacher.firstName} ${teacher.lastName}`}
        hasSignature={
          Boolean(teacher.signatureUrl) ||
          Boolean(teacher.signatureData)
        }
      />
    );
  }

  /*
   * JSS / SS
   *
   * The Form Master has a completely separate workflow.
   * They do NOT enter subject scores here.
   */

  const formMasterAssignment =
    await prisma.classMasterAssignment.findFirst({
      where: {
        teacherId,
        classId,
        sessionId: currentSession.id,
      },
      select: {
        id: true,
      },
    });

  if (!formMasterAssignment) {
    redirect(`/teacher/class/${classId}?term=${term}`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classId,
      sessionId: currentSession.id,
      term,
    },
    include: {
      student: true,
      TermSummary: {
        include: {
          AffectiveRatingRecord: true,
        },
      },
    },
  });

  if (!enrollment) {
    redirect(`/teacher/class/${classId}?term=${term}`);
  }

  const affectiveMap = new Map(
    enrollment.TermSummary?.AffectiveRatingRecord.map(
      (item) => [item.item, item.rating],
    ) ?? [],
  );

  return (
    <FormMasterEditor
      classId={classId}
      studentId={studentId}
      term={term}
      sessionId={currentSession.id}
      sessionName={currentSession.name}
      className={classRecord.name}
      studentName={`${enrollment.student.firstName}${
        enrollment.student.middleName
          ? ` ${enrollment.student.middleName}`
          : ""
      } ${enrollment.student.lastName}`}
      admissionNo={enrollment.student.admissionNo}
      teacherName={`${teacher.firstName} ${teacher.lastName}`}
      signatureUrl={teacher.signatureUrl}
      signatureData={teacher.signatureData}
      attendanceOpened={
        enrollment.attendanceOpened?.toString() ?? ""
      }
      attendancePresent={
        enrollment.attendancePresent?.toString() ?? ""
      }
      attendanceAbsent={
        enrollment.attendanceAbsent?.toString() ?? ""
      }
      punctualityRating={
        enrollment.TermSummary?.punctualityRating?.toString() ?? ""
      }
      formMasterRemark={
        enrollment.TermSummary?.classTeacherComment ?? ""
      }
      affectiveRatings={{
        Attentiveness:
          affectiveMap.get("Attentiveness") ?? 0,
        Neatness:
          affectiveMap.get("Neatness") ?? 0,
        Cooperation:
          affectiveMap.get("Cooperation") ?? 0,
        Respect:
          affectiveMap.get("Respect") ?? 0,
        Leadership:
          affectiveMap.get("Leadership") ?? 0,
      }}
    />
  );
}
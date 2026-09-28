import { prisma } from "@/lib/prisma";

type RecalculateScope = {
  classId: string;
  sessionId: string;
  term: "FIRST" | "SECOND" | "THIRD";
};

type NumericResult = {
  id: string;
  studentId: string;
  subjectId: string;
  totalScore: number | null;
};

type StudentCalculation = {
  studentId: string;
  enrollmentId: string;
  total: number;
  average: number;
  subjectCount: number;
  complete: boolean;
};

const ATTITUDE_ITEMS = [
  "Honesty",
  "Alertness",
  "Neatness",
  "Class Attendance",
  "Politeness",
  "Punctuality",
  "Self-Control",
  "Generosity",
];

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/**
 * Finds the grading scale that applies to a score.
 *
 * Grading scales are configured by the administrator.
 * The ranges are inclusive.
 */
async function getGradeForScore(totalScore: number) {
  const scales = await prisma.gradingScale.findMany({
    orderBy: [
      { minScore: "desc" },
      { maxScore: "desc" },
    ],
  });

  const matchingScale = scales.find((scale) => {
    const min = Number(scale.minScore);
    const max = Number(scale.maxScore);

    return totalScore >= min && totalScore <= max;
  });

  if (!matchingScale) {
    return {
      grade: null,
      remark: null,
    };
  }

  return {
    grade: matchingScale.grade,
    remark: matchingScale.remark,
  };
}

/**
 * Recalculates all subject-level calculations for a class/session/term.
 *
 * This includes:
 * - class average
 * - lowest in class
 * - performance rate
 * - grade
 * - remark
 * - subject position
 */
async function recalculateSubjectResults(scope: RecalculateScope) {
  const results = await prisma.result.findMany({
    where: {
      classId: scope.classId,
      sessionId: scope.sessionId,
      term: scope.term,
      totalScore: {
        not: null,
      },
    },
    select: {
      id: true,
      studentId: true,
      subjectId: true,
      totalScore: true,
    },
  });

  const groupedBySubject = new Map<string, NumericResult[]>();

  for (const result of results) {
    const subjectResults = groupedBySubject.get(result.subjectId) ?? [];

    subjectResults.push({
      id: result.id,
      studentId: result.studentId,
      subjectId: result.subjectId,
      totalScore: toNumber(result.totalScore),
    });

    groupedBySubject.set(result.subjectId, subjectResults);
  }

  for (const [, subjectResults] of groupedBySubject) {
    const scoredResults = subjectResults.filter(
      (result) => result.totalScore !== null,
    );

    if (scoredResults.length === 0) {
      continue;
    }

    const scores = scoredResults.map((result) => result.totalScore!);

    const classAverage =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const lowestInClass = Math.min(...scores);

    const sorted = [...scoredResults].sort(
      (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0),
    );

    let previousScore: number | null = null;
    let previousPosition = 0;

    for (let index = 0; index < sorted.length; index += 1) {
      const result = sorted[index];
      const score = result.totalScore!;

      let position: number;

      if (previousScore !== null && score === previousScore) {
        position = previousPosition;
      } else {
        position = index + 1;
      }

      previousScore = score;
      previousPosition = position;

      const gradeInfo = await getGradeForScore(score);

      await prisma.result.update({
        where: {
          id: result.id,
        },
        data: {
          classAverage: round(classAverage),
          lowestInClass: round(lowestInClass),
          performanceRate: round(score),
          grade: gradeInfo.grade,
          remark: gradeInfo.remark,
          position,
        },
      });
    }
  }
}

/**
 * Recalculates each student's overall term summary.
 *
 * A student is rankable only when they have a result for every
 * subject currently assigned to the class for this session/term.
 */
async function recalculateTermSummaries(scope: RecalculateScope) {
  const [enrollments, assignments, results] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        classId: scope.classId,
        sessionId: scope.sessionId,
        term: scope.term,
      },
      select: {
        id: true,
        studentId: true,
      },
    }),

    prisma.teacherAssignment.findMany({
      where: {
        classId: scope.classId,
        sessionId: scope.sessionId,
        term: scope.term,
      },
      select: {
        subjectId: true,
      },
    }),

    prisma.result.findMany({
      where: {
        classId: scope.classId,
        sessionId: scope.sessionId,
        term: scope.term,
        totalScore: {
          not: null,
        },
      },
      select: {
        studentId: true,
        enrollmentId: true,
        subjectId: true,
        totalScore: true,
      },
    }),
  ]);

  const requiredSubjectIds = [
    ...new Set(assignments.map((assignment) => assignment.subjectId)),
  ];

  const resultsByStudent = new Map<
    string,
    {
      enrollmentId: string;
      scores: Map<string, number>;
    }
  >();

  for (const result of results) {
    const student = resultsByStudent.get(result.studentId) ?? {
      enrollmentId: result.enrollmentId,
      scores: new Map<string, number>(),
    };

    const score = toNumber(result.totalScore);

    if (score !== null) {
      student.scores.set(result.subjectId, score);
    }

    resultsByStudent.set(result.studentId, student);
  }

  const studentCalculations: StudentCalculation[] = [];

  for (const enrollment of enrollments) {
    const studentData = resultsByStudent.get(enrollment.studentId);

    if (!studentData) {
      continue;
    }

    const scores = [...studentData.scores.values()];

    if (scores.length === 0) {
      continue;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);

    const average = total / scores.length;

    const complete =
      requiredSubjectIds.length === 0
        ? true
        : requiredSubjectIds.every((subjectId) =>
            studentData.scores.has(subjectId),
          );

    studentCalculations.push({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      total,
      average,
      subjectCount: scores.length,
      complete,
    });
  }

  /*
   * Only students with complete results participate in final
   * class ranking.
   */
  const rankableStudents = studentCalculations
    .filter((student) => student.complete)
    .sort((a, b) => b.average - a.average);

  const classScoringAverage =
    rankableStudents.length > 0
      ? rankableStudents.reduce(
          (sum, student) => sum + student.average,
          0,
        ) / rankableStudents.length
      : null;

  let previousAverage: number | null = null;
  let previousPosition = 0;

  for (let index = 0; index < rankableStudents.length; index += 1) {
    const student = rankableStudents[index];

    let position: number;

    if (
      previousAverage !== null &&
      student.average === previousAverage
    ) {
      position = previousPosition;
    } else {
      position = index + 1;
    }

    previousAverage = student.average;
    previousPosition = position;

    const performanceRate = student.average;

    await prisma.termSummary.upsert({
      where: {
        enrollmentId: student.enrollmentId,
      },
      update: {
        overallTotal: round(student.total),
        average: round(student.average),
        position,
        positionOutOf: rankableStudents.length,
        performanceRate: round(performanceRate),
        classScoringAverage:
          classScoringAverage === null
            ? null
            : round(classScoringAverage),
      },
      create: {
        id: crypto.randomUUID(),
        enrollmentId: student.enrollmentId,
        overallTotal: round(student.total),
        average: round(student.average),
        position,
        positionOutOf: rankableStudents.length,
        performanceRate: round(performanceRate),
        classScoringAverage:
          classScoringAverage === null
            ? null
            : round(classScoringAverage),
        updatedAt: new Date(),
      },
    });
  }

  /*
   * Students with incomplete results still get a useful summary,
   * but they do not receive a final class position.
   */
  const rankableEnrollmentIds = new Set(
    rankableStudents.map((student) => student.enrollmentId),
  );

  for (const student of studentCalculations) {
    if (rankableEnrollmentIds.has(student.enrollmentId)) {
      continue;
    }

    await prisma.termSummary.upsert({
      where: {
        enrollmentId: student.enrollmentId,
      },
      update: {
        overallTotal: round(student.total),
        average: round(student.average),
        position: null,
        positionOutOf: null,
        performanceRate: round(student.average),
        classScoringAverage:
          classScoringAverage === null
            ? null
            : round(classScoringAverage),
      },
      create: {
        id: crypto.randomUUID(),
        enrollmentId: student.enrollmentId,
        overallTotal: round(student.total),
        average: round(student.average),
        position: null,
        positionOutOf: null,
        performanceRate: round(student.average),
        classScoringAverage:
          classScoringAverage === null
            ? null
            : round(classScoringAverage),
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Main calculation entry point.
 */
export async function recalculateClassResults(
  scope: RecalculateScope,
) {
  await recalculateSubjectResults(scope);
  await recalculateTermSummaries(scope);
}

/**
 * Validates the fixed behavioural rating structure used by the
 * school's report sheet.
 */
export function isValidAffectiveItem(item: string) {
  return ATTITUDE_ITEMS.includes(item);
}

/**
 * Returns the official affective-rating items.
 */
export function getAffectiveItems() {
  return [...ATTITUDE_ITEMS];
}
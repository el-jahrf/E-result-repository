import { SchoolSection, SubjectType } from "@prisma/client";

export type OfficialSubject = {
  code: string;
  name: string;
  type: SubjectType;
};

export type SchoolClassDefinition = {
  name: string;
  level: string;
  section: SchoolSection;
  arm?: string;
  stream?: string;
};

export const OFFICIAL_SUBJECT_GROUPS = {
  LOWER: {
    key: "LOWER",
    label: "Nursery / Primary",
    description: "Pre-Nursery through Primary 5",
    section: null,
    subjects: [
      { code: "ENG", name: "English Language", type: SubjectType.CORE },
      { code: "MATH", name: "Mathematics", type: SubjectType.CORE },
      { code: "CRAFT", name: "Creative Arts", type: SubjectType.CORE },
      { code: "PHE", name: "Physical & H. Edu", type: SubjectType.CORE },
      { code: "BSC", name: "Basic Science", type: SubjectType.CORE },
      { code: "SCS", name: "Social & Citizenship", type: SubjectType.CORE },
      { code: "HIST", name: "Nigerian History", type: SubjectType.CORE },
      { code: "DL", name: "Digital Literacy", type: SubjectType.CORE },
      { code: "REL", name: "Religion IRK/CRK", type: SubjectType.CORE },
      { code: "PV", name: "Pre-Vocational", type: SubjectType.CORE },
      { code: "QUANT", name: "Quantitative", type: SubjectType.CORE },
      { code: "VERBAL", name: "Verbal", type: SubjectType.CORE },
      { code: "CRAFT2", name: "Craft", type: SubjectType.CORE },
    ],
  },

  JSS: {
    key: "JSS",
    label: "Junior Secondary",
    description: "JSS 1 through JSS 3",
    section: SchoolSection.JSS,
    subjects: [
      { code: "JSS-ENG", name: "English Studies", type: SubjectType.CORE },
      { code: "JSS-MATH", name: "Mathematics", type: SubjectType.CORE },
      {
        code: "JSS-PHE",
        name: "Physical and Health Education",
        type: SubjectType.CORE,
      },
      { code: "JSS-REL", name: "I.R.K / C.R.K", type: SubjectType.CORE },
      {
        code: "JSS-HIST",
        name: "Nigerian History",
        type: SubjectType.CORE,
      },
      {
        code: "JSS-SCS",
        name: "Social and Citizenship Studies",
        type: SubjectType.CORE,
      },
      {
        code: "JSS-CCA",
        name: "Cultural and Creative Arts (CCA)",
        type: SubjectType.CORE,
      },
      {
        code: "JSS-SCI",
        name: "Intermediate Science",
        type: SubjectType.CORE,
      },
      {
        code: "JSS-DT",
        name: "Digital Technologies",
        type: SubjectType.CORE,
      },
      {
        code: "JSS-BUS",
        name: "Business Studies",
        type: SubjectType.CORE,
      },
    ],
  },

  SS: {
    key: "SS",
    label: "Senior Secondary",
    description: "SS 1 through SS 3",
    section: SchoolSection.SS,
    subjects: [
      { code: "SS-ENG", name: "English Language", type: SubjectType.CORE },
      { code: "SS-MATH", name: "Mathematics", type: SubjectType.CORE },
      {
        code: "SS-CHS",
        name: "Citizenship and Heritage Studies",
        type: SubjectType.CORE,
      },
      {
        code: "SS-DT",
        name: "Digital Technologies",
        type: SubjectType.CORE,
      },
      { code: "SS-BIO", name: "Biology", type: SubjectType.CORE },
      { code: "SS-CHEM", name: "Chemistry", type: SubjectType.CORE },
      { code: "SS-PHY", name: "Physics", type: SubjectType.CORE },
      {
        code: "SS-AGRIC",
        name: "Agricultural Science",
        type: SubjectType.CORE,
      },
      { code: "SS-GEO", name: "Geography", type: SubjectType.CORE },
      {
        code: "SS-HIST",
        name: "Nigerian History",
        type: SubjectType.CORE,
      },
      { code: "SS-ECO", name: "Economics", type: SubjectType.CORE },
    ],
  },
} satisfies Record<string, {
  key: string;
  label: string;
  description: string;
  section: SchoolSection | null;
  subjects: OfficialSubject[];
}>;

export const ALL_OFFICIAL_SUBJECT_GROUPS = Object.values(
  OFFICIAL_SUBJECT_GROUPS,
);

export function getSubjectGroupForClass(classInfo: {
  section: SchoolSection;
}): keyof typeof OFFICIAL_SUBJECT_GROUPS {
  if (
    classInfo.section === SchoolSection.NURSERY ||
    classInfo.section === SchoolSection.PRIMARY
  ) {
    return "LOWER";
  }

  if (classInfo.section === SchoolSection.JSS) {
    return "JSS";
  }

  return "SS";
}

export function getSubjectsForClass(classInfo: {
  section: SchoolSection;
}): OfficialSubject[] {
  return OFFICIAL_SUBJECT_GROUPS[getSubjectGroupForClass(classInfo)].subjects;
}

export const STANDARD_CLASSES: SchoolClassDefinition[] = [
  {
    name: "Pre-Nursery",
    level: "Pre-Nursery",
    section: SchoolSection.NURSERY,
  },
  {
    name: "Nursery 1",
    level: "Nursery 1",
    section: SchoolSection.NURSERY,
  },
  {
    name: "Nursery 2",
    level: "Nursery 2",
    section: SchoolSection.NURSERY,
  },
  {
    name: "Nursery 3",
    level: "Nursery 3",
    section: SchoolSection.NURSERY,
  },

  ...Array.from({ length: 5 }, (_, index) => ({
    name: `Primary ${index + 1}`,
    level: `Primary ${index + 1}`,
    section: SchoolSection.PRIMARY,
  })),

  ...Array.from({ length: 3 }, (_, index) => ({
    name: `JSS ${index + 1}`,
    level: `JSS ${index + 1}`,
    section: SchoolSection.JSS,
  })),

  {
    name: "SS 1 Science",
    level: "SS 1",
    section: SchoolSection.SS,
    arm: "Science",
    stream: "Science",
  },
  {
    name: "SS 1 Art",
    level: "SS 1",
    section: SchoolSection.SS,
    arm: "Art",
    stream: "Art",
  },
  {
    name: "SS 1 Commercial",
    level: "SS 1",
    section: SchoolSection.SS,
    arm: "Commercial",
    stream: "Commercial",
  },

  {
    name: "SS 2 Science",
    level: "SS 2",
    section: SchoolSection.SS,
    arm: "Science",
    stream: "Science",
  },
  {
    name: "SS 2 Art",
    level: "SS 2",
    section: SchoolSection.SS,
    arm: "Art",
    stream: "Art",
  },
  {
    name: "SS 2 Commercial",
    level: "SS 2",
    section: SchoolSection.SS,
    arm: "Commercial",
    stream: "Commercial",
  },

  {
    name: "SS 3 Science",
    level: "SS 3",
    section: SchoolSection.SS,
    arm: "Science",
    stream: "Science",
  },
  {
    name: "SS 3 Art",
    level: "SS 3",
    section: SchoolSection.SS,
    arm: "Art",
    stream: "Art",
  },
  {
    name: "SS 3 Commercial",
    level: "SS 3",
    section: SchoolSection.SS,
    arm: "Commercial",
    stream: "Commercial",
  },
];
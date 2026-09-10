export const GRADES = [6, 7, 8, 9, 10, 11, 12] as const;
export type Grade = (typeof GRADES)[number];
export const STREAMS = {
  pcm: {
    label: "Science · Mathematics",
    detail: "Physics, Chemistry, Mathematics",
    subjects: ["Physics", "Chemistry", "Mathematics"],
  },
  pcb: {
    label: "Science · Biology",
    detail: "Physics, Chemistry, Biology",
    subjects: ["Physics", "Chemistry", "Biology"],
  },
  pcmb: {
    label: "Science · Maths & Biology",
    detail: "Physics, Chemistry, Mathematics, Biology",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
  },
  commerce: {
    label: "Commerce",
    detail: "Commerce learning track",
    subjects: ["Commerce"],
  },
} as const;
export type Stream = keyof typeof STREAMS;
export type Registration = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  school: string;
  city: string;
  grade: string;
  stream: string;
  gradeConfirmed: boolean;
};
export const emptyRegistration: Registration = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  school: "",
  city: "",
  grade: "",
  stream: "",
  gradeConfirmed: false,
};
export function isGrade(value: string): boolean {
  return GRADES.some((g) => String(g) === value);
}
export function isStream(value: string): value is Stream {
  return Object.hasOwn(STREAMS, value);
}
export function courseSelection(grade: string, stream: string): string[] {
  if (!isGrade(grade)) return [];
  if (Number(grade) <= 10) return ["Mathematics", "Science"];
  return isStream(stream) ? [...STREAMS[stream].subjects] : [];
}
export function validateStep(
  data: Registration,
  step: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (data.fullName.trim().length < 2 || data.fullName.trim().length > 100)
      errors.fullName = "Enter your full name (2–100 characters).";
    if (
      data.email.trim().length > 254 ||
      !/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    )
      errors.email = "Enter a valid email address.";
    if (data.password.length < 8 || data.password.length > 128)
      errors.password = "Use between 8 and 128 characters.";
    if (!data.confirmPassword || data.confirmPassword !== data.password)
      errors.confirmPassword = "Both passwords must match.";
  }
  if (step === 1) {
    if (data.school.trim().length < 2 || data.school.trim().length > 160)
      errors.school = "Enter your school name (2–160 characters).";
    if (data.city.trim().length < 2 || data.city.trim().length > 100)
      errors.city = "Enter your school’s city or town.";
    if (!isGrade(data.grade)) errors.grade = "Choose your current class.";
    if (Number(data.grade) >= 11 && !isStream(data.stream))
      errors.stream = "Choose your current subject stream.";
  }
  if (step === 2 && !data.gradeConfirmed)
    errors.gradeConfirmed =
      "Confirm your class and subject selection to continue.";
  return errors;
}
// The backend must revalidate this profile and derive course access from its trusted record.
// Never send confirmPassword or a client-assigned role to a future registration endpoint.
export function registrationProfile(data: Registration) {
  if (
    Object.keys({
      ...validateStep(data, 0),
      ...validateStep(data, 1),
      ...validateStep(data, 2),
    }).length
  )
    throw new Error("Invalid student profile");
  return {
    full_name: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    school_name: data.school.trim(),
    school_city: data.city.trim(),
    grade: Number(data.grade) as Grade,
    stream: Number(data.grade) >= 11 ? (data.stream as Stream) : null,
  };
}

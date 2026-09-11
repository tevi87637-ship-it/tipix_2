import { useStudentProfile } from "../auth/AuthProvider";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isGrade, isStream } from "../lib/studentProfile";
import { getCourses, type Course } from "./data";
export type Attempt = {
  key: string;
  courseId: string;
  questionId: string;
  selected: number;
  correct: boolean;
  at: number;
  concept: string;
};
type State = {
  grade: string;
  stream: string;
  answers: Record<string, Attempt>;
  flashcards: string[];
  doubts: { id: string; text: string; course: string }[];
  exam?: {
    courseId: string;
    started: number;
    choices: Record<string, number>;
    submitted: boolean;
  };
};
const initial: State = {
  grade: "",
  stream: "",
  answers: {},
  flashcards: [],
  doubts: [],
};
function load(storageKey: string): State {
  try {
    const s = JSON.parse(
      sessionStorage.getItem(storageKey) || "null",
    );
    if (
      s &&
      isGrade(s.grade) &&
      (Number(s.grade) < 11 || isStream(s.stream)) &&
      s.answers !== null &&
      !Array.isArray(s.answers) &&
      typeof s.answers === "object" &&
      Array.isArray(s.flashcards) &&
      Array.isArray(s.doubts)
    )
      return s;
  } catch {}
  return initial;
}
const Context = createContext<null | {
  state: State;
  courses: Course[];
  attempts: Attempt[];
  points: number;
  setGrade: (grade: string, stream: string) => void;
  answer: (course: Course, id: string, selected: number) => void;
  toggleCard: (id: string) => void;
  addDoubt: (text: string, course: string) => void;
  reset: () => void;
  startExam: (courseId: string) => void;
  examAnswer: (id: string, selected: number) => void;
  submitExam: () => void;
  clearExam: () => void;
}>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const profile = useStudentProfile();
  const storageKey = `tipix-demo-${profile.id}`;
  const [state, setState] = useState<State>(() => {
    const saved = load(storageKey), grade = String(profile.grade), stream = profile.stream || '';
    return saved.grade === grade && saved.stream === stream ? saved : {...initial, grade, stream};
  });
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }, [state, storageKey]);
  const courses = getCourses(state.grade, state.stream);
  const attempts = Object.values(state.answers);
  const points = attempts.filter((a) => a.correct).length * 10;
  const value = {
    state,
    courses,
    attempts,
    points,
    setGrade: () => { /* Account grade is managed by the persisted profile. */ },
    answer: (course: Course, id: string, selected: number) => {
      const question = course.questions.find((q) => q.id === id);
      if (
        !question ||
        !Number.isInteger(selected) ||
        selected < 0 ||
        selected >= question.options.length
      )
        return;
      const key = `${course.id}:${id}`;
      setState((s) =>
        s.answers[key]
          ? s
          : {
              ...s,
              answers: {
                ...s.answers,
                [key]: {
                  key,
                  courseId: course.id,
                  questionId: id,
                  selected,
                  correct: selected === question.answer,
                  at: Date.now(),
                  concept: question.concept,
                },
              },
            },
      );
    },
    toggleCard: (id: string) =>
      setState((s) => ({
        ...s,
        flashcards: s.flashcards.includes(id)
          ? s.flashcards.filter((x) => x !== id)
          : [...s.flashcards, id],
      })),
    addDoubt: (text: string, course: string) => {
      if (text.trim())
        setState((s) => ({
          ...s,
          doubts: [
            ...s.doubts,
            {
              id: `draft-${Date.now()}-${s.doubts.length}`,
              text: text.trim().slice(0, 1000),
              course,
            },
          ],
        }));
    },
    reset: () =>
      setState((s) => ({ ...initial, grade: s.grade, stream: s.stream })),
    startExam: (courseId: string) => {
      if (courses.some((c) => c.id === courseId))
        setState((s) =>
          s.exam && !s.exam.submitted
            ? s
            : {
                ...s,
                exam: {
                  courseId,
                  started: Date.now(),
                  choices: {},
                  submitted: false,
                },
              },
        );
    },
    examAnswer: (id: string, selected: number) =>
      setState((s) => {
        const exam = s.exam,
          c = courses.find((c) => c.id === exam?.courseId),
          q = c?.questions.find((q) => q.id === id);
        if (
          !exam ||
          exam.submitted ||
          Date.now() - exam.started >= 300000 ||
          !q ||
          selected < 0 ||
          selected >= q.options.length
        )
          return s;
        return {
          ...s,
          exam: { ...exam, choices: { ...exam.choices, [id]: selected } },
        };
      }),
    clearExam: () =>
      setState((s) => (s.exam?.submitted ? { ...s, exam: undefined } : s)),
    submitExam: () =>
      setState((s) =>
        s.exam ? { ...s, exam: { ...s.exam, submitted: true } } : s,
      ),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspace() {
  const c = useContext(Context);
  if (!c) throw new Error("Workspace provider missing");
  return c;
}

import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  LockKeyhole,
  Clock3,
  Flag,
  RotateCcw,
  Layers,
  Lightbulb,
  MessageCircle,
  Plus,
  ChevronRight,
  Code2,
} from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import { PageHeading, WLink, Empty, CourseIcon } from "./StudentPages";
export function CourseDetail() {
  const { courseId } = useParams();
  const { courses } = useWorkspace();
  const c = courses.find((x) => x.id === courseId);
  const [active, setActive] = useState(0);
  if (!c)
    return (
      <Empty
        title="This subject isn’t in your course plan."
        text="Choose a subject available for your current class and stream."
        to="/app/courses"
        label="View your courses"
      />
    );
  return (
    <>
      <Link to="/app/courses" className="w-back-link">
        <ArrowLeft size={15} />
        Your courses
      </Link>
      <PageHeading
        eyebrow={`${c.name.toUpperCase()} · CONCEPT SAMPLER`}
        title={c.chapter}
        text="Understand the idea, follow the connections, then test it in practice."
        action={<WLink to={`/app/practice/${c.id}`}>Start practice</WLink>}
      />
      <div className={`w-path-surface ${c.theme}`}>
        <div
          className="w-path-track"
          tabIndex={0}
          aria-label="Chapter path; scroll horizontally"
        >
          {[
            ...c.concepts,
            "Practice questions",
            "NCERT Questions",
            "Mock Test",
            "Final Exam",
          ].map((s, i) => (
            <button
              key={s}
              className={`w-path-node ${active === i ? "active" : ""} ${i > c.concepts.length ? "planned" : ""}`}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
            >
              <span>
                {i > c.concepts.length ? (
                  <LockKeyhole size={17} />
                ) : i === c.concepts.length ? (
                  <Check size={18} />
                ) : (
                  <BookOpen size={18} />
                )}
              </span>
              <small>
                {i < c.concepts.length
                  ? `CONCEPT 0${i + 1}`
                  : i === c.concepts.length
                    ? "TRY IT"
                    : "PLANNED"}
              </small>
              <strong>{s}</strong>
            </button>
          ))}
        </div>
      </div>
      {active < c.concepts.length ? (
        <article className="w-lesson w-panel">
          <div className="w-lesson-main">
            <span className="w-eyebrow">
              UNDERSTAND · {c.concepts[active].toUpperCase()}
            </span>
            <h2>Start with the idea.</h2>
            <p>{c.lesson}</p>
            <div className="w-key-idea">
              <Lightbulb size={22} />
              <div>
                <h3>Connect it to a question.</h3>
                <p>
                  {c.questions.find((q) => q.concept === c.concepts[active])
                    ?.prompt || c.questions[0].prompt}
                </p>
              </div>
            </div>
            <p className="w-note">
              This short overview is original demonstration content. A complete
              lesson sequence will be added with the reviewed curriculum.
            </p>
            <WLink to={`/app/practice/${c.id}`}>Put it into practice</WLink>
          </div>
          <aside>
            <span className="w-eyebrow">YOUR LEARNING LOOP</span>
            {[
              "Understand the idea",
              "Try a question",
              "Read the explanation",
              "Revisit the connection",
            ].map((s, i) => (
              <div key={s}>
                <span>0{i + 1}</span>
                {s}
              </div>
            ))}
            <Link to="/app/doubts">
              Have a question?
              <MessageCircle size={15} />
            </Link>
          </aside>
        </article>
      ) : active === c.concepts.length ? (
        <div className="w-panel">
          <Empty
            title="Ready to put the idea to work?"
            text={`Try ${c.questions.length} original demonstration questions with immediate explanations.`}
            to={`/app/practice/${c.id}`}
            label="Start practice"
          />
        </div>
      ) : (
        <div className="w-panel">
          <Empty
            icon={LockKeyhole}
            title="This part of the path is planned."
            text="NCERT questions and final assessments require reviewed content. You can try the original practice sampler now."
            to={`/app/practice/${c.id}`}
          />
        </div>
      )}
    </>
  );
}
export function Practice() {
  const { courseId } = useParams();
  const { courses, state, answer } = useWorkspace();
  const [params] = useSearchParams();
  const c = courses.find((x) => x.id === courseId);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (c) {
      const requested = c.questions.findIndex(
        (q) => q.id === params.get("question"),
      );
      const next = c.questions.findIndex(
        (q) => !state.answers[`${c.id}:${q.id}`],
      );
      setIndex(requested >= 0 ? requested : next >= 0 ? next : 0);
      setChoice(null);
    }
  }, [courseId]);
  if (!courseId)
    return (
      <>
        <PageHeading
          eyebrow="PRACTICE WITH PURPOSE"
          title="Make understanding your own."
          text="Choose a subject. Answer at your pace. Learn from the explanation."
        />
        <div className="w-practice-grid">
          {courses.map((course) => {
            const done = Object.values(state.answers).filter(
              (a) => a.courseId === course.id,
            ).length;
            return (
              <Link
                className="w-panel w-practice-choice"
                to={`/app/practice/${course.id}`}
                key={course.id}
              >
                <CourseIcon id={course.id} />
                <h2>{course.name}</h2>
                <p>{course.chapter}</p>
                <div>
                  <span>
                    {done}/{course.questions.length} explored
                  </span>
                  <ArrowRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      </>
    );
  if (!c)
    return (
      <Empty
        title="Choose a subject in your class."
        text="This practice set isn’t in the selected course plan."
        to="/app/practice"
      />
    );
  const question = c.questions[index];
  const saved = state.answers[`${c.id}:${question.id}`];
  const selected = saved?.selected ?? choice;
  const count = c.questions.filter(
    (q) => state.answers[`${c.id}:${q.id}`],
  ).length;
  const done = count === c.questions.length;
  return (
    <>
      <Link className="w-back-link" to="/app/practice">
        <ArrowLeft size={15} />
        All practice sets
      </Link>
      <PageHeading
        eyebrow={`${c.name.toUpperCase()} · ${c.chapter.toUpperCase()}`}
        title="Every attempt makes a connection."
      />
      <div className="w-practice-layout">
        <div className="w-question-panel">
          <div className="w-question-meta">
            <span>
              QUESTION {index + 1} OF {c.questions.length}
            </span>
            <span className="w-tag">Original demo question</span>
          </div>
          <div className="w-progress">
            <i style={{ width: `${(count / c.questions.length) * 100}%` }} />
          </div>
          <span className="w-question-concept">{question.concept}</span>
          <h2>{question.prompt}</h2>
          <fieldset className="w-answers">
            <legend className="w-sr-only">Choose your answer</legend>
            {question.options.map((option, i) => (
              <label
                key={option}
                className={`${selected === i ? "selected" : ""} ${saved && i === question.answer ? "correct" : ""} ${saved && i === saved.selected && !saved.correct ? "incorrect" : ""}`}
              >
                <input
                  type="radio"
                  name="practice-answer"
                  checked={selected === i}
                  disabled={!!saved}
                  onChange={() => {
                    setChoice(i);
                    setNotice("");
                  }}
                />
                <span className="w-option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
                {saved && i === question.answer && <Check size={18} />}
              </label>
            ))}
          </fieldset>
          {saved && (
            <div
              className={`w-explanation ${saved.correct ? "correct" : "revisit"}`}
              role="status"
            >
              <strong>
                {saved.correct
                  ? "That’s right. +10 preview points"
                  : "A useful moment to revisit."}
              </strong>
              <p>{question.explanation}</p>
            </div>
          )}
          <div className="w-question-actions">
            <button
              className="w-button secondary"
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => i - 1);
                setChoice(null);
                setNotice("");
              }}
            >
              <ArrowLeft size={15} />
              Previous
            </button>
            {!saved ? (
              <button
                className="w-button"
                onClick={() => {
                  if (choice === null) {
                    setNotice("Choose an answer before submitting.");
                    return;
                  }
                  answer(c, question.id, choice);
                }}
              >
                Submit answer
                <Check size={16} />
              </button>
            ) : index < c.questions.length - 1 ? (
              <button
                className="w-button"
                onClick={() => {
                  setIndex((i) => i + 1);
                  setChoice(null);
                }}
              >
                Next question
                <ArrowRight size={16} />
              </button>
            ) : (
              <WLink to="/app/concept-progress">See concept progress</WLink>
            )}
          </div>
          <p role="status" className="w-note">
            {notice}
          </p>
        </div>
        <aside className="w-panel w-session-card">
          <span className="w-eyebrow">YOUR SESSION</span>
          <h3>
            {count} of {c.questions.length} explored
          </h3>
          <div className="w-question-dots">
            {c.questions.map((q, i) => {
              const a = state.answers[`${c.id}:${q.id}`];
              return (
                <button
                  key={q.id}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === index ? "step" : undefined}
                  className={a ? (a.correct ? "correct" : "incorrect") : ""}
                  onClick={() => {
                    setIndex(i);
                    setChoice(null);
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p>
            {done
              ? "You’ve explored every question. Review the explanations or see the concept picture."
              : "Your first answers are kept in this tab. Come back to continue from the next unanswered question."}
          </p>
          <div className="w-session-rule">
            <Lightbulb size={17} />
            <span>Reviewing an answer never awards points twice.</span>
          </div>
          <Link to={`/app/courses/${c.id}`}>
            Revisit the lesson
            <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
    </>
  );
}
export function Exams() {
  const { courses, state, startExam, examAnswer, submitExam, clearExam } =
    useWorkspace();
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(false);
  const exam = state.exam;
  const c = courses.find((c) => c.id === exam?.courseId);
  useEffect(() => {
    if (!exam || exam.submitted) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [exam?.started, exam?.submitted]);
  const remaining = exam
    ? Math.max(0, 300 - Math.floor((now - exam.started) / 1000))
    : 300;
  useEffect(() => {
    if (exam && !exam.submitted && remaining === 0) submitExam();
  }, [remaining, exam?.submitted]);
  if (!exam || !c)
    return (
      <>
        <PageHeading
          eyebrow="A SMALL CHALLENGE. A CLEARER PICTURE."
          title="Put your understanding to the test."
          text="Five-minute exam previews with feedback released after submission."
        />
        <div className="w-practice-grid">
          {courses.map((c) => (
            <article className="w-panel w-exam-card" key={c.id}>
              <CourseIcon id={c.id} />
              <span className="w-tag">Practice exam · Local preview</span>
              <h2>{c.name} check-in</h2>
              <p>{c.chapter}</p>
              <div className="w-exam-meta">
                <span>
                  <Clock3 size={14} />5 minutes
                </span>
                <span>{c.questions.length} questions</span>
              </div>
              <button
                className="w-button"
                onClick={() => {
                  startExam(c.id);
                  setNow(Date.now());
                }}
              >
                Start exam preview
                <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
        <p className="w-note w-spaced">
          No teacher assignment or official grade. These use the same demo
          question pool as practice. Exam results do not add practice points.
        </p>
      </>
    );
  const correct = c.questions.filter(
    (q) => exam.choices[q.id] === q.answer,
  ).length;
  if (exam.submitted)
    return (
      <>
        <PageHeading
          eyebrow="PREVIEW EXAM COMPLETE"
          title="Reflect. Revisit. Keep moving."
          text={`${c.name} · ${c.chapter}`}
        />
        <div className="w-exam-result">
          <div className="w-result-circle">
            <strong>
              {correct}/{c.questions.length}
            </strong>
            <span>correct answers</span>
          </div>
          <div>
            <h2>
              {correct === c.questions.length
                ? "A strong start."
                : "Your next steps are clearer."}
            </h2>
            <p>
              Use the explanations below to reconnect the ideas. This is a local
              practice result, not an official grade.
            </p>
            <div className="w-inline-actions">
              <button className="w-button secondary" onClick={clearExam}>
                Choose another subject
              </button>
              <WLink to={`/app/courses/${c.id}`}>Revisit the lesson</WLink>
              <button
                className="w-button secondary"
                onClick={() => {
                  startExam(c.id);
                  setNow(Date.now());
                }}
              >
                Try a fresh preview
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
        {c.questions.map((q) => (
          <article className="w-panel w-result-answer" key={q.id}>
            <span
              className={`w-tag ${exam.choices[q.id] === q.answer ? "success" : "warm"}`}
            >
              {exam.choices[q.id] === undefined
                ? "Unanswered"
                : exam.choices[q.id] === q.answer
                  ? "Correct"
                  : "Review"}
            </span>
            <h3>{q.prompt}</h3>
            <p>Correct answer: {q.options[q.answer]}</p>
            <p>{q.explanation}</p>
          </article>
        ))}
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="LOCAL EXAM PREVIEW"
        title={`${c.name} check-in`}
        text="Answers are stored in this tab; explanations appear when you submit."
        action={
          <span className={`w-timer ${remaining < 60 ? "urgent" : ""}`}>
            <Clock3 size={17} />
            {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
        }
      />
      {c.questions.map((q, i) => (
        <section className="w-panel w-exam-question" key={q.id}>
          <span className="w-eyebrow">
            QUESTION {i + 1} · {q.concept.toUpperCase()}
          </span>
          <h2>{q.prompt}</h2>
          <fieldset className="w-answers">
            <legend className="w-sr-only">Answer question {i + 1}</legend>
            {q.options.map((o, index) => (
              <label
                className={exam.choices[q.id] === index ? "selected" : ""}
                key={o}
              >
                <input
                  type="radio"
                  name={`exam-${q.id}`}
                  checked={exam.choices[q.id] === index}
                  onChange={() => examAnswer(q.id, index)}
                />
                <span className="w-option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{o}</span>
              </label>
            ))}
          </fieldset>
        </section>
      ))}
      <div className="w-exam-submit w-panel">
        <p>
          {Object.keys(exam.choices).length} / {c.questions.length} answered
        </p>
        {confirm ? (
          <>
            <p>
              Submit now? Unanswered questions count as incorrect in this
              preview.
            </p>
            <button
              className="w-button"
              onClick={() => {
                submitExam();
                setConfirm(false);
              }}
            >
              Confirm submission
              <Check size={16} />
            </button>
            <button className="w-text-button" onClick={() => setConfirm(false)}>
              Keep working
            </button>
          </>
        ) : (
          <button className="w-button" onClick={() => setConfirm(true)}>
            Submit exam preview
            <Flag size={16} />
          </button>
        )}
      </div>
    </>
  );
}
export function Flashcards() {
  const { courses, state, toggleCard } = useWorkspace();
  const cards = courses.flatMap((c) =>
    c.questions
      .slice(0, 2)
      .map((q) => ({ ...q, course: c.name, key: `${c.id}:${q.id}` })),
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];
  return (
    <>
      <PageHeading
        eyebrow="RECALL IS A SMALL SUPERPOWER"
        title="Make the idea stick."
        text="Pause, recall, then flip. No rush."
      />
      <div className="w-flashcard-layout">
        <div className="w-flashcard-meta">
          <span>{card.course}</span>
          <span>
            {index + 1} / {cards.length}
          </span>
        </div>
        <button
          className={`w-flashcard ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
          aria-label={
            flipped ? "Show question" : "Flip card to reveal explanation"
          }
        >
          <span className="w-eyebrow">
            {flipped ? "THE CONNECTION" : "CAN YOU RECALL?"}
          </span>
          <h2>{flipped ? card.options[card.answer] : card.prompt}</h2>
          {flipped && <p>{card.explanation}</p>}
          <span className="w-flip-hint">
            <RotateCcw size={15} />
            {flipped ? "Click to return to the question" : "Click to reveal"}
          </span>
        </button>
        <div className="w-flashcard-actions">
          <button
            className="w-button secondary"
            disabled={index === 0}
            onClick={() => {
              setIndex((i) => i - 1);
              setFlipped(false);
            }}
          >
            <ArrowLeft size={15} />
            Previous
          </button>
          <button
            className={`w-button ${state.flashcards.includes(card.key) ? "secondary" : ""}`}
            onClick={() => toggleCard(card.key)}
          >
            <Check size={15} />
            {state.flashcards.includes(card.key)
              ? "Recalled"
              : "I recalled this"}
          </button>
          <button
            className="w-button secondary"
            disabled={index === cards.length - 1}
            onClick={() => {
              setIndex((i) => i + 1);
              setFlipped(false);
            }}
          >
            Next
            <ArrowRight size={15} />
          </button>
        </div>
        <p className="w-note">
          {state.flashcards.length} cards marked recalled in this tab. No points
          are awarded for self-review.
        </p>
      </div>
    </>
  );
}
export function Projects() {
  const { courses } = useWorkspace();
  const [selected, setSelected] = useState<string | null>(null);
  const c = courses.find((c) => c.id === selected);
  return (
    <>
      <PageHeading
        eyebrow="TAKE THE IDEA INTO YOUR WORLD"
        title="Build something you understand."
        text="Small project briefs that turn concepts into explanations."
      />
      <div className="w-practice-grid">
        {courses.map((c) => (
          <article className="w-panel w-project-card" key={c.id}>
            <CourseIcon id={c.id} />
            <span className="w-eyebrow">{c.name.toUpperCase()}</span>
            <h2>Your concept field guide</h2>
            <p>
              Create a one-page guide to {c.concepts[0].toLowerCase()} with an
              example and an explanation.
            </p>
            <button
              className="w-button secondary"
              onClick={() => setSelected(c.id)}
            >
              Open project brief
              <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>
      {c && (
        <section className="w-panel w-project-brief" aria-live="polite">
          <div className="w-section-bar">
            <h2>{c.name}: explain it your way</h2>
            <button className="w-text-button" onClick={() => setSelected(null)}>
              Close brief
            </button>
          </div>
          <ol>
            <li>
              Explain {c.concepts[0].toLowerCase()} in three clear sentences.
            </li>
            <li>Create one example and show each step of your reasoning.</li>
            <li>Describe a common mistake and how to avoid it.</li>
            <li>Finish with one question you would ask a classmate.</li>
          </ol>
          <p className="w-note">
            Create your guide on paper or in your preferred editor. Project
            upload and teacher feedback are planned; this preview accepts no
            files.
          </p>
          <WLink to={`/app/courses/${c.id}`}>Review the concept</WLink>
        </section>
      )}
    </>
  );
}
export function Doubts() {
  const { courses, state, addDoubt } = useWorkspace();
  const [text, setText] = useState("");
  const [course, setCourse] = useState(courses[0].id);
  const [status, setStatus] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="GOOD QUESTIONS MOVE LEARNING FORWARD"
        title="Keep your questions connected."
        text="Draft a question with its subject context. Teacher messaging will be connected later."
      />
      <div className="w-doubts-grid">
        <section className="w-panel">
          <h2>What would you like to understand?</h2>
          <form
            className="w-doubt-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim().length < 5) {
                setStatus("Add a little more detail to your question.");
                return;
              }
              addDoubt(text, course);
              setText("");
              setStatus(
                "Draft saved in this tab. It has not been sent to a teacher.",
              );
            }}
          >
            <label htmlFor="doubt-subject">Subject</label>
            <select
              id="doubt-subject"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label htmlFor="doubt-text">Your question</label>
            <textarea
              id="doubt-text"
              rows={6}
              value={text}
              maxLength={1000}
              required
              onChange={(e) => setText(e.target.value)}
              placeholder="Which part feels unclear? What have you tried so far?"
            />
            <button className="w-button" type="submit">
              Save a local draft
              <Plus size={16} />
            </button>
            <p role="status" className="w-note">
              {status}
            </p>
          </form>
        </section>
        <section className="w-panel">
          <h2>Your drafts</h2>
          {state.doubts.length ? (
            state.doubts.map((d) => (
              <article className="w-doubt-draft" key={d.id}>
                <span className="w-tag">
                  {courses.find((c) => c.id === d.course)?.name} · Not sent
                </span>
                <p>{d.text}</p>
              </article>
            ))
          ) : (
            <Empty
              icon={MessageCircle}
              title="There’s room for your questions."
              text="Your locally saved drafts will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}

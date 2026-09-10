import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Flame,
  Target,
  TrendingUp,
  Clock3,
  Atom,
  FlaskConical,
  Pi,
  Leaf,
  Landmark,
  Layers,
  MessageCircle,
  ChevronRight,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import type { Course } from "./data";
export function PageHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-page-heading">
      <div>
        <span className="w-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}
export function WLink({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`w-button ${secondary ? "secondary" : ""}`} to={to}>
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
export function CourseIcon({ id, size = 25 }: { id: string; size?: number }) {
  const Icon =
    (
      {
        physics: Atom,
        chemistry: FlaskConical,
        mathematics: Pi,
        biology: Leaf,
        science: FlaskConical,
        commerce: Landmark,
      } as Record<string, typeof Atom>
    )[id] || BookOpen;
  return <Icon size={size} strokeWidth={1.5} />;
}
export function CourseCard({ course }: { course: Course }) {
  const { attempts } = useWorkspace();
  const done = attempts.filter((a) => a.courseId === course.id).length;
  return (
    <Link
      to={`/app/courses/${course.id}`}
      className={`w-course-card ${course.theme}`}
    >
      <div className="w-course-icon">
        <CourseIcon id={course.id} />
        <ArrowUpRight size={17} />
      </div>
      <span className="w-eyebrow">CONCEPT SAMPLER</span>
      <h3>{course.name}</h3>
      <p>{course.description}</p>
      <div className="w-course-progress">
        <div>
          <span>
            {done} / {course.questions.length} questions explored
          </span>
          <b>{Math.round((done / course.questions.length) * 100)}%</b>
        </div>
        <div className="w-progress">
          <i style={{ width: `${(done / course.questions.length) * 100}%` }} />
        </div>
      </div>
    </Link>
  );
}
export function Empty({
  icon: Icon = BookOpen,
  title,
  text,
  to,
  label = "Explore practice",
}: {
  icon?: typeof BookOpen;
  title: string;
  text: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="w-empty">
      <Icon size={29} strokeWidth={1.25} />
      <h3>{title}</h3>
      <p>{text}</p>
      {to && <WLink to={to}>{label}</WLink>}
    </div>
  );
}
export function Dashboard() {
  const { courses, attempts, points, state } = useWorkspace();
  const recent = [...attempts]
    .sort((a, b) => b.at - a.at)
    .find((a) =>
      courses.some(
        (c) =>
          c.id === a.courseId &&
          attempts.filter((x) => x.courseId === c.id).length <
            c.questions.length,
      ),
    );
  const next =
    courses.find((c) => c.id === recent?.courseId) ||
    courses.find(
      (c) =>
        attempts.filter((a) => a.courseId === c.id).length < c.questions.length,
    ) ||
    courses[0];
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length
    ? Math.round((correct / attempts.length) * 100)
    : 0;
  const weak = attempts.filter((a) => !a.correct);
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CURIOSITY GOES A LONG WAY"
        title="Your next possibility starts here."
        text={`Your Class ${state.grade} learning space. One concept, one question, one step forward.`}
      />
      <div className="w-dashboard-top">
        <div className="w-continue">
          <div>
            <span className="w-eyebrow">
              {attempts.length ? "KEEP THE MOMENTUM" : "A GOOD PLACE TO BEGIN"}
            </span>
            <h2>
              Make the next
              <br />
              connection.
            </h2>
            <p>
              {next.name} · {next.chapter}
            </p>
            <WLink to={`/app/courses/${next.id}`}>
              {attempts.length ? "Continue learning" : "Start exploring"}
            </WLink>
          </div>
          <div className="w-concept-orbit" aria-hidden="true">
            <i />
            <i />
            <span>
              <CourseIcon id={next.id} size={39} />
            </span>
            <b className="orbit-chip chip-a">Understand</b>
            <b className="orbit-chip chip-b">Practise</b>
            <b className="orbit-chip chip-c">Connect</b>
          </div>
        </div>
        <div className="w-focus-card">
          <div className="w-card-label">
            <Target size={18} />
            <span>TODAY’S FOCUS</span>
          </div>
          <h3>
            {weak.length
              ? "Turn a mistake into understanding."
              : "Give curiosity ten minutes."}
          </h3>
          <p>
            {weak.length
              ? `Revisit ${weak[0].concept.toLowerCase()}, then connect the idea to its explanation.`
              : "Read one short lesson and try its four questions. Every attempt gives you a clearer picture."}
          </p>
          <Link
            to={
              weak.length
                ? `/app/courses/${weak[0].courseId}`
                : `/app/practice/${next.id}`
            }
          >
            {weak.length ? "Revisit the concept" : "Try a practice session"}
            <ArrowRight size={16} />
          </Link>
          <div className="w-focus-foot">
            <Clock3 size={14} />A short, focused session
          </div>
        </div>
      </div>
      <div className="w-stats">
        {[
          [BookOpen, "Questions explored", attempts.length, "In this preview"],
          [Check, "Correct answers", correct, "First submitted answers"],
          [
            TrendingUp,
            "Practice accuracy",
            `${accuracy}%`,
            attempts.length
              ? "Based on your attempts"
              : "Answer a question to begin",
          ],
          [Flame, "Preview points", points, "10 per correct answer"],
        ].map(([Icon, label, value, note]) => {
          const I = Icon as typeof BookOpen;
          return (
            <div className="w-stat" key={String(label)}>
              <I size={18} />
              <span>{String(label)}</span>
              <strong>{String(value)}</strong>
              <small>{String(note)}</small>
            </div>
          );
        })}
      </div>
      <div className="w-section-bar">
        <div>
          <h2>Your courses</h2>
          <p>Chosen for your class and stream.</p>
        </div>
        <Link to="/app/courses">
          View all
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="w-course-grid">
        {courses.slice(0, 3).map((c) => (
          <CourseCard course={c} key={c.id} />
        ))}
      </div>
      <div className="w-dashboard-bottom">
        <section className="w-panel">
          <div className="w-section-bar">
            <h2>Your concept picture</h2>
            <Link to="/app/concept-progress">
              Explore
              <ArrowRight size={15} />
            </Link>
          </div>
          {attempts.length ? (
            <div className="w-concept-rows">
              {courses.map((c) => {
                const rows = attempts.filter((a) => a.courseId === c.id);
                const score = rows.length
                  ? Math.round(
                      (rows.filter((a) => a.correct).length / rows.length) *
                        100,
                    )
                  : 0;
                return (
                  <div className="w-concept-row" key={c.id}>
                    <span>
                      <CourseIcon id={c.id} size={17} />
                      {c.name}
                    </span>
                    <div className="w-progress">
                      <i style={{ width: `${score}%` }} />
                    </div>
                    <b>{rows.length ? `${score}%` : "—"}</b>
                  </div>
                );
              })}
              <p className="w-note">
                Preview accuracy, not a verified mastery score.
              </p>
            </div>
          ) : (
            <Empty
              title="Understanding takes shape here."
              text="Try a few questions to see your first concept signals."
              to="/app/practice"
            />
          )}
        </section>
        <section className="w-panel">
          <div className="w-section-bar">
            <h2>A useful next step</h2>
            <Layers size={18} />
          </div>
          <Link className="w-next-row" to="/app/flashcards">
            <span>
              <Layers size={20} />
            </span>
            <div>
              <h3>Make an idea stick</h3>
              <p>Flip a card. Recall it in your own words.</p>
            </div>
            <ChevronRight size={17} />
          </Link>
          <Link className="w-next-row" to="/app/exams">
            <span>
              <Target size={20} />
            </span>
            <div>
              <h3>Try a short challenge</h3>
              <p>A five-minute exam preview.</p>
            </div>
            <ChevronRight size={17} />
          </Link>
          <Link className="w-next-row" to="/app/doubts">
            <span>
              <MessageCircle size={20} />
            </span>
            <div>
              <h3>Keep a question close</h3>
              <p>Save a local draft for your teacher.</p>
            </div>
            <ChevronRight size={17} />
          </Link>
        </section>
      </div>
    </>
  );
}
export function WorkspaceCourses() {
  const { courses, state } = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow={`CLASS ${state.grade} · YOUR COURSE PLAN`}
        title="Follow the question that interests you."
        text="Open a subject, explore a concept, and put your understanding to work."
      />
      <div className="w-course-grid">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      <div className="w-info-strip">
        <BookOpen size={21} />
        <p>
          These are original concept samplers, not complete syllabuses or
          verified NCERT/PYQ collections. Full curriculum content will be
          reviewed before publication.
        </p>
      </div>
      <section className="w-panel w-future">
        <span className="w-eyebrow">BEYOND YOUR SCHOOL SUBJECTS</span>
        <h2>More ways to build your future.</h2>
        <div>
          {["Coding", "Artificial intelligence", "Cybersecurity"].map((s) => (
            <article key={s}>
              <h3>{s}</h3>
              <p>Separate learning track</p>
              <span className="w-tag">Planned</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
export function ConceptProgress() {
  const { courses, attempts } = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="SEE BEYOND A TOTAL SCORE"
        title="Your understanding, in focus."
        text="Spot what clicked and what deserves another look."
      />
      <div className="w-info-strip">
        <Target size={20} />
        <p>
          These signals use your first answers in this preview. Each concept has
          only a few examples, so this is not enough evidence to certify
          mastery.
        </p>
      </div>
      <div className="w-mastery-grid">
        {courses.map((c) => (
          <section key={c.id} className="w-panel">
            <div className="w-section-bar">
              <h2>
                <CourseIcon id={c.id} size={19} />
                {c.name}
              </h2>
              <Link to={`/app/practice/${c.id}`}>
                Practise
                <ArrowRight size={14} />
              </Link>
            </div>
            {c.concepts.map((concept) => {
              const a = attempts.filter(
                (x) => x.courseId === c.id && x.concept === concept,
              );
              const good = a.filter((x) => x.correct).length;
              return (
                <div key={concept} className="w-mastery-item">
                  <div>
                    <h3>{concept}</h3>
                    <span
                      className={`w-tag ${a.length ? (good === a.length ? "success" : "warm") : ""}`}
                    >
                      {a.length
                        ? good === a.length
                          ? "Promising start"
                          : "Revisit this"
                        : "Not explored"}
                    </span>
                  </div>
                  <div className="w-progress">
                    <i
                      style={{
                        width: a.length ? `${(good / a.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <small>
                    {a.length
                      ? `${good} correct from ${a.length} attempt${a.length > 1 ? "s" : ""} · Limited evidence`
                      : "Your first attempt will appear here."}
                  </small>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
export function Submissions() {
  const { attempts, courses } = useWorkspace();
  const [filter, setFilter] = useState("all");
  const rows = attempts
    .filter((a) => filter === "all" || a.courseId === filter)
    .sort((a, b) => b.at - a.at);
  return (
    <>
      <PageHeading
        eyebrow="EVERY ATTEMPT TELLS YOU SOMETHING"
        title="Your learning trail."
        text="A record of the questions you’ve explored in this browser tab."
      />
      <div className="w-toolbar">
        <label htmlFor="submission-course">Subject</label>
        <select
          id="submission-course"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All subjects</option>
          {courses.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span>{rows.length} submissions</span>
      </div>
      {rows.length ? (
        <div className="w-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Subject</th>
                <th>Result</th>
                <th>Points</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.key}>
                  <td>
                    {a.concept}
                    <small>
                      {new Date(a.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </td>
                  <td>{courses.find((c) => c.id === a.courseId)?.name}</td>
                  <td>
                    <span className={`w-tag ${a.correct ? "success" : "warm"}`}>
                      {a.correct ? "Correct" : "Needs review"}
                    </span>
                  </td>
                  <td>+{a.correct ? 10 : 0}</td>
                  <td>
                    <Link
                      to={`/app/practice/${a.courseId}?question=${a.questionId}`}
                    >
                      View answer
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="Your first attempt belongs here."
          text="Submit a practice answer to start your learning trail."
          to="/app/practice"
        />
      )}
    </>
  );
}
export function Leaderboard() {
  const { points, state, attempts } = useWorkspace();
  const rows = [
    { name: "Learner A", points: 80 },
    { name: "Learner B", points: 60 },
    { name: "Learner C", points: 30 },
    { name: "You", points },
  ].sort((a, b) => b.points - a.points);
  return (
    <>
      <PageHeading
        eyebrow={`CLASS ${state.grade} · ILLUSTRATIVE RANKINGS`}
        title="A little healthy motivation."
        text="Your points are real within this preview. Other learners below are fictional examples."
      />
      <div className="w-rank-hero">
        <Trophy size={35} strokeWidth={1.2} />
        <div>
          <span className="w-eyebrow">YOUR PREVIEW POINTS</span>
          <strong>{points}</strong>
          <p>
            {attempts.length} questions explored · 10 points per correct first
            answer
          </p>
        </div>
        <WLink to="/app/practice">Keep practising</WLink>
      </div>
      <div className="w-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Learner</th>
              <th>Class</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr className={r.name === "You" ? "w-you-row" : ""} key={r.name}>
                <td>
                  <span className="w-rank-number">{i + 1}</span>
                </td>
                <td>
                  <strong>{r.name}</strong>
                  <small>
                    {r.name === "You"
                      ? "Your browser-tab progress"
                      : "Fictional example"}
                  </small>
                </td>
                <td>Class {state.grade}</td>
                <td>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="w-note w-spaced">
        This is not a school or global rank. A live grade-specific leaderboard
        requires trusted server scoring and enrolled students.
      </p>
    </>
  );
}
export function Profile() {
  const { state, courses, attempts, points } = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="YOUR LEARNING IDENTITY"
        title="Every learner has a starting point."
        text="This profile represents your chosen preview class, not a registered account."
      />
      <div className="w-profile-grid">
        <section className="w-panel w-profile-card">
          <div className="w-profile-avatar">S</div>
          <h2>Student preview</h2>
          <p>Class {state.grade}</p>
          <span className="w-tag">No account connected</span>
          <div className="w-profile-stats">
            <div>
              <strong>{attempts.length}</strong>
              <span>Attempts</span>
            </div>
            <div>
              <strong>{points}</strong>
              <span>Points</span>
            </div>
          </div>
          <WLink to="/register" secondary>
            Student signup
          </WLink>
        </section>
        <section className="w-panel">
          <h2>Your course selection</h2>
          <p className="w-note w-spaced">
            Your saved account grade will determine these courses when
            authentication is connected.
          </p>
          {courses.map((c) => (
            <Link key={c.id} to={`/app/courses/${c.id}`} className="w-next-row">
              <span>
                <CourseIcon id={c.id} size={20} />
              </span>
              <div>
                <h3>{c.name}</h3>
                <p>Class {state.grade} concept sampler</p>
              </div>
              <ChevronRight size={16} />
            </Link>
          ))}
          <div className="w-info-strip">
            <Settings2 size={18} />
            <p>
              Use the class selector at the top to explore a different course
              plan. This starts a fresh preview.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
export function WorkspaceSettings() {
  const { reset } = useWorkspace();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="MAKE ROOM FOR YOUR WAY OF LEARNING"
        title="Your workspace settings."
      />
      <section className="w-panel w-settings-panel">
        <h2>Preview data</h2>
        <p>
          Practice answers, exam choices, flashcard checks, and doubt drafts
          stay in this browser tab. They are not synced to an account or sent to
          a teacher.
        </p>
        {confirm ? (
          <div className="w-reset-confirm">
            <p>
              Clear all preview progress in this tab? Your chosen class will
              stay the same.
            </p>
            <button
              className="w-button danger"
              onClick={() => {
                reset();
                setConfirm(false);
                setMessage("Preview progress cleared. You can start again.");
              }}
            >
              Clear preview progress
            </button>
            <button className="w-text-button" onClick={() => setConfirm(false)}>
              Keep my progress
            </button>
          </div>
        ) : (
          <button
            className="w-button secondary"
            onClick={() => setConfirm(true)}
          >
            <RotateCcw size={16} />
            Reset preview progress
          </button>
        )}
        <p role="status" className="w-note">
          {message}
        </p>
      </section>
      <section className="w-panel w-settings-panel">
        <h2>Motion and accessibility</h2>
        <p>
          The workspace follows your device’s reduced-motion setting. Keyboard
          focus, labeled fields, and responsive navigation are included. Change
          your device’s motion preference to reduce animations throughout TIPIX.
        </p>
      </section>
      <section className="w-panel w-settings-panel">
        <h2>Account and privacy</h2>
        <p>
          Password changes, account deletion, and notification settings will
          become available with the secure account service.
        </p>
        <WLink to="/login" secondary>
          Go to account pages
        </WLink>
      </section>
    </>
  );
}

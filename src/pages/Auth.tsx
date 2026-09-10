import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  BookOpen,
  GraduationCap,
  LockKeyhole,
  Mail,
  Pencil,
  Info,
} from "lucide-react";
import {
  GRADES,
  STREAMS,
  emptyRegistration,
  courseSelection,
  isStream,
  validateStep,
  registrationProfile,
  type Registration,
} from "../lib/studentProfile";
import "./Auth.css";
type Mode = "login" | "register" | "forgot";
export default function Auth({ mode }: { mode: Mode }) {
  return <AuthExperience key={mode} mode={mode} />;
}
function AuthExperience({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Registration>({ ...emptyRegistration });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [show, setShow] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = courseSelection(data.grade, data.stream);
  function update<K extends keyof Registration>(
    key: K,
    value: Registration[K],
  ) {
    setData((d) => ({
      ...d,
      [key]: value,
      ...(key === "grade"
        ? { stream: "", gradeConfirmed: false }
        : key === "stream"
          ? { gradeConfirmed: false }
          : {}),
    }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
    setStatus("");
  }
  function move(next: number) {
    setStep(next);
    setErrors({});
    setStatus("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function fail(next: Record<string, string>) {
    setErrors(next);
    setStatus("Please check the highlighted fields.");
    requestAnimationFrame(() =>
      form.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)
        ?.focus(),
    );
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isRegister) {
      const next = validateStep(data, step);
      if (Object.keys(next).length) {
        fail(next);
        return;
      }
      if (step < 2) {
        move(step + 1);
        return;
      }
      for (const s of [0, 1]) {
        const previous = validateStep(data, s);
        if (Object.keys(previous).length) {
          setStep(s);
          fail(previous);
          return;
        }
      }
      registrationProfile(data);
      setStatus(
        "Your details are ready. Account creation is not connected yet, so nothing has been saved. Your selected class and stream will be used when registration is enabled.",
      );
      return;
    }
    const next: Record<string, string> = {};
    if (!/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      next.email = "Enter a valid email address.";
    if (mode === "login" && !data.password)
      next.password = "Enter your password.";
    if (Object.keys(next).length) {
      fail(next);
      return;
    }
    setStatus(
      mode === "forgot"
        ? "Password recovery is not connected yet. No email has been sent."
        : "Sign-in is not connected yet. No login attempt has been made.",
    );
  }
  function field(
    key:
      | "fullName"
      | "email"
      | "school"
      | "city"
      | "password"
      | "confirmPassword",
    label: string,
    placeholder: string,
    autoComplete: string,
  ) {
    const password = key === "password" || key === "confirmPassword";
    return (
      <div className="a-field">
        <label htmlFor={`a-${key}`}>{label}</label>
        <div className="a-input-wrap">
          <input
            id={`a-${key}`}
            name={key}
            type={
              password
                ? show
                  ? "text"
                  : "password"
                : key === "email"
                  ? "email"
                  : "text"
            }
            autoComplete={autoComplete}
            autoCapitalize={key === "email" ? "none" : undefined}
            spellCheck={key === "email" || password ? false : undefined}
            placeholder={placeholder}
            value={data[key]}
            onChange={(e) => update(key, e.target.value)}
            required
            maxLength={
              password
                ? 128
                : key === "email"
                  ? 254
                  : key === "school"
                    ? 160
                    : 100
            }
            aria-invalid={!!errors[key]}
            aria-describedby={
              errors[key]
                ? `${key}-error`
                : key === "password" && isRegister
                  ? "password-help"
                  : undefined
            }
          />
          {password && (
            <button
              type="button"
              aria-label={`${show ? "Hide" : "Show"} ${key === "confirmPassword" ? "confirmation password" : "password"}`}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {errors[key] && (
          <span className="a-error" id={`${key}-error`}>
            {errors[key]}
          </span>
        )}
      </div>
    );
  }
  const title = isRegister
    ? [
        "Make room for possibility.",
        "Make this learning yours.",
        "A quick check. A clear start.",
      ][step]
    : mode === "login"
      ? "Good to see you again."
      : "Find your way back.";
  return (
    <div className="auth-v2">
      <aside className="a-story">
        <Link to="/" className="a-back">
          <ArrowLeft size={15} />
          Back to TIPIX
        </Link>
        <div className="a-story-copy">
          <p className="a-kicker">EVERY CONCEPT. A NEW CONNECTION.</p>
          <h2>
            Your next
            <br />
            “I get it”
            <br />
            <span>starts here.</span>
          </h2>
          <p>
            A little curiosity.
            <br />A path that’s made for you.
          </p>
        </div>
        <div className="a-constellation" aria-hidden="true">
          <div className="a-orbit a-orbit-one">
            <i />
            <i />
          </div>
          <div className="a-orbit a-orbit-two">
            <i />
            <i />
          </div>
          <div className="a-orbit a-orbit-three">
            <i />
          </div>
          <div className="a-core">
            <BookOpen size={30} strokeWidth={1} />
          </div>
          <span className="a-orbit-label label-learn">LEARN</span>
          <span className="a-orbit-label label-connect">CONNECT</span>
          <span className="a-orbit-label label-grow">GROW</span>
        </div>
        <div className="a-story-bottom">
          <span>01 / CURIOSITY</span>
          <span>∞ POSSIBILITIES</span>
        </div>
      </aside>
      <section className="a-form-panel">
        <div className="a-form-container">
          <div className="a-topline">
            <span>YOUR LEARNING SPACE</span>
            <span>
              {isRegister
                ? "NEW STUDENT"
                : mode === "login"
                  ? "WELCOME BACK"
                  : "ACCOUNT HELP"}
            </span>
          </div>
          <div className="a-mode-switch" aria-label="Account pages">
            <Link
              className={mode === "login" ? "is-active" : ""}
              to="/login"
              aria-current={mode === "login" ? "page" : undefined}
            >
              Log in
            </Link>
            <Link
              className={isRegister ? "is-active" : ""}
              to="/register"
              aria-current={isRegister ? "page" : undefined}
            >
              Sign up
            </Link>
          </div>
          {isRegister && (
            <ol className="a-steps" aria-label="Registration progress">
              {["Account", "Your studies", "Review"].map((s, i) => (
                <li
                  className={
                    step === i ? "current" : step > i ? "complete" : ""
                  }
                  key={s}
                  aria-current={step === i ? "step" : undefined}
                >
                  <span>{step > i ? <Check size={12} /> : i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}
          <div key={`${mode}-${step}`} className="a-step-enter">
            <h1 tabIndex={-1} ref={heading}>
              {title}
            </h1>
            <p className="a-subtitle">
              {isRegister
                ? [
                    "A few details today. A world to explore tomorrow.",
                    "Your current class helps us choose the right courses.",
                    "Check your details before taking the next step.",
                  ][step]
                : mode === "login"
                  ? "Your questions, your progress, your next chapter."
                  : "Enter your account email to begin password recovery."}
            </p>
            <form ref={form} onSubmit={submit} noValidate>
              {isRegister && step === 0 && (
                <>
                  {field(
                    "fullName",
                    "Student’s full name",
                    "As used at school",
                    "name",
                  )}
                  {field("email", "Email address", "you@example.com", "email")}
                  <p className="a-field-note">
                    Use an email you can access for account verification and
                    recovery.
                  </p>
                  {field(
                    "password",
                    "Create a password",
                    "At least 8 characters",
                    "new-password",
                  )}
                  <p id="password-help" className="a-field-note">
                    Use 8–128 characters. A longer, unique passphrase is a good
                    choice.
                  </p>
                  {field(
                    "confirmPassword",
                    "Confirm password",
                    "Enter your password again",
                    "new-password",
                  )}
                </>
              )}
              {isRegister && step === 1 && (
                <>
                  {field(
                    "school",
                    "School name",
                    "Your current school",
                    "organization",
                  )}
                  {field(
                    "city",
                    "School city or town",
                    "For example, Hyderabad",
                    "address-level2",
                  )}
                  <fieldset className="a-grade-field">
                    <legend>Which class are you studying in?</legend>
                    <p>
                      Select your current class, not the one you plan to join.
                    </p>
                    <div className="a-grade-grid">
                      {GRADES.map((g) => (
                        <label
                          key={g}
                          className={data.grade === String(g) ? "chosen" : ""}
                        >
                          <input
                            type="radio"
                            name="grade"
                            value={g}
                            checked={data.grade === String(g)}
                            onChange={() => update("grade", String(g))}
                            aria-describedby={
                              errors.grade ? "grade-error" : "grade-help"
                            }
                          />
                          <span>
                            Class <b>{g}</b>
                          </span>
                          {data.grade === String(g) && <Check size={13} />}
                        </label>
                      ))}
                    </div>
                    {errors.grade && (
                      <span id="grade-error" className="a-error">
                        {errors.grade}
                      </span>
                    )}
                    <p id="grade-help" className="a-field-note">
                      Your course level will follow this selection.
                    </p>
                  </fieldset>
                  {Number(data.grade) >= 11 && (
                    <div className="a-field">
                      <label htmlFor="a-stream">
                        Your current subject stream
                      </label>
                      <select
                        id="a-stream"
                        name="stream"
                        value={data.stream}
                        onChange={(e) => update("stream", e.target.value)}
                        aria-invalid={!!errors.stream}
                        aria-describedby={
                          errors.stream ? "stream-error" : undefined
                        }
                      >
                        <option value="">Choose a stream</option>
                        {Object.entries(STREAMS).map(([key, s]) => (
                          <option value={key} key={key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      {errors.stream && (
                        <span id="stream-error" className="a-error">
                          {errors.stream}
                        </span>
                      )}
                      <p className="a-field-note">
                        Choose the subjects you study at school. Additional
                        streams can be added as course coverage expands.
                      </p>
                    </div>
                  )}
                  <div className="a-course-preview" aria-live="polite">
                    <GraduationCap size={20} />
                    <div>
                      <strong>
                        {data.grade
                          ? `Your Class ${data.grade} course plan`
                          : "Your course plan starts with your class"}
                      </strong>
                      <p>
                        {selected.length
                          ? selected.join(" · ")
                          : data.grade
                            ? "Choose a stream to see your planned subjects."
                            : "Choose a class above to see your planned subjects."}
                      </p>
                      {data.grade && Number(data.grade) <= 10 && (
                        <small>
                          CBSE-aligned · Science includes Physics, Chemistry,
                          and Biology.
                        </small>
                      )}
                      {Number(data.grade) >= 11 && (
                        <small>
                          NCERT-aligned course plan · Subject coverage varies by
                          stream.
                        </small>
                      )}
                    </div>
                  </div>
                </>
              )}
              {isRegister && step === 2 && (
                <>
                  <div className="a-review">
                    <div className="a-review-heading">
                      <span>STUDENT DETAILS</span>
                      <button type="button" onClick={() => move(0)}>
                        <Pencil size={13} />
                        Edit
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>Full name</dt>
                        <dd>{data.fullName.trim()}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{data.email.trim()}</dd>
                      </div>
                      <div>
                        <dt>Password</dt>
                        <dd>Set · Hidden for your privacy</dd>
                      </div>
                    </dl>
                    <div className="a-review-heading">
                      <span>YOUR STUDIES</span>
                      <button type="button" onClick={() => move(1)}>
                        <Pencil size={13} />
                        Edit
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>School</dt>
                        <dd>{data.school.trim()}</dd>
                      </div>
                      <div>
                        <dt>City / town</dt>
                        <dd>{data.city.trim()}</dd>
                      </div>
                      <div>
                        <dt>Current class</dt>
                        <dd className="a-grade-badge">Class {data.grade}</dd>
                      </div>
                      {isStream(data.stream) && (
                        <div>
                          <dt>Stream</dt>
                          <dd>{STREAMS[data.stream].label}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Planned subjects</dt>
                        <dd>{selected.join(", ")}</dd>
                      </div>
                    </dl>
                  </div>
                  <label className="a-confirm">
                    <input
                      type="checkbox"
                      name="gradeConfirmed"
                      checked={data.gradeConfirmed}
                      onChange={(e) =>
                        update("gradeConfirmed", e.target.checked)
                      }
                      aria-describedby={
                        errors.gradeConfirmed
                          ? "gradeConfirmed-error"
                          : undefined
                      }
                    />
                    <span>
                      I confirm that <strong>Class {data.grade}</strong>
                      {isStream(data.stream)
                        ? ` and ${STREAMS[data.stream].label.toLowerCase()}`
                        : ""}{" "}
                      matches my current studies. These details will determine
                      my course selection.
                    </span>
                  </label>
                  {errors.gradeConfirmed && (
                    <span id="gradeConfirmed-error" className="a-error">
                      {errors.gradeConfirmed}
                    </span>
                  )}
                </>
              )}
              {!isRegister && (
                <>
                  {field("email", "Email address", "you@example.com", "email")}
                  {mode === "login" && (
                    <>
                      {field(
                        "password",
                        "Password",
                        "Enter your password",
                        "current-password",
                      )}
                      <Link className="a-forgot" to="/forgot-password">
                        Forgot password?
                      </Link>
                    </>
                  )}
                </>
              )}
              <div className="a-form-actions">
                {isRegister && step > 0 && (
                  <button
                    type="button"
                    className="a-previous"
                    onClick={() => move(step - 1)}
                    aria-label="Previous registration step"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <button className="a-submit" type="submit">
                  {isRegister
                    ? step === 0
                      ? "Continue to your studies"
                      : step === 1
                        ? "Review your details"
                        : "Confirm student details"
                    : mode === "login"
                      ? "Log in"
                      : "Continue with email"}
                  <ArrowRight size={17} />
                </button>
              </div>
              <p className="a-status" role="status">
                {status}
              </p>
            </form>
          </div>
          <Link
            className="a-preview-entry"
            to={
              isRegister && step === 2
                ? `/app/dashboard?grade=${data.grade}&stream=${data.stream}`
                : "/app/dashboard"
            }
          >
            Explore the student workspace preview <ArrowRight size={15} />
          </Link>
          <div className="a-service-note">
            <Info size={15} />
            <p>
              Account preview — sign-in and account creation are not connected
              yet. Details entered here are not saved.
            </p>
          </div>
          <p className="a-secure-note">
            <LockKeyhole size={13} />
            Your password is never shown in the review.
          </p>
          {mode === "forgot" && (
            <Link to="/login" className="a-back-login">
              <ArrowLeft size={14} />
              Back to log in
            </Link>
          )}
          {isRegister && (
            <p className="a-teacher-note">
              Student signup only. Teacher access is managed separately.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

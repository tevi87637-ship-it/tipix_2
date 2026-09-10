import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { Eyebrow } from "../components/UI";
type Mode = "login" | "register" | "forgot";
export default function Auth({ mode }: { mode: Mode }) {
  return <AuthForm key={mode} mode={mode} />;
}
function AuthForm({ mode }: { mode: Mode }) {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isRegister = mode === "register";
  const title =
    mode === "login"
      ? "Welcome back."
      : isRegister
        ? "Your next chapter starts here."
        : "Let’s get you back in.";
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const email = String(data.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (
      mode !== "forgot" &&
      String(data.get("password") || "").length < (isRegister ? 8 : 1)
    )
      next.password = isRegister
        ? "Use at least 8 characters."
        : "Enter your password.";
    if (isRegister) {
      if (String(data.get("name") || "").trim().length < 2)
        next.name = "Enter your name.";
      if (!String(data.get("school") || "").trim())
        next.school = "Enter your school name.";
      if (!data.get("grade")) next.grade = "Choose your class.";
    }
    setErrors(next);
    setStatus(
      Object.keys(next).length
        ? "Please check the highlighted fields."
        : mode === "forgot"
          ? "Your email format is valid. Password recovery is not connected yet; no email was sent."
          : isRegister
            ? "Your details pass the frontend checks. Registration is not connected yet; no account was created or details saved."
            : "Your details pass the frontend checks. Sign-in is not connected yet; no authentication was attempted.",
    );
    if (Object.keys(next).length)
      e.currentTarget
        .querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)
        ?.focus();
  }
  const field = (
    name: string,
    label: string,
    type = "text",
    autoComplete?: string,
  ) => (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        required
      />
      {errors[name] && (
        <span className="field-error" id={`${name}-error`}>
          {errors[name]}
        </span>
      )}
    </div>
  );
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Eyebrow>THE NEXT “I GET IT” MOMENT</Eyebrow>
        <h2>
          Closer than
          <br />
          you think.
        </h2>
        <p>
          One lesson. One question.
          <br />
          One new way of seeing the world.
        </p>
        <div className="auth-orbit" aria-hidden="true">
          <span>✳</span>
        </div>
        <small>Learn · Practise · Understand · Grow</small>
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <Eyebrow>
            {isRegister
              ? "STUDENT REGISTRATION"
              : mode === "login"
                ? "YOUR LEARNING SPACE"
                : "PASSWORD RECOVERY"}
          </Eyebrow>
          <h1>{title}</h1>
          <p className="muted">
            {isRegister
              ? "A little curiosity can take you a long way."
              : mode === "login"
                ? "Pick up where your curiosity left off."
                : "Enter the email associated with your account."}
          </p>
          <div className="preview-notice">
            <Info size={17} />
            <p>
              Frontend preview. Account services will be available after the
              secure backend is connected.
            </p>
          </div>
          <form onSubmit={submit} noValidate>
            {isRegister && field("name", "Full name", "text", "name")}
            {field("email", "Email address", "email", "email")}
            {isRegister && (
              <div className="form-row">
                {field("school", "School name", "text", "organization")}
                <div className="form-field">
                  <label htmlFor="grade">Class</label>
                  <select
                    id="grade"
                    name="grade"
                    defaultValue=""
                    required
                    aria-invalid={!!errors.grade}
                    aria-describedby={errors.grade ? "grade-error" : undefined}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {[6, 7, 8, 9, 10, 11, 12].map((x) => (
                      <option value={x} key={x}>
                        Class {x}
                      </option>
                    ))}
                  </select>
                  {errors.grade && (
                    <span className="field-error" id="grade-error">
                      {errors.grade}
                    </span>
                  )}
                </div>
              </div>
            )}
            {mode !== "forgot" && (
              <div className="form-field">
                <label htmlFor="password">
                  Password{isRegister && <span>At least 8 characters</span>}
                </label>
                <div className="password-input">
                  <input
                    id="password"
                    name="password"
                    type={show ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    minLength={isRegister ? 8 : 1}
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="field-error" id="password-error">
                    {errors.password}
                  </span>
                )}
              </div>
            )}
            {mode === "login" && (
              <Link className="forgot-link" to="/forgot-password">
                Forgot password?
              </Link>
            )}
            <button className="button auth-submit" type="submit">
              {isRegister
                ? "Check registration details"
                : mode === "login"
                  ? "Check sign-in details"
                  : "Check email address"}
              <ArrowRight size={16} />
            </button>
            <p className="form-status" role="status">
              {status}
            </p>
          </form>
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                New to TIPIX? <Link to="/register">Get started</Link>
              </>
            ) : (
              <>
                Already exploring? <Link to="/login">Back to log in</Link>
              </>
            )}
          </p>
          {isRegister && (
            <p className="auth-footnote">
              Teacher and administrator access will be provisioned by authorized
              school administrators.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

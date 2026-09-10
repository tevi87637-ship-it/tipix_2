import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  ClipboardList,
  Send,
  ChartNoAxesCombined,
  Trophy,
  UserRound,
  Settings,
  Menu,
  X,
  ArrowUpRight,
  Layers,
  FolderKanban,
  MessageCircle,
  ChevronDown,
  FlaskConical,
} from "lucide-react";
import { GRADES, STREAMS } from "../lib/studentProfile";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";
import "./Workspace.css";
const links = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["courses", "Courses", BookOpen],
  ["practice", "Practice", PenLine],
  ["exams", "Exams", ClipboardList],
  ["submissions", "Submissions", Send],
  ["concept-progress", "Concept progress", ChartNoAxesCombined],
  ["leaderboard", "Leaderboard", Trophy],
  ["flashcards", "Flashcards", Layers],
  ["projects", "Projects", FolderKanban],
  ["doubts", "My doubts", MessageCircle],
] as const;
function GradeSetup({ onClose }: { onClose?: () => void }) {
  const { state, setGrade } = useWorkspace();
  const [g, setG] = useState(state.grade);
  const [s, setS] = useState(state.stream);
  return (
    <section className="w-setup">
      <span className="w-eyebrow">STUDENT WORKSPACE PREVIEW</span>
      <h1>Make this space yours.</h1>
      <p>
        Choose a class to explore its course plan. This is a demo, and no
        account is required.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setGrade(g, s);
          onClose?.();
        }}
      >
        <label htmlFor="w-grade">Current class</label>
        <select
          id="w-grade"
          value={g}
          required
          onChange={(e) => {
            setG(e.target.value);
            setS("");
          }}
        >
          <option value="">Choose your class</option>
          {GRADES.map((n) => (
            <option value={n} key={n}>
              Class {n}
            </option>
          ))}
        </select>
        {Number(g) >= 11 && (
          <>
            <label htmlFor="w-stream">Subject stream</label>
            <select
              id="w-stream"
              value={s}
              required
              onChange={(e) => setS(e.target.value)}
            >
              <option value="">Choose your stream</option>
              {Object.entries(STREAMS).map(([k, v]) => (
                <option value={k} key={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </>
        )}
        {state.grade && (
          <p className="w-note">
            Switching classes starts a fresh preview and clears the current
            tab’s sample answers.
          </p>
        )}
        <button className="w-button" type="submit">
          {state.grade ? "Start a fresh class preview" : "Explore my workspace"}
          <ArrowUpRight size={16} />
        </button>
        {onClose && (
          <button className="w-text-button" type="button" onClick={onClose}>
            Keep current class
          </button>
        )}
      </form>
    </section>
  );
}
function Shell() {
  const { state } = useWorkspace();
  const [menu, setMenu] = useState(false);
  const [changeGrade, setChangeGrade] = useState(false);
  const location = useLocation();
  const [motionPaused, setMotionPaused] = useState(false);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    document.title = "TIPIX — Student workspace";
  }, [location.pathname]);
  useEffect(() => {
    const model = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!model?.registerTool) return;
    const abort = new AbortController();
    try {
      Promise.resolve(
        model.registerTool(
          {
            name: "read_tipix_preview_profile",
            description:
              "Read the selected class and stream in the local student preview. Does not authenticate or change course access.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: () => ({
              grade: state.grade,
              stream: state.stream,
              mode: "local-preview",
            }),
          },
          { signal: abort.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => abort.abort();
  }, [state.grade, state.stream]);
  return (
    <div className={`workspace ${motionPaused ? "w-motion-paused" : ""}`}>
      <a href="#workspace-main" className="skip-link">
        Skip to workspace
      </a>
      <aside className={`w-sidebar ${menu ? "open" : ""}`}>
        <div className="w-brand">
          <Link to="/" aria-label="TIPIX home">
            <span>✳</span>TIPIX
          </Link>
          <button
            aria-label="Close workspace menu"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="w-space-label">YOUR LEARNING SPACE</div>
        <nav aria-label="Student navigation">
          {links.map(([path, label, Icon]) => (
            <NavLink key={path} to={`/app/${path}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="w-sidebar-bottom">
          <NavLink to="/app/profile">
            <UserRound size={18} />
            Profile
          </NavLink>
          <NavLink to="/app/settings">
            <Settings size={18} />
            Settings
          </NavLink>
          <Link to="/login" className="w-exit">
            Back to account pages
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      {menu && (
        <button
          className="w-menu-scrim"
          aria-label="Close workspace menu overlay"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="w-main">
        <header className="w-topbar">
          <div>
            <button
              className="w-mobile-menu"
              aria-label="Open workspace menu"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>Learning, one connection at a time.</span>
          </div>
          <div>
            <button
              className="w-grade-switch"
              onClick={() => setChangeGrade(true)}
            >
              <GraduationIcon />
              {state.grade ? `Class ${state.grade}` : "Choose class"}
              <ChevronDown size={13} />
            </button>
            <Link
              className="w-avatar"
              to="/app/profile"
              aria-label="Your preview profile"
            >
              S
            </Link>
          </div>
        </header>
        <div className="w-preview-banner">
          <FlaskConical size={14} />
          <span>
            Student preview · Progress stays in this browser tab. No live
            account or school records.
          </span>
        </div>
        <main id="workspace-main" className="w-content">
          {!state.grade || changeGrade ? (
            <GradeSetup
              onClose={state.grade ? () => setChangeGrade(false) : undefined}
            />
          ) : (
            <div className="w-page-enter" key={location.pathname}>
              <Outlet />
            </div>
          )}
        </main>
        <div className="w-bottom-note">
          <button
            className="w-motion-toggle"
            aria-pressed={motionPaused}
            onClick={() => setMotionPaused(!motionPaused)}
          >
            {motionPaused ? "Resume motion" : "Pause motion"}
          </button>
          TIPIX · A little progress, a new possibility.
        </div>
      </div>
    </div>
  );
}
function GraduationIcon() {
  return <BookOpen size={14} />;
}
export default function StudentLayout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}

import { useAuth, useStudentProfile } from "../auth/AuthProvider";
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
function Shell() {
  const { state } = useWorkspace();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const profile = useStudentProfile();
  const {signOut} = useAuth();
  const [signOutError, setSignOutError] = useState("");
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
          <button className="w-exit w-signout" onClick={() => void signOut().catch(e=>setSignOutError(e.message))}>Sign out <ArrowUpRight size={14} /></button><p className="w-note" role="status">{signOutError}</p>
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
              disabled title="Your registered class determines your courses"
            >
              <GraduationIcon />
              {state.grade ? `Class ${state.grade}` : "Choose class"}
              <ChevronDown size={13} />
            </button>
            <Link
              className="w-avatar"
              to="/app/profile"
              aria-label="Your student profile"
            >
              {profile.full_name.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>
        <div className="w-preview-banner">
          <FlaskConical size={14} />
          <span>
            Verified student account · Learning activities are demonstration content. Practice progress stays in this browser tab.
          </span>
        </div>
        <main id="workspace-main" className="w-content">
          <div className="w-page-enter" key={location.pathname}>
            <Outlet />
          </div>
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

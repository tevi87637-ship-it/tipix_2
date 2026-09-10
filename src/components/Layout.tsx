import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="TIPIX home">
      <span className="logo-symbol" aria-hidden="true">
        ✳
      </span>
      <span>TIPIX</span>
    </Link>
  );
}
export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
    const title =
      location.pathname === "/courses"
        ? "Explore courses"
        : location.pathname === "/for-schools"
          ? "For schools"
          : location.pathname === "/login"
            ? "Log in"
            : location.pathname === "/register"
              ? "Get started"
              : location.pathname === "/forgot-password"
                ? "Password recovery"
                : "Every concept. Every possibility.";
    document.title = `TIPIX — ${title}`;
  }, [location]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <Logo />
        <nav aria-label="Main navigation" className="desktop-nav">
          <NavLink to="/courses">Courses</NavLink>
          <Link to="/#how-it-works">How it works</Link>
          <NavLink to="/for-schools">For schools</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/login" className="login-link">
            Log in
          </Link>
          <Link to="/register" className="button button-small">
            Get started
            <ArrowUpRight size={14} />
          </Link>
          <button
            className="menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <Link to="/courses">Courses</Link>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/for-schools">For schools</Link>
            <Link to="/login">Log in</Link>
          </nav>
        )}
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer>
        <Logo />
        <span>Every concept opens a possibility.</span>
        <div>
          <Link to="/courses">Courses</Link>
          <Link to="/for-schools">For schools</Link>
        </div>
        <small>© {new Date().getFullYear()} TIPIX</small>
      </footer>
    </>
  );
}

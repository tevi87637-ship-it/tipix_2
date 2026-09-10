import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
export function ButtonLink({
  to,
  children,
  secondary = false,
  className = "",
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      className={`button ${secondary ? "button-secondary" : ""} ${className}`}
      to={to}
    >
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

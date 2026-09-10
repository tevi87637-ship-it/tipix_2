import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Atom,
  FlaskConical,
  Pi,
  Leaf,
  Landmark,
  Code2,
  BrainCircuit,
  Shield,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { ButtonLink, Eyebrow } from "../components/UI";
const subjects = [
  {
    name: "Physics",
    icon: Atom,
    color: "blue",
    text: "Explore motion, matter, energy, and the rules that connect them.",
    chapters: [
      "Units and Measurements",
      "Motion in a Straight Line",
      "Motion in a Plane",
      "Laws of Motion",
    ],
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    color: "peach",
    text: "Look closer at the substances and reactions that shape our world.",
    chapters: [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
    ],
  },
  {
    name: "Mathematics",
    icon: Pi,
    color: "violet",
    text: "Discover patterns. Build logic. Find more than one way forward.",
    chapters: [
      "Sets",
      "Relations and Functions",
      "Trigonometric Functions",
      "Complex Numbers and Quadratic Equations",
    ],
  },
  {
    name: "Biology",
    icon: Leaf,
    color: "green",
    text: "Make sense of living systems, from a single cell to an ecosystem.",
    chapters: [
      "The Living World",
      "Biological Classification",
      "Plant Kingdom",
      "Animal Kingdom",
    ],
  },
  {
    name: "Commerce",
    icon: Landmark,
    color: "gold",
    text: "Understand how businesses, markets, and financial decisions work.",
    chapters: [
      "Business, Trade and Commerce",
      "Forms of Business Organisation",
      "Private, Public and Global Enterprises",
      "Business Services",
    ],
  },
];
const math12 = [
  "Relations and Functions",
  "Inverse Trigonometric Functions",
  "Matrices",
  "Determinants",
];
export default function Courses() {
  const [grade, setGrade] = useState(11);
  const [selected, setSelected] = useState<string | null>(null);
  const subject = subjects.find((s) => s.name === selected);
  return (
    <div className="courses-page content-width">
      <div className="page-heading">
        <Eyebrow>FOLLOW YOUR CURIOSITY</Eyebrow>
        <h1>
          A world to understand.
          <br />
          <span className="subtle">A place to begin.</span>
        </h1>
        <p className="muted">
          Choose your class, then find the subject that sparks something.
        </p>
      </div>
      <div
        className="grade-selector"
        role="group"
        aria-label="Choose your class"
      >
        {[6, 7, 8, 9, 10, 11, 12].map((g) => (
          <button
            key={g}
            aria-pressed={grade === g}
            onClick={() => {
              setGrade(g);
              setSelected(null);
            }}
          >
            Class {g}
          </button>
        ))}
      </div>
      <div className="catalog-heading">
        <h2>Class {grade}</h2>
        <span>
          {grade < 11
            ? "CBSE-aligned course plan"
            : "NCERT-aligned course plan"}{" "}
          · Frontend preview
        </span>
      </div>
      <p className="catalog-note">
        {grade < 11
          ? "Physics, Chemistry, and Biology are presented as areas within integrated Science."
          : "Subject choices depend on your school and stream."}{" "}
        Full syllabus coverage will be verified before content publication.
      </p>
      <div className="subject-grid">
        {subjects
          .filter((s) => grade > 10 || s.name !== "Commerce")
          .map((s) => (
            <button
              className={`subject-card ${s.color} ${selected === s.name ? "selected" : ""}`}
              key={s.name}
              onClick={() => setSelected(s.name)}
              aria-pressed={selected === s.name}
            >
              <div className="subject-card-top">
                <s.icon size={29} />
                <ArrowRight size={20} />
              </div>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
              <span>
                {grade < 11 &&
                ["Physics", "Chemistry", "Biology"].includes(s.name)
                  ? "SCIENCE EXPLORATION"
                  : "SUBJECT EXPLORATION"}
              </span>
            </button>
          ))}
      </div>
      {subject && (
        <section className="chapter-preview" aria-live="polite">
          <div className="catalog-heading">
            <h2>
              {subject.name} · Class {grade}
            </h2>
            <button className="text-link" onClick={() => setSelected(null)}>
              <ArrowLeft size={15} />
              Close preview
            </button>
          </div>
          {grade === 11 || (grade === 12 && subject.name === "Mathematics") ? (
            <>
              <p className="muted">
                Selected chapter examples, followed by the planned assessment
                sequence. This is not a complete syllabus.
              </p>
              <div
                className="chapter-path"
                tabIndex={0}
                aria-label="Chapter preview; scroll horizontally"
              >
                {[
                  ...(grade === 12 ? math12 : subject.chapters),
                  "NCERT Questions",
                  "Mock Test",
                  "Final Exam",
                ].map((c, i) => (
                  <div className="chapter-node" key={c}>
                    <span>
                      {i < 4 ? (
                        <BookOpen size={18} />
                      ) : (
                        <GraduationCap size={18} />
                      )}
                    </span>
                    <small>{i < 4 ? `CHAPTER ${i + 1}` : "ASSESSMENT"}</small>
                    <h3>{c}</h3>
                    <p>Preview · Coming in a later phase</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">
              The class-specific chapter list is pending curriculum
              verification. No lesson or assessment content is published yet.
            </p>
          )}
        </section>
      )}
      <section className="tracks-section">
        <Eyebrow>BEYOND THE CLASSROOM</Eyebrow>
        <h2>Build skills for what’s next.</h2>
        <div className="track-grid">
          {[
            [Code2, "Coding", "Think logically. Create something of your own."],
            [
              BrainCircuit,
              "Artificial intelligence",
              "Understand the ideas behind intelligent systems.",
            ],
            [
              Shield,
              "Cybersecurity",
              "Learn how to keep a connected world secure.",
            ],
          ].map(([Icon, name, text]) => {
            const I = Icon as typeof Code2;
            return (
              <div className="track-card" key={String(name)}>
                <I size={24} />
                <h3>{String(name)}</h3>
                <p>{String(text)}</p>
                <span className="demo-label">Separate track · Planned</span>
              </div>
            );
          })}
        </div>
      </section>
      <div className="catalog-cta">
        <div>
          <h2>Your learning story starts here.</h2>
          <p className="muted">Explore the student registration preview.</p>
        </div>
        <ButtonLink to="/register">Get started</ButtonLink>
      </div>
    </div>
  );
}

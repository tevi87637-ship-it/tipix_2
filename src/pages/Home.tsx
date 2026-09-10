import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  Target,
  TrendingUp,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ButtonLink, Eyebrow, SectionHeading } from "../components/UI";
import DashboardPreview from "../components/DashboardPreview";
const CrystalField = lazy(() => import("../components/CrystalField"));
gsap.registerPlugin(ScrollTrigger);
const steps = [
  {
    n: "01",
    label: "Learn",
    title: "Find your way into any concept.",
    text: "Start with a clear explanation. Connect an unfamiliar idea to something you already understand.",
    icon: BookOpen,
  },
  {
    n: "02",
    label: "Practice",
    title: "Turn “I think” into “I know.”",
    text: "Put an idea to work. Get an explanation after each practice answer, so every attempt moves you forward.",
    icon: Check,
  },
  {
    n: "03",
    label: "Discover weak concepts",
    title: "See exactly where it gets fuzzy.",
    text: "Look beyond a total score. Discover the subtopics that need attention and understand what to revisit.",
    icon: Target,
  },
  {
    n: "04",
    label: "Improve",
    title: "Make the next step the right one.",
    text: "Return to the right lesson, practise with purpose, and watch your understanding take shape.",
    icon: TrendingUp,
  },
];
function PracticeDemo() {
  const [answer, setAnswer] = useState<number | null>(null);
  return (
    <div className="lesson-example">
      <span className="demo-label">
        Interactive example · Original demo question
      </span>
      <h3>
        A bicycle travels 60 m in 5 s.
        <br />
        What is its average speed?
      </h3>
      <div className="answer-options">
        {["5 m/s", "12 m/s", "60 m/s"].map((v, i) => (
          <button
            key={v}
            className={answer === i ? (i === 1 ? "correct" : "incorrect") : ""}
            onClick={() => setAnswer(i)}
          >
            {String.fromCharCode(65 + i)}
            <span>{v}</span>
            {answer === i && i === 1 && <Check size={15} />}
          </button>
        ))}
      </div>
      <p className="answer-feedback" aria-live="polite">
        {answer === null
          ? "Choose an answer to see the explanation."
          : answer === 1
            ? "Exactly. Speed = distance ÷ time = 60 ÷ 5 = 12 m/s."
            : "Try again. Divide the distance, 60 m, by the time, 5 s."}
      </p>
      <small>This example does not save answers or award points.</small>
    </div>
  );
}
export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils
          .toArray<HTMLElement>("[data-reveal]")
          .forEach((el) =>
            gsap.fromTo(
              el,
              { opacity: 0.18, y: 35 },
              {
                opacity: 1,
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top 94%",
                  end: "top 68%",
                  scrub: true,
                },
              },
            ),
          );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  return (
    <div className="landing" ref={root}>
      <Suspense fallback={null}>
        <CrystalField />
      </Suspense>
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>
            <span className="tiny-spark">✳</span> A WORLD OF UNDERSTANDING
          </Eyebrow>
          <h1>
            Understand every concept.
            <br />
            <span>Build your next possibility.</span>
          </h1>
          <p>
            Learning that connects the dots.
            <br className="mobile-break" /> Clear lessons, purposeful practice,
            <br className="desktop-break" /> and a path forward that feels like
            yours.
          </p>
          <div className="hero-actions">
            <ButtonLink to="/courses">Explore courses</ButtonLink>
            <ButtonLink to="/for-schools" secondary>
              For schools
            </ButtonLink>
          </div>
        </div>
        <div className="hero-bottom">
          <span>CLASSES 6–12 & BEYOND</span>
          <a href="#how-it-works">
            Scroll to discover
            <ArrowDown size={15} />
          </a>
          <span>ONE CONCEPT AT A TIME</span>
        </div>
      </section>
      <section className="learning-intro content-width" id="how-it-works">
        <div data-reveal>
          <Eyebrow>THE TIPIX WAY</Eyebrow>
          <h2>
            Knowledge is connected.
            <br />
            <span className="subtle">Your learning should be, too.</span>
          </h2>
          <p className="muted">
            From the first question to that “I get it” moment.
            <br />A thoughtful loop that helps understanding stay.
          </p>
        </div>
        <div className="learning-loop" data-reveal>
          {steps.map((s, i) => (
            <a href={`#step-${i}`} key={s.n}>
              <span>{s.n}</span>
              {s.label}
              {i < 3 && <ArrowRight size={15} />}
            </a>
          ))}
        </div>
      </section>
      <section className="journey content-width">
        {steps.map((s, i) => (
          <article
            className={`journey-step step-${i}`}
            key={s.n}
            id={`step-${i}`}
          >
            <div className="step-copy" data-reveal>
              <Eyebrow>
                {s.n} / {s.label}
              </Eyebrow>
              <h2>{s.title}</h2>
              <p className="muted">{s.text}</p>
              <a
                href={i === 0 ? "/courses" : "#dashboard-preview"}
                className="text-link"
              >
                {i === 0 ? "Find your course" : "See the learning picture"}
                <ArrowRight size={16} />
              </a>
            </div>
            <div className="step-visual" data-reveal>
              {i === 0 ? (
                <div className="lesson-example">
                  <span className="card-kicker">PHYSICS / MOTION</span>
                  <h3>
                    Every journey begins
                    <br />
                    with a change in position.
                  </h3>
                  <div
                    className="motion-diagram"
                    aria-label="Position moving from point A to point B"
                  >
                    <span>A</span>
                    <div className="motion-line">
                      <i />
                    </div>
                    <span>B</span>
                  </div>
                  <div className="lesson-note">
                    <BookOpen size={18} />
                    <p>
                      Displacement tells us how far you are from where you
                      started — and in which direction.
                    </p>
                  </div>
                  <span className="demo-label">
                    Illustrative lesson preview
                  </span>
                </div>
              ) : i === 1 ? (
                <PracticeDemo />
              ) : i === 2 ? (
                <div className="lesson-example weak-example">
                  <span className="card-kicker">YOUR CONCEPT PICTURE</span>
                  <h3>A score tells part of the story.</h3>
                  {[
                    ["Displacement", "Looking strong", 88],
                    ["Velocity", "Coming together", 72],
                    ["Acceleration", "Worth revisiting", 46],
                  ].map(([name, label, value]) => (
                    <div className="mastery-row" key={name}>
                      <div>
                        <span>{name}</span>
                        <small>{label}</small>
                      </div>
                      <div className="progress-track">
                        <i style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                  <span className="demo-label">
                    Illustrative preview · Sample data
                  </span>
                </div>
              ) : (
                <div className="lesson-example improvement-example">
                  <span className="card-kicker">YOUR NEXT CHAPTER</span>
                  <h3>
                    Small steps.
                    <br />
                    Lasting understanding.
                  </h3>
                  <div
                    className="improve-bars"
                    aria-label="Illustrative progress trend"
                  >
                    {[22, 34, 31, 48, 59, 68, 84].map((v, j) => (
                      <div key={j} style={{ height: `${v}%` }}>
                        <span>{j + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lesson-note">
                    <TrendingUp size={20} />
                    <p>
                      Revisit. Practise. Connect.
                      <br />
                      Keep building on what you know.
                    </p>
                  </div>
                  <span className="demo-label">
                    Illustrative progress · Not actual results
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
      <section
        className="dashboard-section content-width"
        id="dashboard-preview"
      >
        <div data-reveal>
          <SectionHeading
            eyebrow="YOUR LEARNING, IN VIEW"
            title="A little clarity changes everything."
          >
            Pick up where you left off. See what’s clicking. Know what comes
            next.
          </SectionHeading>
        </div>
        <div data-reveal>
          <DashboardPreview />
        </div>
      </section>
      <section className="final-cta content-width">
        <div data-reveal>
          <Eyebrow>YOUR NEXT POSSIBILITY</Eyebrow>
          <h2>
            It starts with
            <br />
            one curious question.
          </h2>
          <p className="muted">Find your course. Follow your curiosity.</p>
          <ButtonLink to="/courses">Explore courses</ButtonLink>
        </div>
      </section>
    </div>
  );
}

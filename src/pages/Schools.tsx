import { BookOpen, Users, Target, ShieldCheck, ArrowRight } from "lucide-react";
import { ButtonLink, Eyebrow, SectionHeading } from "../components/UI";
import DashboardPreview from "../components/DashboardPreview";
export default function Schools() {
  return (
    <div className="schools-page content-width">
      <section className="school-hero">
        <Eyebrow>FOR SCHOOLS. FOR EVERY LEARNER.</Eyebrow>
        <h1>
          See the student
          <br />
          behind the score.
        </h1>
        <p className="muted">
          Connect classroom learning, purposeful practice, and concept insights
          — so teachers can help where it matters most.
        </p>
        <a href="#school-workflow" className="button">
          Explore the school experience
          <ArrowRight size={16} />
        </a>
      </section>
      <section className="school-features" id="school-workflow">
        <SectionHeading
          eyebrow="A MORE CONNECTED CLASSROOM"
          title="One learning loop. A shared picture."
        />
        <div className="school-grid">
          {[
            [
              BookOpen,
              "Make the curriculum yours",
              "Organize courses, lessons, learning materials, and concept-tagged questions.",
            ],
            [
              Users,
              "Guide every class",
              "Plan assignments and exams for the classes you teach. Keep student questions connected to the lesson.",
            ],
            [
              Target,
              "Know where to help",
              "Review subtopic patterns and individual attempts to plan focused revision.",
            ],
            [
              ShieldCheck,
              "Keep access appropriate",
              "Planned school and class permissions keep student records with the people authorized to support them.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof BookOpen;
            return (
              <article className="school-card" key={String(title)}>
                <I />
                <h3>{String(title)}</h3>
                <p>{String(copy)}</p>
              </article>
            );
          })}
        </div>
        <p className="catalog-note">
          These describe the planned school platform. Teacher tools, school
          administration, and secure data access are not connected in this
          frontend phase.
        </p>
      </section>
      <section className="school-preview">
        <SectionHeading
          eyebrow="THE STUDENT PERSPECTIVE"
          title="Progress they can understand."
        />
        <DashboardPreview />
      </section>
      <section className="school-pilot">
        <Eyebrow>A THOUGHTFUL START</Eyebrow>
        <h2>
          Start with one class.
          <br />
          Learn what makes a difference.
        </h2>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Choose the learning scope</h3>
              <p>Select the class, subjects, and concepts for a pilot.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Prepare and verify content</h3>
              <p>Review lessons, question provenance, and teacher access.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Evaluate real learning</h3>
              <p>
                Use actual attempts and teacher feedback to guide the next step.
              </p>
            </div>
          </li>
        </ol>
        <ButtonLink to="/courses">Explore course plans</ButtonLink>
      </section>
    </div>
  );
}

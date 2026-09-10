import {
  BookOpen,
  ChartNoAxesCombined,
  House,
  Layers,
  Check,
  Flame,
  ArrowRight,
} from "lucide-react";
export default function DashboardPreview() {
  return (
    <div
      className="dashboard-preview"
      aria-label="Illustrative student dashboard with demonstration data"
    >
      <aside className="preview-sidebar">
        <span className="preview-mark">✳</span>
        <House />
        <BookOpen />
        <Layers />
        <ChartNoAxesCombined />
      </aside>
      <div className="preview-content">
        <div className="preview-top">
          <span>MY LEARNING SPACE</span>
          <span className="demo-label">Illustrative preview · Sample data</span>
        </div>
        <div className="preview-greeting">
          <div>
            <h3>A little progress. A big possibility.</h3>
            <p>Here’s where your curiosity takes you today.</p>
          </div>
          <span className="avatar">A</span>
        </div>
        <div className="preview-grid">
          <div className="continue-card">
            <span className="card-kicker">CONTINUE LEARNING</span>
            <div className="subject-mini">PHYSICS · CLASS 11</div>
            <h4>Motion in a straight line</h4>
            <p>From position to velocity. One concept at a time.</p>
            <div className="progress-track">
              <i style={{ width: "64%" }} />
            </div>
            <div className="card-bottom">
              <span>4 of 6 concepts explored</span>
              <span className="preview-action">
                Next concept <ArrowRight size={14} />
              </span>
            </div>
          </div>
          <div className="momentum-card">
            <Flame size={21} />
            <strong>7 days</strong>
            <span>of showing up for yourself</span>
            <div className="week-dots">
              {"MTWTFSS".split("").map((x, i) => (
                <span key={i}>
                  <i className={i < 5 ? "done" : ""}>
                    {i < 5 ? <Check size={10} /> : ""}
                  </i>
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div className="concept-card">
            <div className="card-title">
              <h4>Your concept picture</h4>
              <span>Sample mastery</span>
            </div>
            {[
              ["Position & displacement", 88],
              ["Speed & velocity", 72],
              ["Acceleration", 46],
            ].map(([label, value]) => (
              <div className="mastery-row" key={label}>
                <div>
                  <span>{label}</span>
                  <b>{value}%</b>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="next-card">
            <span className="card-kicker">A GOOD NEXT STEP</span>
            <h4>Let’s revisit acceleration.</h4>
            <p>A short explanation and a few questions can make it click.</p>
            <span>
              Guided practice <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

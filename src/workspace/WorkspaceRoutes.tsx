import DoubtsInbox from "../academic/DoubtsInbox";
import Syllabus from "../academic/Syllabus";
import {LearningCourses,ChapterJourney,ConceptTasks} from "../academic/LearningJourney";
import {AcademicProvider} from "../academic/AcademicContext";
import {AcademicDashboard, AcademicRecords, CurriculumPanel, EvidencePanel, VerifiedPractice, Readiness, SourceLibrary, ConceptRoom} from "../academic/AcademicPages";
import StaffPages from "../academic/StaffPages";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import StudentLayout from "./StudentLayout";
import {
  Dashboard,
  WorkspaceCourses,
  ConceptProgress,
  Submissions,
  Leaderboard,
  Profile,
  WorkspaceSettings,
} from "./StudentPages";
import {
  CourseDetail,
  Practice,
  Exams,
  Flashcards,
  Projects,
  Doubts,
} from "./StudyPages";

export default function WorkspaceRoutes() {
  return (
    <AcademicProvider><Routes>
      {" "}
      <Route element={<StudentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AcademicDashboard />} />
        <Route path="demo/dashboard" element={<Dashboard />} />
        <Route path="syllabus" element={<Syllabus/>} />
        <Route path="courses" element={<LearningCourses/>} />
        <Route path="demo/courses" element={<WorkspaceCourses/>} />
        <Route path="chapters/:chapter" element={<ChapterJourney/>} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="practice" element={<VerifiedPractice />} />
        <Route path="demo/practice" element={<Practice />} />
        <Route path="demo/practice/:courseId" element={<Practice />} />
        <Route path="practice/:courseId" element={<VerifiedPractice />} />
        <Route path="exams" element={<Exams />} />
        <Route path="submissions" element={<AcademicRecords mode="submissions" />} />
        <Route path="demo/submissions" element={<Submissions />} />
        <Route path="concept-progress" element={<AcademicRecords mode="concept-progress" />} />
        <Route path="demo/concept-progress" element={<ConceptProgress />} />
        <Route path="leaderboard" element={<AcademicRecords mode="leaderboard" />} />
        <Route path="demo/leaderboard" element={<Leaderboard />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="projects" element={<Projects />} />
        <Route path="doubts" element={<DoubtsInbox />} />
        <Route path="demo/doubts" element={<Doubts />} />
        <Route path="profile" element={<><EvidencePanel/><Profile /></>} />
        <Route path="mistakes" element={<AcademicRecords mode="mistakes" />} />
        <Route path="readiness" element={<Readiness />} />
        <Route path="sources" element={<SourceLibrary />} />
        <Route path="staff" element={<StaffPages />} />
        <Route path="concepts/:conceptId" element={<ConceptRoute />} />
        <Route path="settings" element={<WorkspaceSettings />} />
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>
    </Routes></AcademicProvider>
  );
}

function ConceptRoute(){const{conceptId}=useParams();return <ConceptTasks key={conceptId} id={conceptId||""}/>;}

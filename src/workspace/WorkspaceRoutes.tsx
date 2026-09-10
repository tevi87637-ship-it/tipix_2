import { Routes, Route, Navigate } from "react-router-dom";
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
    <Routes>
      {" "}
      <Route element={<StudentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courses" element={<WorkspaceCourses />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="practice" element={<Practice />} />
        <Route path="practice/:courseId" element={<Practice />} />
        <Route path="exams" element={<Exams />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="concept-progress" element={<ConceptProgress />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="projects" element={<Projects />} />
        <Route path="doubts" element={<Doubts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<WorkspaceSettings />} />
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

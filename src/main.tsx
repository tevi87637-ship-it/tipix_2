import { AuthProvider, RequireAuth } from "./auth/AuthProvider";
import VerifyEmail from "./pages/VerifyEmail";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Schools from "./pages/Schools";
import Auth from "./pages/Auth";
import { ButtonLink } from "./components/UI";
import "./styles.css";
const WorkspaceRoutes = React.lazy(() => import("./workspace/WorkspaceRoutes"));
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter><AuthProvider>
      <Routes>
        <Route
          path="app/*"
          element={
            <React.Suspense
              fallback={
                <div
                  role="status"
                  style={{ padding: "60px", color: "#b8c9ef" }}
                >
                  Opening your learning space…
                </div>
              }
            >
              <RequireAuth><WorkspaceRoutes /></RequireAuth>
            </React.Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="for-schools" element={<Schools />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="reset-password" element={<VerifyEmail recovery />} />
          <Route path="login" element={<Auth mode="login" />} />
          <Route path="register" element={<Auth mode="register" />} />
          <Route path="forgot-password" element={<Auth mode="forgot" />} />
          <Route
            path="*"
            element={
              <div className="simple-page">
                <h1>That page isn’t here yet.</h1>
                <ButtonLink to="/">Back to TIPIX</ButtonLink>
              </div>
            }
          />
        </Route>
      </Routes>
    </AuthProvider></BrowserRouter>
  </React.StrictMode>,
);

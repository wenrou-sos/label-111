import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Tier from "@/pages/Tier";
import Preference from "@/pages/Preference";
import Profit from "@/pages/Profit";
import Retention from "@/pages/Retention";
import Monitor from "@/pages/Monitor";
import Login from "@/pages/Login";
import Logs from "@/pages/Logs";
import Users from "@/pages/Users";
import { AppLayout } from "@/components/AppLayout";
import { useAuthStore } from "@/stores/auth";

function ProtectedRoute({ children, requirePerm }: { children: React.ReactNode; requirePerm?: string }) {
  const { user, hasPerm } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requirePerm && !hasPerm(requirePerm)) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tier"
          element={
            <ProtectedRoute>
              <Tier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preference"
          element={
            <ProtectedRoute>
              <Preference />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profit"
          element={
            <ProtectedRoute>
              <Profit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retention"
          element={
            <ProtectedRoute>
              <Retention />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor"
          element={
            <ProtectedRoute>
              <Monitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requirePerm="manage">
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

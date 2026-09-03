import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import ServicesPage from "./pages/ServicesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

import BottomNav from "./components/BottomNav";
import { getCurrentUser } from "./api";
import { getToken, saveAuth } from "./api/authStorage";
import { authService } from "./services/authService";
import { ConfirmDialogProvider } from "./dialogs/ConfirmDialogProvider";
import { ToastProvider } from "./notifications/ToastProvider";

import "./index.css";

const ownerOnlyRoles = new Set(["owner"]);

function hasPrivilegedAccess(user) {
  return ownerOnlyRoles.has(user?.role);
}

function isAdminDashboardUser(user) {
  return user?.role === "admin" || user?.role === "dev";
}

function isPlatformUser(user) {
  return user?.role === "admin" || user?.role === "dev";
}

function AppShell({ user, setUser }) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const mainClassName = isAdminPage
    ? "flex-1 w-full"
    : "flex-1 w-full max-w-3xl mx-auto pb-24 md:pb-0 md:border-x md:border-gray-100 md:shadow-sm";
  const mustChangePassword = Boolean(user?.mustChangePassword);

  const salonHome = isPlatformUser(user) ? <Navigate to="/admin" replace /> : <AppointmentsPage />;
  const changePasswordRoute = user ? <ChangePasswordPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <main className={mainClassName}>
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={isAdminDashboardUser(user) ? "/admin" : "/"} replace />
              ) : (
                <LoginPage setUser={setUser} />
              )
            }
          />

          <Route
            path="/"
            element={
              user ? (mustChangePassword ? <Navigate to="/change-password" replace /> : salonHome) : <Navigate to="/login" replace />
            }
          />

          <Route path="/change-password" element={changePasswordRoute} />

          <Route
            path="/admin"
            element={
              user ? (
                mustChangePassword ? (
                  <Navigate to="/change-password" replace />
                ) : isAdminDashboardUser(user) ? <AdminDashboardPage /> : <Navigate to="/" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/clients"
            element={
              user ? (
                mustChangePassword ? (
                  <Navigate to="/change-password" replace />
                ) : isPlatformUser(user) ? <Navigate to="/admin" replace /> : <ClientsPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/clients/:id"
            element={
              user ? (
                mustChangePassword ? (
                  <Navigate to="/change-password" replace />
                ) : isPlatformUser(user) ? <Navigate to="/admin" replace /> : <ClientDetailPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/appointments"
            element={
              user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/services"
            element={
              user ? (
                mustChangePassword ? (
                  <Navigate to="/change-password" replace />
                ) : isPlatformUser(user) ? <Navigate to="/admin" replace /> : <ServicesPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/reports"
            element={
              user ? (
                  mustChangePassword ? (
                    <Navigate to="/change-password" replace />
                  ) : isPlatformUser(user) ? (
                  <Navigate to="/admin" replace />
                ) : hasPrivilegedAccess(user) ? (
                  <ReportsPage />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/settings"
            element={
              user ? (
                  mustChangePassword ? (
                    <Navigate to="/change-password" replace />
                  ) : isPlatformUser(user) ? (
                  <Navigate to="/admin" replace />
                ) : hasPrivilegedAccess(user) ? (
                  <SettingsPage />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>

      {user && !mustChangePassword && !isPlatformUser(user) && <BottomNav user={user} />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!user) {
      document.title = "SalonCRM Login";
      return;
    }

    document.title = isAdminDashboardUser(user)
      ? "Admin Dashboard"
      : user.salonName || "SalonCRM";
  }, [user]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (getToken()) {
      authService.me()
        .then((res) => {
          const refreshedUser = res.data?.user;
          if (refreshedUser) {
            saveAuth(getToken(), refreshedUser);
            setUser(refreshedUser);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <Router>
          <AppShell user={user} setUser={setUser} />
        </Router>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

export default App;

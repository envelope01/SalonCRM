// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* =========================
   PAGES
   ========================= */
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import ServicesPage from "./pages/ServicesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";

/* =========================
   COMPONENTS & UTILS
   ========================= */
import BottomNav from "./components/BottomNav";
import { getCurrentUser } from "./api";
import { ConfirmDialogProvider } from "./dialogs/ConfirmDialogProvider";
import { ToastProvider } from "./notifications/ToastProvider";

/* =========================
   STYLES
   ========================= */
import "./index.css"; 

const privilegedRoles = new Set(["owner", "admin", "dev"]);

function hasPrivilegedAccess(user) {
  return privilegedRoles.has(user?.role);
}

function App() {
  /* =========================
     STATE
     ========================= */
  const [user, setUser] = useState(null);

  /* =========================
     INIT AUTH STATE
     ========================= */
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  /* =========================
     HANDLERS
     ========================= */


  /* =========================
     ROUTER
     ========================= */
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <Router>
          {/* FIX 1: Removed 'h-screen overflow-hidden'.
            Replaced with 'min-h-screen bg-gray-50' to allow native mobile scrolling.
          */}
          <div className="flex flex-col min-h-screen bg-gray-50 font-sans">

        {/* DESKTOP NAVBAR (Will be hidden on mobile via CSS inside Navbar usually) */}


        {/* FIX 2: Removed 'p-4' and 'overflow-hidden'.
          Our redesigned pages handle their own padding and scrolling now!
          Added 'pb-24 md:pb-0' to guarantee the BottomNav NEVER covers the very bottom content.
        */}
        <main className="flex-1 w-full max-w-3xl mx-auto pb-24 md:pb-0 md:border-x md:border-gray-100 md:shadow-sm">
          <Routes>
            {/* AUTH */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage setUser={setUser} />
                )
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/"
              element={
                user ? <ClientsPage /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/clients/:id"
              element={
                user ? <ClientDetailPage /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/services"
              element={
                user ? <ServicesPage /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/reports"
              element={
                user ? (
                  hasPrivilegedAccess(user) ? <ReportsPage /> : <Navigate to="/" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/settings"
              element={
                user ? (
                  hasPrivilegedAccess(user) ? <SettingsPage /> : <Navigate to="/" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>

        {/* MOBILE BOTTOM NAV */}
        {user && <BottomNav user={user} />}
          </div>
        </Router>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

export default App;

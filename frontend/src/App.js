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
import LoginPage from "./pages/LoginPage";

/* =========================
   COMPONENTS & UTILS
   ========================= */
import Navbar from "./components/Navbar";
import { getCurrentUser, clearAuth } from "./api";

/* =========================
   STYLES
   ========================= */
import "./index.css";
import "./App.css";

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
  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  /* =========================
     ROUTER
     ========================= */
  return (
    <Router>
      <div className="app-root">
        {/* NAVBAR */}
        {user && <Navbar user={user} onLogout={handleLogout} />}

        {/* MAIN CONTENT */}
        <main className="app-content">
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
                user ? <ReportsPage /> : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

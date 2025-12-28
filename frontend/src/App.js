// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ClientsPage from "./pages/ClientsPage";
import ReportsPage from "./pages/ReportsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import ServicesPage from "./pages/ServicesPage";
import LoginPage from "./pages/LoginPage";

import Navbar from "./components/Navbar";
import { getCurrentUser, clearAuth } from "./api";

import "./index.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <Router>
      <div className="app-root">
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <main className="app-content">
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/" replace /> : <LoginPage setUser={setUser} />
              }
            />

            <Route
              path="/"
              element={user ? <ClientsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/clients/:id"
              element={user ? <ClientDetailPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/services"
              element={user ? <ServicesPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/reports"
              element={user ? <ReportsPage /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

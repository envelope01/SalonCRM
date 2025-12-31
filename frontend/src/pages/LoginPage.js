import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import api, { saveAuth } from "../api";
import "./login.css";

function LoginPage({ setUser }) {
  const navigate = useNavigate();

  /* ======================
     FORM STATE
     ====================== */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* ======================
     SUBMIT HANDLER
     ====================== */
  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !password) {
      setErr("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      saveAuth(res.data.token, res.data.user);
      setUser(res.data.user);

      navigate("/");
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     UI
     ====================== */
  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* BRANDING */}
        <div className="login-brand">
          <h2>
            Nutan’s <span>Beauty Lounge</span>
          </h2>
          <p>
            An elegant dashboard to manage your appointments, clients, and salon
            growth in one place.
          </p>
        </div>

        {/* LOGIN FORM */}
        <div className="login-form">
          <h5>Welcome Back</h5>
          <div className="subtitle">
            Login to your professional account
          </div>

          {err && (
            <div
              className="alert alert-danger py-2"
              style={{ borderRadius: "10px" }}
            >
              {err}
            </div>
          )}

          <form onSubmit={submit}>
            {/* EMAIL */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">
                Email Address
              </label>
              <input
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* SUBMIT */}
            <button
              className="btn btn-primary w-100 shadow-sm"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

import React, { useState } from "react";
import api, { saveAuth } from "../api";
import { useNavigate } from "react-router-dom";
import "./login.css";

function LoginPage({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !password) {
      return setErr("Please enter both email and password");
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });

      saveAuth(res.data.token, res.data.user);
      setUser(res.data.user);
      nav("/");
    } catch (err) {
      setErr(err.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* LEFT BRAND */}
        <div className="login-brand">
          <h2>
            Nutan’s <br />
            <span>Beauty Lounge</span>
          </h2>
          <p>
            Manage appointments, clients, staff, and revenue —
            all from one elegant salon dashboard.
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="login-form">
          <h5>Welcome Back</h5>
          <div className="subtitle">
            Login to manage your salon operations
          </div>

          {err && <div className="alert alert-danger">{err}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <input
                className="form-control"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="d-grid">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Logging in..." : "Login to Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

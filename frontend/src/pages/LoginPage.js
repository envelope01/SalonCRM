import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import api, { saveAuth } from "../api";
// styles are handled by Tailwind; old CSS removed

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
    <div className="h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_left,_#fdf6f9,_#f8e8f0)]">
      <div className="w-full max-w-md md:max-w-2xl max-h-[90vh] flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-lg">
        {/* branding */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary to-brandPink text-white">
          <h2 className="text-xl md:text-2xl font-extrabold uppercase">
            Nutan’s
            <span className="block text-base font-light">Beauty Lounge</span>
          </h2>
          <p className="mt-2 text-sm md:text-base max-w-xs">
            An elegant dashboard to manage your appointments, clients, and salon
            growth in one place.
          </p>
        </div>

        {/* login form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6">
          <h5 className="text-center text-lg font-bold mb-1">Welcome Back</h5>
          <div className="text-center text-sm mb-4 text-gray-600">
            Login to your professional account
          </div>

          {err && (
            <div className="bg-red-100 text-red-700 rounded-lg px-4 py-2 mb-4">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Email Address
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none "
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none "
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="btn-primary w-full shadow-sm"
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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { saveAuth } from "../api";

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
      const res = await api.post("/auth/login", { email, password });

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-5 bg-gradient-to-br from-primary via-accent to-brandPink relative overflow-hidden">
      
      {/* DECORATIVE BACKGROUND BLOBS */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-brandPink/40 rounded-full blur-3xl pointer-events-none" />

      {/* BRANDING HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="text-center text-white mb-8 relative z-10"
      >
        <h1 className="text-5xl font-black tracking-tight drop-shadow-lg">
          Nutan's
        </h1>
        <p className="text-sm font-bold tracking-[0.3em] uppercase mt-2 opacity-90 drop-shadow">
          Beauty Lounge
        </p>
      </motion.div>

      {/* LOGIN CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Sign in to your dashboard</p>
        </div>

        {err && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 text-rose-600 rounded-2xl p-4 mb-6 text-sm font-bold text-center border border-rose-100">
            {err}
          </motion.div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Email Input */}
          <div>
            <input
              type="email"
              autoComplete="email"
              className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/30 transition-all placeholder:font-medium placeholder:text-gray-400"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/30 transition-all placeholder:font-medium placeholder:text-gray-400"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 mt-2 rounded-2xl font-bold text-base shadow-xl shadow-gray-900/20 active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Footer Link (Optional, good for polish) */}
        <div className="mt-8 text-center">
          <p className="text-xs font-bold text-gray-400">
            Salon CRM System v1.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
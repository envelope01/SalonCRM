import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { saveAuth } from "../api";
import { authService } from "../services/authService";
import { loginValidationError } from "../utils/validation";
import { toast } from "../notifications/toastBus";

function LoginPage({ setUser }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const validationError = loginValidationError({ email, password });
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login({ email: email.trim(), password });

      saveAuth(res.data.token, res.data.user);
      setUser(res.data.user);
      toast.success("Logged in successfully");

      if (res.data.user?.mustChangePassword) {
        navigate("/change-password", { replace: true });
        return;
      }

      navigate(["admin", "dev"].includes(res.data.user?.role) ? "/admin" : "/");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-[radial-gradient(circle_at_top,#fff7fb_0,#f9fafb_42%,#f3f4f6_100%)] px-5 py-10 sm:items-center">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-5 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <img src="/logo.png" alt="SalonCRM" className="h-full w-full object-cover" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">SalonCRM</h1>
        </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
        className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-950">Sign in</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Access your workspace securely.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="email"
              autoComplete="email"
              className="input-soft"
              placeholder="Email address"
              value={email}
              maxLength="254"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <input
              type="password"
              autoComplete="current-password"
              className="input-soft"
              placeholder="Password"
              value={password}
              maxLength="128"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full"
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

        <div className="mt-7 text-center">
          <p className="mb-3 text-xs font-medium leading-relaxed text-gray-500">
            Forgot password? Ask your salon owner or platform admin for a new temporary password.
          </p>
          <p className="text-xs font-medium text-gray-400">Professional salon management</p>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;

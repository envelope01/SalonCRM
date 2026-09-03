import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, saveAuth } from "../api";
import { getToken } from "../api/authStorage";
import { authService } from "../services/authService";
import { toast } from "../notifications/toastBus";

function ChangePasswordPage({ user, setUser }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const destination = ["admin", "dev"].includes(user?.role) ? "/admin" : "/";

  const submit = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning("All password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.warning("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("New passwords do not match");
      return;
    }

    try {
      setSaving(true);
      const res = await authService.changePassword({ currentPassword, newPassword });
      const nextUser = res.data.user;
      saveAuth(getToken(), nextUser);
      setUser(nextUser);
      toast.success("Password updated");
      navigate(destination, { replace: true });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-5 py-10 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brandPink">Account security</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Create your new password</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
            Your current password is temporary. Set a private password before continuing.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            autoComplete="current-password"
            className="input-soft"
            placeholder="Current temporary password"
            value={currentPassword}
            maxLength="128"
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            className="input-soft"
            placeholder="New password"
            value={newPassword}
            maxLength="128"
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            className="input-soft"
            placeholder="Confirm new password"
            value={confirmPassword}
            maxLength="128"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Updating..." : "Update Password"}
          </button>
          <button type="button" onClick={logout} className="btn-secondary w-full">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordPage;

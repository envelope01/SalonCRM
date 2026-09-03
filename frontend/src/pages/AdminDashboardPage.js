import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clearAuth, getCurrentUser } from "../api";
import { adminService } from "../services/adminService";
import { toast } from "../notifications/toastBus";

const emptySalonForm = {
  name: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  isActive: true,
};

const emptyPlatformUserForm = {
  name: "",
  email: "",
  temporaryPassword: "",
  role: "admin",
};

function Icon({ children, className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const icons = {
  building: (
    <Icon>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-7h6v7" />
    </Icon>
  ),
  activity: (
    <Icon>
      <path d="M22 12h-4l-3 8L9 4l-3 8H2" />
    </Icon>
  ),
  users: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  revenue: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <text x="12" y="17" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">₹</text>
    </svg>
  ),
  plus: (
    <Icon className="w-4 h-4">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  ),
  shield: (
    <Icon>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Icon>
  ),
  close: (
    <Icon>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </Icon>
  ),
  logout: (
    <Icon className="w-4 h-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  ),
  edit: (
    <Icon className="w-4 h-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </Icon>
  ),
  trash: (
    <Icon className="w-4 h-4">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  ),
};

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function limitText(value, fallback = "No owner email") {
  return value || fallback;
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="min-h-[96px] rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase leading-tight text-gray-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth = "sm:max-w-2xl" }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className={`w-full ${maxWidth} rounded-t-[2.5rem] border border-gray-100 bg-white p-0 shadow-2xl sm:rounded-[2rem]`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">{title}</h2>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500" aria-label="Close">
              {icons.close}
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AdminDashboardPage() {
  const currentUser = getCurrentUser();
  const canDeleteSalon = currentUser?.role === "admin" || currentUser?.role === "dev";
  const canManagePlatformUsers = currentUser?.role === "admin" || currentUser?.role === "dev";
  const [dashboard, setDashboard] = useState({ summary: {}, salons: [], platformUsers: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSalonModal, setShowSalonModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [salonForm, setSalonForm] = useState(emptySalonForm);
  const [platformUserForm, setPlatformUserForm] = useState(emptyPlatformUserForm);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [ownerTemporaryPassword, setOwnerTemporaryPassword] = useState("");

  const summary = dashboard.summary || {};
  const salons = useMemo(() => dashboard.salons || [], [dashboard.salons]);
  const platformUsers = dashboard.platformUsers || [];

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboard();
      const nextDashboard = res.data || { summary: {}, salons: [], platformUsers: [] };
      setDashboard(nextDashboard);
      return nextDashboard;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateSalonForm = (key, value) => setSalonForm((current) => ({ ...current, [key]: value }));
  const updatePlatformUserForm = (key, value) => setPlatformUserForm((current) => ({ ...current, [key]: value }));

  const registerSalon = async (event) => {
    event.preventDefault();
    if (!salonForm.name.trim() || !salonForm.ownerName.trim() || !salonForm.ownerEmail.trim() || !salonForm.ownerPassword) {
      toast.warning("Salon, owner, email, and temporary password are required");
      return;
    }

    try {
      setSaving(true);
      await adminService.registerSalon({
        name: salonForm.name.trim(),
        ownerName: salonForm.ownerName.trim(),
        ownerEmail: salonForm.ownerEmail.trim(),
        ownerPassword: salonForm.ownerPassword,
        isActive: salonForm.isActive,
      });
      setSalonForm(emptySalonForm);
      setShowSalonModal(false);
      await loadDashboard();
      toast.success("Salon created successfully");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const createPlatformUser = async (event) => {
    event.preventDefault();
    if (!platformUserForm.name.trim() || !platformUserForm.email.trim() || !platformUserForm.temporaryPassword) {
      toast.warning("Name, email, and temporary password are required");
      return;
    }

    try {
      setSaving(true);
      await adminService.createPlatformUser({
        name: platformUserForm.name.trim(),
        email: platformUserForm.email.trim(),
        temporaryPassword: platformUserForm.temporaryPassword,
        role: platformUserForm.role,
      });
      setPlatformUserForm(emptyPlatformUserForm);
      setShowPlatformModal(false);
      await loadDashboard();
      toast.success("Platform user created");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (salon, isActive) => {
    try {
      await adminService.updateSalonStatus(salon._id, { isActive });
      const nextDashboard = await loadDashboard();
      const nextSalon = nextDashboard?.salons?.find((item) => item._id === salon._id);
      if (nextSalon) setSelectedSalon(nextSalon);
      toast.success(isActive ? "Salon activated" : "Salon deactivated");
    } catch {
    }
  };

  const resetOwnerPassword = async (salon) => {
    if (!ownerTemporaryPassword) {
      toast.warning("Temporary password is required");
      return;
    }

    if (ownerTemporaryPassword.length < 6) {
      toast.warning("Temporary password must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);
      await adminService.resetOwnerPassword(salon._id, { temporaryPassword: ownerTemporaryPassword });
      setOwnerTemporaryPassword("");
      await loadDashboard();
      toast.success("Owner password reset. They must change it after login.");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const deleteSalon = async (salon) => {
    if (!canDeleteSalon) return;

    try {
      setSaving(true);
      await adminService.deleteSalon(salon._id, { confirmation: deleteConfirmation.trim() });
      setSelectedSalon(null);
      setDeleteConfirmation("");
      await loadDashboard();
      toast.success("Salon and tenant data deleted");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brandPink">Platform Control</p>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowSalonModal(true)} className="btn-primary gap-2 px-5 py-3">
              {icons.plus}
              New Salon
            </button>
            {canManagePlatformUsers && (
              <button type="button" onClick={() => setShowPlatformModal(true)} className="btn-secondary gap-2 bg-white">
                {icons.shield}
                Platform User
              </button>
            )}
            <button type="button" onClick={handleLogout} className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center active:scale-95 transition-transform" aria-label="Logout">
              {icons.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-6 pb-24">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <StatCard label="Total salons" value={summary.totalSalons || 0} icon={icons.building} accent="bg-brandPink/10 text-brandPink" />
          <StatCard label="Active salons" value={summary.activeSalons || 0} icon={icons.activity} accent="bg-primary/10 text-primary" />
          <StatCard label="Inactive salons" value={summary.inactiveSalons || 0} icon={icons.users} accent="bg-rose-50 text-rose-600" />
        </section>

        <section>
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase text-gray-500">Salons</h2>
              <span className="text-xs font-bold text-gray-400">{salons.length} records</span>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Salon</th>
                    <th className="px-5 py-3 text-left font-semibold">Usage</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="px-4 py-10 text-center text-brandPink font-bold animate-pulse">Loading dashboard...</td></tr>
                  ) : salons.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-10 text-center text-gray-400 font-bold">No salons yet</td></tr>
                  ) : salons.map((salon) => (
                    <tr key={salon._id} onClick={() => setSelectedSalon(salon)} className="cursor-pointer border-t border-gray-50 hover:bg-brandPink/5">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{salon.name}</div>
                        <div className="text-xs font-semibold text-gray-400 mt-1">
                          {limitText(salon.owner?.name, "Unassigned")} - {limitText(salon.owner?.email)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-gray-600">
                          Clients {salon.customerCount}
                        </div>
                        <div className="text-xs font-bold text-gray-400 mt-1">
                          Staff {salon.staffCount} - Users {salon.userCount}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${salon.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                          {salon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedSalon(salon);
                            }}
                            className="rounded-2xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 transition-transform active:scale-95"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Platform Users</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {platformUsers.map((user) => (
              <div key={user.id} className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-2">Created {formatDate(user.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${user.role === "dev" ? "bg-primary text-white" : "bg-brandPink/10 text-brandPink"}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showSalonModal && (
        <Modal title="Add New Salon" onClose={() => setShowSalonModal(false)}>
          <form onSubmit={registerSalon} className="grid gap-3 p-6 sm:grid-cols-2">
            <input value={salonForm.name} onChange={(event) => updateSalonForm("name", event.target.value)} placeholder="Salon name" maxLength="160" className="input-soft" />
            <input value={salonForm.ownerName} onChange={(event) => updateSalonForm("ownerName", event.target.value)} placeholder="Owner name" maxLength="120" className="input-soft" />
            <input type="email" value={salonForm.ownerEmail} onChange={(event) => updateSalonForm("ownerEmail", event.target.value)} placeholder="Owner email" maxLength="254" className="input-soft" />
            <input type="password" value={salonForm.ownerPassword} onChange={(event) => updateSalonForm("ownerPassword", event.target.value)} placeholder="Temporary password" maxLength="128" className="input-soft" />
            <select value={salonForm.isActive ? "active" : "inactive"} onChange={(event) => updateSalonForm("isActive", event.target.value === "active")} className="input-soft">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <div className="sm:col-span-2 flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Creating..." : "Create Salon"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPlatformModal && (
        <Modal title="Add Platform User" onClose={() => setShowPlatformModal(false)}>
          <form onSubmit={createPlatformUser} className="grid gap-3 p-6 sm:grid-cols-2">
            <input value={platformUserForm.name} onChange={(event) => updatePlatformUserForm("name", event.target.value)} placeholder="Name" maxLength="120" className="input-soft" />
            <input type="email" value={platformUserForm.email} onChange={(event) => updatePlatformUserForm("email", event.target.value)} placeholder="Email" maxLength="254" className="input-soft" />
            <input type="password" value={platformUserForm.temporaryPassword} onChange={(event) => updatePlatformUserForm("temporaryPassword", event.target.value)} placeholder="Temporary password" maxLength="128" className="input-soft" />
            <select value={platformUserForm.role} onChange={(event) => updatePlatformUserForm("role", event.target.value)} className="input-soft">
              <option value="admin">admin</option>
              <option value="dev">dev</option>
            </select>
            <div className="sm:col-span-2 flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Creating..." : "Create Platform User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedSalon && (
        <AnimatePresence>
          <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {
            setSelectedSalon(null);
            setOwnerTemporaryPassword("");
          }}>
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 240 }} className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brandPink">Salon Detail</p>
                  <h2 className="text-xl font-black text-gray-900">{selectedSalon.name}</h2>
                </div>
                <button type="button" onClick={() => {
                  setSelectedSalon(null);
                  setOwnerTemporaryPassword("");
                }} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500" aria-label="Close">
                  {icons.close}
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Clients" value={selectedSalon.customerCount} icon={icons.users} accent="bg-brandPink/10 text-brandPink" />
                  <StatCard label="Staff" value={selectedSalon.staffCount} icon={icons.shield} accent="bg-primary/10 text-primary" />
                </div>

                <div className="rounded-[2rem] border border-gray-100 p-5">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Owner</p>
                  <p className="mt-2 font-bold text-gray-900">{limitText(selectedSalon.owner?.name, "Unassigned")}</p>
                  <p className="text-sm text-gray-500">{limitText(selectedSalon.owner?.email)}</p>
                </div>

                <div className="space-y-3 rounded-[2rem] border border-gray-100 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Status</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedSalon.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{selectedSalon.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Last activity</span>
                    <span className="text-sm font-semibold">{formatDate(selectedSalon.lastActivity)}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <button type="button" onClick={() => changeStatus(selectedSalon, !selectedSalon.isActive)} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-transform active:scale-95 ${selectedSalon.isActive ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {selectedSalon.isActive ? "Deactivate Salon" : "Activate Salon"}
                  </button>
                </div>

                <div className="space-y-3 rounded-[2rem] border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Reset owner password</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-500">
                      Set a temporary password when the owner cannot access their account. They will be forced to create a private password after login.
                    </p>
                  </div>
                  <input
                    type="password"
                    value={ownerTemporaryPassword}
                    onChange={(event) => setOwnerTemporaryPassword(event.target.value)}
                    placeholder="New temporary password"
                    maxLength="128"
                    className="input-soft bg-white"
                  />
                  <button
                    type="button"
                    disabled={saving || ownerTemporaryPassword.length < 6}
                    onClick={() => resetOwnerPassword(selectedSalon)}
                    className="btn-primary w-full"
                  >
                    Reset Owner Password
                  </button>
                </div>

                {canDeleteSalon && (
                  <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Delete salon data</p>
                      <p className="text-xs font-bold text-rose-500 mt-1">This removes tenant-owned clients, services, visits, appointments, settings, staff, owner, and the salon.</p>
                    </div>
                    <input
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      placeholder={`Type DELETE ${selectedSalon.name}`}
                      className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-200"
                    />
                    <button
                      type="button"
                      disabled={saving || deleteConfirmation.trim() !== `DELETE ${selectedSalon.name}`}
                      onClick={() => deleteSalon(selectedSalon)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {icons.trash}
                      Delete all salon data
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default AdminDashboardPage;

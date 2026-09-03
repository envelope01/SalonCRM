import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainHeader from "../components/MainHeader";
import TrashIcon from "../components/TrashIcon";
import { useConfirm } from "../dialogs/ConfirmDialogProvider";
import { appointmentService } from "../services/appointmentService";
import { clientService } from "../services/clientService";
import { appointmentValidationError, normalizePhoneInput } from "../utils/validation";
import { toast } from "../notifications/toastBus";

const statusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const durationOptions = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hr" },
  { value: "90", label: "1.5 hr" },
  { value: "120", label: "2 hr" },
  { value: "180", label: "3 hr" },
];

const statusFilters = [
  { value: "All", label: "All" },
  ...statusOptions,
];

function Icon({ children, className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const icons = {
  calendar: (
    <Icon className="w-7 h-7">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </Icon>
  ),
  phone: (
    <Icon>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.6 2.63a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.26-1.26a2 2 0 0 1 2.11-.45c.85.28 1.73.48 2.63.6A2 2 0 0 1 22 16.92z" />
    </Icon>
  ),
  whatsapp: (
    <Icon>
      <path d="M20 11.5a8 8 0 0 1-11.8 7.02L4 20l1.48-4.2A8 8 0 1 1 20 11.5z" />
      <path d="M9.5 8.5c.2 2 1.8 4.1 4 5.1l1.2-1.1 2 .8c-.3 1.2-1.2 2-2.5 2-2.8 0-6.5-3.6-6.5-6.4 0-1.3.8-2.2 2-2.5l.8 2.1-.5 0z" />
    </Icon>
  ),
  edit: (
    <Icon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </Icon>
  ),
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function endOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() + (day === 0 ? 0 : 7 - day);
  next.setDate(diff);
  return next;
}

function emptyForm() {
  return {
    title: "",
    clientId: "",
    clientName: "",
    clientSearch: "",
    date: toDateInput(new Date()),
    startTime: "10:00",
    durationMinutes: "60",
    notes: "",
  };
}

function isPastAppointmentDate(value) {
  if (!value) return false;

  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate < today;
}

function formatRangeTime(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  return `${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function appointmentDayLabel(value) {
  const date = new Date(value);
  const today = toDateInput(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const day = toDateInput(date);

  if (day === today) return "today";
  if (day === toDateInput(tomorrowDate)) return "tomorrow";
  return `on ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

function buildWhatsAppUrl(appointment) {
  const phone = normalizePhoneInput(appointment.client?.phone);
  if (!phone) return "";

  const start = new Date(appointment.appointmentStart);
  const countryCodePhone = phone.startsWith("91") ? phone : `91${phone}`;
  const message = [
    `Hi ${appointment.client?.name || "there"},`,
    "",
    `This is a reminder for your salon appointment ${appointmentDayLabel(appointment.appointmentStart)} at ${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.`,
    `Appointment: ${appointment.title}`,
    "",
    "We look forward to seeing you.",
  ].join("\n");

  return `https://wa.me/${countryCodePhone}?text=${encodeURIComponent(message)}`;
}

function AppointmentsPage() {
  const confirm = useConfirm();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState("today");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState("");

  const fetchAppointments = useCallback(async (from, to, status = "All") => {
    try {
      setLoading(true);
      const params = { from, to };
      if (status && status !== "All") params.status = status;

      const res = await appointmentService.getAppointments(params);
      setAppointments(res.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyPreset = useCallback((type) => {
    setPeriod(type);
    const now = new Date();
    const start = toDateInput(now);
    let end = start;

    if (type === "week") {
      end = toDateInput(endOfWeek(now));
    } else if (type === "month") {
      end = toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (type === "year") {
      end = toDateInput(new Date(now.getFullYear(), 11, 31));
    }

    setFromDate(start);
    setToDate(end);
    fetchAppointments(start, end, statusFilter);
  }, [fetchAppointments, statusFilter]);

  useEffect(() => {
    const today = toDateInput(new Date());
    setFromDate(today);
    setToDate(today);
    fetchAppointments(today, today, "All");
  }, [fetchAppointments]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientService.getClients();
        setClients(res.data || []);
      } catch {
        setClients([]);
      }
    };

    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const query = form.clientSearch.trim().toLowerCase();
    const source = query
      ? clients.filter((client) => {
          const phone = normalizePhoneInput(client.phone);
          return client.name.toLowerCase().includes(query) || phone.includes(query);
        })
      : clients;

    return source.slice(0, 6);
  }, [clients, form.clientSearch]);

  const openCreateSheet = () => {
    setEditingAppointment(null);
    setForm(emptyForm());
    setShowSheet(true);
  };

  const openEditSheet = (appointment) => {
    const start = new Date(appointment.appointmentStart);
    const end = new Date(appointment.appointmentEnd);
    const duration = Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000));

    setEditingAppointment(appointment);
    setForm({
      title: appointment.title || "",
      clientId: appointment.clientId || "",
      clientName: appointment.client?.name || "",
      clientSearch: appointment.client?.name || "",
      date: toDateInput(start),
      startTime: toTimeInput(start),
      durationMinutes: String(duration),
      notes: appointment.notes || "",
    });
    setShowSheet(true);
  };

  const selectClient = (client) => {
    setForm((current) => ({
      ...current,
      clientId: client._id,
      clientName: client.name,
      clientSearch: client.name,
    }));
  };

  const applyCustomRange = () => {
    if (!fromDate && !toDate) {
      toast.warning("Select at least one custom date");
      return;
    }

    setPeriod("custom");
    fetchAppointments(fromDate, toDate, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchAppointments(fromDate, toDate, status);
  };

  const saveAppointment = async () => {
    const validationError = appointmentValidationError(form);
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    const duration = Number(form.durationMinutes);
    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(start.getTime() + duration * 60000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.warning("Appointment date and time are invalid");
      return;
    }

    const payload = {
      title: form.title.trim(),
      clientId: form.clientId,
      appointmentStart: start.toISOString(),
      appointmentEnd: end.toISOString(),
      notes: form.notes.trim(),
    };

    try {
      setSaving(true);
      if (editingAppointment) {
        await appointmentService.updateAppointment(editingAppointment._id, payload);
      } else {
        await appointmentService.createAppointment(payload);
      }

      await fetchAppointments(fromDate, toDate, statusFilter);
      setShowSheet(false);
      toast.success(editingAppointment ? "Appointment updated successfully" : "Appointment created successfully");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const deleteAppointment = async (appointment) => {
    const isCancelled = appointment.status === "cancelled";
    const confirmed = await confirm({
      title: isCancelled ? "Delete cancelled appointment?" : "Cancel appointment?",
      message: isCancelled
        ? `Permanently delete the cancelled appointment "${appointment.title}" for ${appointment.client?.name || "this client"}?`
        : `Cancel "${appointment.title}" for ${appointment.client?.name || "this client"}? It will stay visible as cancelled.`,
      confirmLabel: isCancelled ? "Delete" : "Cancel Appointment",
      cancelLabel: "Keep",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      setDeletingAppointmentId(appointment._id);
      const res = await appointmentService.deleteAppointment(appointment._id);
      await fetchAppointments(fromDate, toDate, statusFilter);
      toast.success(res.data?.action === "deleted" ? "Cancelled appointment deleted" : "Appointment cancelled");
    } catch {
    } finally {
      setDeletingAppointmentId("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      <MainHeader title="Appointments">
        <div className="mt-3 flex rounded-xl bg-gray-100 p-1">
          {["today", "week", "month", "year", "custom"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => (p === "custom" ? setPeriod("custom") : applyPreset(p))}
              className={`flex-1 rounded-lg py-2 text-[11px] font-semibold capitalize transition-all ${
                period === p ? "bg-white text-brandPink shadow-sm" : "text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {period === "custom" ? (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="min-w-0 rounded-xl bg-gray-100 px-3 py-3 text-xs font-semibold text-gray-700 outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="min-w-0 rounded-xl bg-gray-100 px-3 py-3 text-xs font-semibold text-gray-700 outline-none"
            />
            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
            >
              Go
            </button>
          </div>
        ) : (
          <div className={`mt-3 flex items-center text-xs font-bold text-gray-500 px-1 ${
            period === "today" ? "justify-center" : "justify-center gap-3"
          }`}>
            {period === "today" ? (
              <span>{fromDate}</span>
            ) : (
              <>
                <span>From: {fromDate}</span>
                <span className="text-gray-300">|</span>
                <span>To: {toDate}</span>
              </>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => handleStatusFilter(status.value)}
              className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                statusFilter === status.value
                  ? "bg-brandPink text-white shadow-sm shadow-brandPink/30"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </MainHeader>

      <main className="p-4 flex-1">
        {loading ? (
          <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              {icons.calendar}
            </div>
            <p>No appointments found.</p>
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {appointments.map((appointment) => {
                const phone = normalizePhoneInput(appointment.client?.phone);
                const whatsappUrl = buildWhatsAppUrl(appointment);
                const start = new Date(appointment.appointmentStart);
                const isCancelled = appointment.status === "cancelled";
                const isCompleted = appointment.status === "completed";
                const statusTone = appointment.status === "cancelled"
                  ? "bg-rose-50 text-rose-500"
                  : appointment.status === "completed"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-brandPink/10 text-brandPink";

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={appointment._id}
                    className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm ${
                      isCancelled ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex gap-3 pr-24 sm:pr-28">
                      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                        <span className="text-[10px] font-semibold uppercase text-brandPink">
                          {start.toLocaleDateString(undefined, { month: "short" })}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">{start.getDate()}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold text-gray-900 text-base truncate ${isCancelled ? "line-through text-gray-400" : ""}`}>
                            {appointment.title}
                          </h3>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${statusTone}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${isCancelled ? "line-through text-gray-400" : "text-primary"}`}>
                          {formatRangeTime(appointment.appointmentStart, appointment.appointmentEnd)}
                        </p>
                        <p className={`text-xs font-semibold text-gray-500 mt-1 truncate ${isCancelled ? "line-through" : ""}`}>
                          {appointment.client?.name || "Client"}
                        </p>
                        {appointment.notes && (
                          <p className={`text-xs text-gray-400 mt-1 truncate ${isCancelled ? "line-through" : ""}`}>
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 grid grid-cols-2 gap-1.5">
                      {phone ? (
                        <>
                          <a
                            href={`tel:${phone}`}
                            className="w-8 h-8 rounded-full bg-brandPink/10 text-brandPink flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                            aria-label={`Call ${appointment.client?.name || "client"}`}
                          >
                            {icons.phone}
                          </a>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                            aria-label={`WhatsApp ${appointment.client?.name || "client"}`}
                          >
                            {icons.whatsapp}
                          </a>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled
                            className="w-8 h-8 rounded-full bg-brandPink/10 text-brandPink flex items-center justify-center shadow-sm opacity-35"
                            aria-label="Phone number unavailable"
                          >
                            {icons.phone}
                          </button>
                          <button
                            type="button"
                            disabled
                            className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-sm opacity-35"
                            aria-label="WhatsApp unavailable"
                          >
                            {icons.whatsapp}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={appointment.status !== "scheduled"}
                        onClick={() => openEditSheet(appointment)}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shadow-sm active:scale-90 transition-transform disabled:opacity-35"
                        aria-label={`Edit ${appointment.title}`}
                      >
                        {icons.edit}
                      </button>
                      <button
                        type="button"
                        disabled={deletingAppointmentId === appointment._id || isCompleted}
                        onClick={() => deleteAppointment(appointment)}
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-sm shadow-sm active:scale-90 transition-transform disabled:opacity-60"
                        aria-label={isCancelled ? `Delete ${appointment.title}` : `Cancel ${appointment.title}`}
                      >
                        {deletingAppointmentId === appointment._id ? "..." : <TrashIcon />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <button
        type="button"
        onClick={openCreateSheet}
        className="fab-button"
        aria-label="Add appointment"
      >
        +
      </button>

      <AnimatePresence>
        {showSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={() => setShowSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bottom-sheet max-h-[88vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h2 className="mb-5 text-xl font-black text-gray-900">
                {editingAppointment
                  ? "Edit Appointment"
                  : isPastAppointmentDate(form.date)
                    ? "Past Appointment"
                    : "New Appointment"}
              </h2>

              <div className="space-y-4">
                <input
                  className="input-soft"
                  placeholder="Appointment title"
                  value={form.title}
                  maxLength="120"
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                />

                <div className="relative">
                  <input
                    className="input-soft"
                    placeholder="Search client"
                    value={form.clientSearch}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      clientSearch: e.target.value,
                      clientId: "",
                      clientName: "",
                    }))}
                  />
                  {form.clientSearch && !form.clientId && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 font-semibold">No clients found</div>
                      ) : (
                        filteredClients.map((client) => (
                          <button
                            key={client._id}
                            type="button"
                            onClick={() => selectClient(client)}
                            className="w-full flex justify-between items-center gap-3 p-4 text-left active:bg-gray-50"
                          >
                            <span className="font-bold text-sm text-gray-900 truncate">{client.name}</span>
                            <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
                              {normalizePhoneInput(client.phone) || "No phone"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {form.clientId && (
                    <div className="mt-2 text-xs font-bold text-emerald-600 px-1">
                      Selected: {form.clientName}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.date}
                    className="bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-700 outline-none"
                    onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
                  />
                  <input
                    type="time"
                    value={form.startTime}
                    className="bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-700 outline-none"
                    onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
                  />
                </div>

                <select
                  value={form.durationMinutes}
                  className="input-soft appearance-none"
                  onChange={(e) => setForm((current) => ({ ...current, durationMinutes: e.target.value }))}
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={form.notes}
                  maxLength="1000"
                  className="input-soft"
                  onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                />

                <button
                  type="button"
                  disabled={saving}
                  className="btn-primary w-full"
                  onClick={saveAppointment}
                >
                  {saving ? "Saving..." : editingAppointment ? "Save Changes" : "Save Appointment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppointmentsPage;

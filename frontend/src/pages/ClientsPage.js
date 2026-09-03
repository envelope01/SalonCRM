import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainHeader from "../components/MainHeader";
import TrashIcon from "../components/TrashIcon";
import { useConfirm } from "../dialogs/ConfirmDialogProvider";
import { clientService } from "../services/clientService";
import {
  clientValidationError,
  duplicatePhoneError,
  normalizePhoneInput,
} from "../utils/validation";
import { toast } from "../notifications/toastBus";

function Icon({ children, className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const icons = {
  search: (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Icon>
  ),
  clients: (
    <Icon className="w-7 h-7">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
};

function ClientsPage() {
  const confirm = useConfirm();

  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState("");
  const lastDuplicatePhoneRef = useRef("");

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clientService.getClients();
      setClients(res.data || []);
      setAllClients(res.data || []);
    } catch {
      setClients([]);
      setAllClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setClients(allClients);
      return;
    }

    const query = value.toLowerCase();
    const filtered = allClients.filter(
      (c) => c.name.toLowerCase().includes(query) || String(c.phone || "").includes(query)
    );

    setClients(filtered);
  };

  const addClient = async (e) => {
    e.preventDefault();

    const validationError = clientValidationError({ name, phone });
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    const duplicateError = duplicatePhoneError(phone, allClients);
    if (duplicateError) {
      toast.warning(duplicateError);
      return;
    }

    try {
      setSaving(true);
      const res = await clientService.createClient({
        name: name.trim(),
        phone: normalizePhoneInput(phone),
        notes: notes.trim(),
      });

      setClients((prev) => [res.data, ...prev]);
      setAllClients((prev) => [res.data, ...prev]);

      setName("");
      setPhone("");
      setNotes("");
      setShowModal(false);
      toast.success("Client created successfully");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneChange = (value) => {
    const nextPhone = normalizePhoneInput(value);
    const duplicateError = duplicatePhoneError(nextPhone, allClients);

    setPhone(nextPhone);

    if (duplicateError) {
      if (lastDuplicatePhoneRef.current !== nextPhone) {
        toast.warning(duplicateError);
        lastDuplicatePhoneRef.current = nextPhone;
      }
    } else {
      lastDuplicatePhoneRef.current = "";
    }
  };

  const deleteClient = async (client) => {
    const confirmed = await confirm({
      title: "Delete client?",
      message: `Delete ${client.name}? This will remove the client from the active list.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const previousClients = clients;
    const previousAllClients = allClients;

    try {
      setDeletingClientId(client._id);
      setClients((current) => current.filter((item) => item._id !== client._id));
      setAllClients((current) => current.filter((item) => item._id !== client._id));
      await clientService.deleteClient(client._id);
      toast.success("Client deleted successfully");
    } catch {
      setClients(previousClients);
      setAllClients(previousAllClients);
    } finally {
      setDeletingClientId("");
    }
  };

  const initials = (n) => {
    if (!n) return "C";
    const parts = n.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      <MainHeader title="Clients">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icons.search}</span>
            <input
              className="input-soft pl-11"
              placeholder="Search by name or phone..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
      </MainHeader>

      <main className="p-4 flex-1">
        {loading ? (
          <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              {icons.clients}
            </div>
            <p>No clients found.</p>
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {clients.map((c) => {
                const clientPhone = normalizePhoneInput(c.phone);
                const hasPhone = clientPhone.length > 0;

                return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={c._id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
                >
                  <Link to={`/clients/${c._id}`} className="flex items-center gap-3 pr-28 sm:pr-32">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm shadow-brandPink/20">
                      {initials(c.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {c.name}
                      </h3>
                      {hasPhone && (
                        <p className="text-xs font-semibold text-gray-400 mt-0.5 tracking-wide">
                          {clientPhone}
                        </p>
                      )}
                      {(c.lastVisit || c.totalSpent > 0) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {c.lastVisit && (
                          <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-md">
                            Last visit: {new Date(c.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {c.totalSpent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ₹{c.totalSpent.toLocaleString()}
                          </span>
                        )}
                      </div>
                      )}
                    </div>
                  </Link>

                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                    {hasPhone && (
                      <>
                    <a 
                      href={`https://wa.me/91${clientPhone}`} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                      aria-label={`WhatsApp ${c.name}`}
                    >
                      {icons.whatsapp}
                    </a>
                    <a 
                      href={`tel:${clientPhone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-brandPink/10 text-brandPink flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                      aria-label={`Call ${c.name}`}
                    >
                      {icons.phone}
                    </a>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={deletingClientId === c._id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteClient(c);
                      }}
                      className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-sm shadow-sm active:scale-90 transition-transform disabled:opacity-60"
                      aria-label={`Delete ${c.name}`}
                    >
                      {deletingClientId === c._id ? "..." : <TrashIcon />}
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
        onClick={() => {
          setShowModal(true);
        }}
        className="fab-button"
        aria-label="Add client"
      >
        +
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bottom-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h2 className="mb-5 text-lg font-semibold text-gray-950">New Client</h2>

              <form onSubmit={addClient} className="space-y-4">
                <input
                  className="input-soft"
                  placeholder="Full Name"
                  value={name}
                  autoFocus
                  maxLength="120"
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="input-soft"
                  placeholder="Phone Number (optional)"
                  value={phone}
                  inputMode="numeric"
                  maxLength="10"
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />

                <input
                  className="input-soft"
                  placeholder="Notes (optional)"
                  value={notes}
                  maxLength="1000"
                  onChange={(e) => setNotes(e.target.value)}
                />

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    className="btn-secondary w-1/3"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn-primary w-2/3"
                  >
                    {saving ? "Saving..." : "Save Client"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClientsPage;

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

function ClientsPage() {
  const confirm = useConfirm();

  /* ---------------- STATE ---------------- */
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- MODAL STATE ---------------- */
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState("");
  const lastDuplicatePhoneRef = useRef("");

  /* ======================================================
     FETCH CLIENTS
     ====================================================== */
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clientService.getClients();
      setClients(res.data || []);
      setAllClients(res.data || []);
    } catch (err) {
      console.error(err);
      setClients([]);
      setAllClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /* ======================================================
     LOCAL SEARCH
     ====================================================== */
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setClients(allClients);
      return;
    }

    const query = value.toLowerCase();
    const filtered = allClients.filter(
      (c) => c.name.toLowerCase().includes(query) || c.phone.includes(query)
    );

    setClients(filtered);
  };

  /* ======================================================
     ADD CLIENT
     ====================================================== */
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

  /* ======================================================
     HELPERS
     ====================================================== */
  const initials = (n) => {
    if (!n) return "C";
    const parts = n.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  /* ======================================================
     RENDER
     ====================================================== */
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      
      {/* STICKY HEADER */}
      <MainHeader title="Clients">
        <div className="flex gap-2 items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brandPink/50 transition-shadow"
              placeholder="Search by name or phone..."
              value={search}
              onChange={handleSearch}
            />
          </div>


        </div>
      </MainHeader>

      {/* CLIENT LIST */}
      <main className="p-4 flex-1">
        {loading ? (
          <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-center mt-12 text-gray-400 font-medium">
            <div className="text-4xl mb-3">👥</div>
            No clients found.
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {clients.map((c) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={c._id}
                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                  <Link to={`/clients/${c._id}`} className="flex items-center gap-4 pr-28 sm:pr-32">
                    
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-brandPink text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-inner">
                      {initials(c.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {c.name}
                      </h3>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5 tracking-wide">
                        {c.phone}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-md">
                          Visited: {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                        </span>
                        {c.totalSpent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ₹{c.totalSpent.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Quick Actions (Call / WhatsApp / Delete) */}
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                    <a 
                      href={`https://wa.me/91${c.phone.replace(/\D/g, "")}`} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-sm shadow-sm active:scale-90 transition-transform"
                    >
                      💬
                    </a>
                    <a 
                      href={`tel:${c.phone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm shadow-sm active:scale-90 transition-transform"
                    >
                      📞
                    </a>
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
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* FAB - Add Client (Pushed to bottom-28 so it sits above the BottomNav!) */}
      <button
        onClick={() => {
          setShowModal(true);
        }}
        className="fixed bottom-28 right-6 w-14 h-14 bg-brandPink text-white rounded-2xl shadow-lg shadow-brandPink/30 flex items-center justify-center text-3xl z-30 active:scale-90 transition-transform"
      >
        +
      </button>

      {/* ADD CLIENT BOTTOM SHEET */}
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
              className="bg-white w-full rounded-t-[2.5rem] p-8 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-black mb-6 text-gray-900">New Client</h2>

              <form onSubmit={addClient} className="space-y-4">
                <input
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/20"
                  placeholder="Full Name"
                  value={name}
                  autoFocus
                  maxLength="120"
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/20"
                  placeholder="Phone Number"
                  value={phone}
                  inputMode="numeric"
                  maxLength="10"
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />

                <input
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/20"
                  placeholder="Notes (optional)"
                  value={notes}
                  maxLength="1000"
                  onChange={(e) => setNotes(e.target.value)}
                />

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    className="w-1/3 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-2/3 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-70"
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

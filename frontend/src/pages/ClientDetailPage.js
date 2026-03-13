import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import TopHeader from "../components/TopHeader";

/* ======================================================
   CLIENT DETAIL PAGE (MOBILE PREMIUM)
   ====================================================== */
function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [visits, setVisits] = useState([]);

  // Edit Client State
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New Bill State
  const [visitDate, setVisitDate] = useState("");
  const [visitServices, setVisitServices] = useState([]);
  const [visitNotes, setVisitNotes] = useState("");
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  /* ======================================================
     GUARD & LOAD DATA
     ====================================================== */
  useEffect(() => {
    if (!id) navigate("/", { replace: true });
  }, [id, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const [clientRes, serviceRes, visitRes] = await Promise.all([
          api.get(`/clients/${id}`),
          api.get("/services"),
          api.get(`/visits/client/${id}`),
        ]);

        setClient(clientRes.data);
        setForm({
          name: clientRes.data.name,
          phone: clientRes.data.phone,
          notes: clientRes.data.notes || "",
        });
        setServices(serviceRes.data.filter((s) => s.isActive));
        setVisits(visitRes.data);
        setVisitDate(new Date().toISOString().slice(0, 10));
      } catch (err) {
        console.error("Failed to load client data", err);
      }
    };
    load();
  }, [id]);

  /* ======================================================
     HANDLERS
     ====================================================== */
  const saveClient = async () => {
    try {
      setIsSavingProfile(true);
      const res = await api.put(`/clients/${id}`, form);
      setClient(res.data);
      setShowEditSheet(false);
    } catch (err) {
      alert("Failed to update client");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddServiceToBill = (svc) => {
    setVisitServices((prev) => [
      ...prev,
      { _id: svc._id, name: svc.name, basePrice: svc.price, chargedPrice: svc.price },
    ]);
    setShowServicePicker(false);
  };

  const updateChargedPrice = (index, value) => {
    setVisitServices((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, chargedPrice: Math.max(0, Number(value) || 0) } : s
      )
    );
  };

  const removeService = (index) => {
    setVisitServices((prev) => prev.filter((_, i) => i !== index));
  };

  const currentTotal = useMemo(
    () => visitServices.reduce((sum, s) => sum + s.chargedPrice, 0),
    [visitServices]
  );

  const addVisit = async () => {
    if (!visitServices.length) return alert("Please add at least one service");

    try {
      setIsSavingVisit(true);
      await api.post("/visits", {
        clientId: id,
        visitDate,
        services: visitServices.map((s) => ({
          serviceId: s._id,
          chargedPrice: s.chargedPrice,
        })),
        notes: visitNotes,
        totalAmount: currentTotal,
      });

      const refreshed = await api.get(`/visits/client/${id}`);
      setVisits(refreshed.data);
      setVisitServices([]);
      setVisitNotes("");
      
      // Update local client state to reflect new total spent/last visit
      setClient(prev => ({
          ...prev, 
          lastVisit: visitDate, 
          totalSpent: (prev.totalSpent || 0) + currentTotal 
      }));
    } catch (err) {
      alert("Failed to save bill");
    } finally {
      setIsSavingVisit(false);
    }
  };

  const initials = (n) => {
    if (!n) return "C";
    const parts = n.trim().split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  };

  if (!client) return <div className="p-8 text-center text-brandPink font-bold animate-pulse">Loading profile...</div>;

  /* ======================================================
     RENDER
     ====================================================== */
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <TopHeader title="Client Profile" showBack={true} />

      <main className="p-4 space-y-6 flex-1">
        
        {/* PROFILE HERO CARD */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden text-center mt-4">
          <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-primary/10 to-brandPink/10" />
          
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-brandPink text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brandPink/20 relative z-10 border-4 border-white mb-3">
            {initials(client.name)}
          </div>
          
          <h2 className="text-xl font-black text-gray-900">{client.name}</h2>
          <p className="text-sm font-semibold text-gray-500 mt-1">{client.phone}</p>
          
          {client.notes && (
            <div className="mt-3 bg-gray-50 p-3 rounded-2xl text-xs text-gray-600 italic">
              "{client.notes}"
            </div>
          )}

          <div className="flex justify-center gap-3 mt-5">
            <a href={`tel:${client.phone}`} className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl shadow-sm active:scale-95 transition-transform">
              📞
            </a>
            <a href={`https://wa.me/91${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center text-xl shadow-sm active:scale-95 transition-transform">
              💬
            </a>
            <button onClick={() => setShowEditSheet(true)} className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl shadow-sm active:scale-95 transition-transform">
              ✎
            </button>
          </div>
        </motion.div>

        {/* NEW BILL (RECEIPT CARD) */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <span>📝</span> New Bill
          </h3>

          <div className="space-y-4">
            <input
              type="date"
              className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-bold text-gray-700 outline-none"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />

            {/* Services List (The Receipt) */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200">
              {visitServices.length === 0 ? (
                <div className="text-center text-gray-400 py-4 text-sm font-medium">Tap below to add services</div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {visitServices.map((s, i) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} key={i} className="flex justify-between items-center group">
                        <div className="flex items-center gap-2 flex-1">
                          <button onClick={() => removeService(i)} className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-bold active:scale-90">×</button>
                          <span className="text-sm font-bold text-gray-700">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200">
                          <span className="text-xs text-brandPink font-bold">₹</span>
                          <input
                            type="number"
                            className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 focus:outline-none"
                            value={s.chargedPrice}
                            onChange={(e) => updateChargedPrice(i, e.target.value)}
                            onClick={(e) => e.target.select()}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <button onClick={() => setShowServicePicker(true)} className="w-full border-2 border-dashed border-brandPink/30 text-brandPink font-bold py-3 rounded-2xl active:bg-brandPink/5 transition-colors">
              + Add Service
            </button>

            <input
              type="text"
              placeholder="Any remarks? (Optional)"
              className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm outline-none"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
            />

            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</p>
                <p className="text-2xl font-black text-gray-900">₹{currentTotal}</p>
              </div>
              <button 
                onClick={addVisit} 
                disabled={isSavingVisit || visitServices.length === 0}
                className="bg-primary text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSavingVisit ? "Saving..." : "Save Bill"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* TIMELINE (VISIT HISTORY) */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
            <span>🕰️</span> Visit History
          </h3>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {visits.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No visits recorded yet.</p>}
            
            {visits.map((v, index) => (
              <div key={v._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline Dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-brandPink text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                
                {/* Content Card */}
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(v.visitDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-sm font-black text-primary">₹{v.totalAmount}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    {v.services.map((s) => s.name).join(" • ")}
                  </div>
                  {v.notes && <div className="text-xs text-gray-500 italic mt-2">Note: {v.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </main>

      {/* BOTTOM SHEET: EDIT PROFILE */}
      <AnimatePresence>
        {showEditSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowEditSheet(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full rounded-t-[2.5rem] p-8 pb-12" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-black mb-6 text-gray-900">Edit Profile</h2>
              <div className="space-y-4">
                <input className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
                <input className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none" value={form.phone} inputMode="numeric" onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder="Phone Number" />
                <input className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
                <button onClick={saveClient} disabled={isSavingProfile} className="w-full bg-primary text-white py-4 rounded-2xl font-bold mt-2 shadow-lg shadow-primary/20">
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM SHEET: SERVICE PICKER */}
      <AnimatePresence>
        {showServicePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowServicePicker(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full h-[70vh] rounded-t-[2.5rem] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 pb-2 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-black text-gray-900">Select Service</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {services.map(s => (
                  <button key={s._id} onClick={() => handleAddServiceToBill(s)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center active:scale-95 transition-transform shadow-sm">
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{s.category || 'General'}</p>
                    </div>
                    <p className="font-black text-brandPink">₹{s.price}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default ClientDetailPage;
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TopHeader from "../components/TopHeader";
import TrashIcon from "../components/TrashIcon";
import { useConfirm } from "../dialogs/ConfirmDialogProvider";
import { clientService } from "../services/clientService";
import { serviceService } from "../services/serviceService";
import { settingsService } from "../services/settingsService";
import { visitService } from "../services/visitService";
import { appConfig } from "../config";
import {
  clientValidationError,
  isValidDate,
  normalizePhoneInput,
  parseMoney,
} from "../utils/validation";
import { toast } from "../notifications/toastBus";

/* ======================================================
   CLIENT DETAIL PAGE (MOBILE PREMIUM)
   ====================================================== */
function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  /* ---------------- STATE ---------------- */
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [visits, setVisits] = useState([]);
  const [billSettings, setBillSettings] = useState({
    paymentUrl: appConfig.paymentUrl,
    instagramUrl: appConfig.instagramUrl,
    googleReviewUrl: appConfig.googleReviewUrl,
    billMessageTemplate: appConfig.billMessageTemplate,
    billServiceLineTemplate: appConfig.billServiceLineTemplate,
    billDiscountLineTemplate: appConfig.billDiscountLineTemplate,
  });

  // Edit Client State
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // New Bill State
  const [visitDate, setVisitDate] = useState("");
  const [visitServices, setVisitServices] = useState([]);
  const [discountPercent, setDiscountPercent] = useState("");
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
        const [clientRes, serviceRes, visitRes, settingsRes] = await Promise.all([
          clientService.getClientById(id),
          serviceService.getServices(),
          visitService.getClientVisits(id),
          settingsService.getSettings({ suppressGlobalErrorToast: true }).catch(() => ({ data: null })),
        ]);

        setClient(clientRes.data);
        setForm({
          name: clientRes.data.name,
          phone: clientRes.data.phone,
          notes: clientRes.data.notes || "",
        });
        setServices(serviceRes.data.filter((s) => s.isActive));
        setVisits(visitRes.data);
        if (settingsRes.data) {
          setBillSettings((current) => ({ ...current, ...settingsRes.data }));
        }
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
    const validationError = clientValidationError(form);
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await clientService.updateClient(id, {
        name: form.name.trim(),
        phone: normalizePhoneInput(form.phone),
        notes: form.notes.trim(),
      });
      setClient(res.data);
      setShowEditSheet(false);
      toast.success("Client updated successfully");
    } catch {
    } finally {
      setIsSavingProfile(false);
    }
  };

  const deleteClient = async () => {
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

    try {
      setIsDeletingClient(true);
      await clientService.deleteClient(id);
      toast.success("Client deleted successfully");
      navigate("/", { replace: true });
    } catch {
      setIsDeletingClient(false);
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
    const amount = parseMoney(value);
    setVisitServices((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, chargedPrice: amount ?? 0 } : s
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

  const normalizedDiscountPercent = useMemo(() => {
    const parsed = parseMoney(discountPercent);
    if (parsed === null) return 0;
    return Math.min(Math.max(parsed, 0), 100);
  }, [discountPercent]);

  const discountAmount = useMemo(
    () => Math.round((currentTotal * normalizedDiscountPercent / 100) * 100) / 100,
    [currentTotal, normalizedDiscountPercent]
  );

  const discountedTotal = useMemo(
    () => Math.max(0, Math.round((currentTotal - discountAmount) * 100) / 100),
    [currentTotal, discountAmount]
  );

  const discountedVisitServices = useMemo(() => {
    if (!visitServices.length) return [];
    if (!normalizedDiscountPercent) return visitServices;

    const factor = (100 - normalizedDiscountPercent) / 100;
    let runningTotal = 0;

    return visitServices.map((service, index) => {
      const isLast = index === visitServices.length - 1;
      const chargedPrice = isLast
        ? Math.max(0, Math.round((discountedTotal - runningTotal) * 100) / 100)
        : Math.max(0, Math.round((service.chargedPrice * factor) * 100) / 100);

      runningTotal += chargedPrice;
      return { ...service, chargedPrice };
    });
  }, [visitServices, normalizedDiscountPercent, discountedTotal]);

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const handleDiscountChange = (value) => {
    const amount = parseMoney(value);
    if (value === "") {
      setDiscountPercent("");
      return;
    }

    if (amount === null) {
      return;
    }

    setDiscountPercent(String(Math.min(amount, 100)));
  };

  const fillTemplate = (template, values) => {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
      template
    );
  };

  const buildBillMessage = () => {
    const servicesList = visitServices.map((service, index) => {
      const discountedService = discountedVisitServices[index] || service;

      return fillTemplate(billSettings.billServiceLineTemplate, {
        Index: String(index + 1),
        ServiceName: service.name,
        ServiceAmount: formatMoney(discountedService.chargedPrice),
      });
    }).join("\n");

    const discountSection = normalizedDiscountPercent > 0
      ? fillTemplate(billSettings.billDiscountLineTemplate, {
          DiscountAmount: formatMoney(discountAmount),
          DiscountPercent: formatMoney(normalizedDiscountPercent),
        })
      : "";

    const paymentUrl = fillTemplate(billSettings.paymentUrl, {
      BillAmount: formatMoney(discountedTotal),
      Amount: formatMoney(discountedTotal),
      CustomerName: client.name,
    });

    const values = {
      CustomerName: client.name,
      ServicesList: servicesList,
      SubtotalAmount: formatMoney(currentTotal),
      BillAmount: formatMoney(discountedTotal),
      DiscountAmount: formatMoney(discountAmount),
      DiscountPercent: formatMoney(normalizedDiscountPercent),
      DiscountSection: discountSection,
      PaymentURL: paymentUrl,
      InstagramURL: billSettings.instagramUrl,
      GoogleReviewURL: billSettings.googleReviewUrl,
    };

    return fillTemplate(billSettings.billMessageTemplate, values)
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const buildWhatsAppUrl = () => {
    const phone = (client.phone || "").replace(/\D/g, "");
    if (!phone) return "";

    const countryCodePhone = phone.startsWith("91") ? phone : `91${phone}`;
    return `https://wa.me/${countryCodePhone}?text=${encodeURIComponent(buildBillMessage())}`;
  };

  const addVisit = async ({ sendWhatsApp = false } = {}) => {
    if (!isValidDate(visitDate)) {
      toast.warning("Visit date is required");
      return;
    }

    if (!visitServices.length) {
      toast.warning("Please add at least one service");
      return;
    }

    if (visitServices.some((service) => parseMoney(service.chargedPrice) === null)) {
      toast.warning("Each service amount must be valid");
      return;
    }

    const whatsappUrl = sendWhatsApp ? buildWhatsAppUrl() : "";
    if (sendWhatsApp && !whatsappUrl) {
      toast.warning("Client phone number is missing");
      return;
    }

    try {
      setIsSavingVisit(true);
      const discountNote = normalizedDiscountPercent
        ? `Discount: ${normalizedDiscountPercent}% (-₹${formatMoney(discountAmount)}).`
        : "";
      const combinedNotes = [discountNote, visitNotes.trim()].filter(Boolean).join(" ");

      await visitService.createVisit({
        clientId: id,
        visitDate,
        services: discountedVisitServices.map((s) => ({
          serviceId: s._id,
          chargedPrice: s.chargedPrice,
        })),
        notes: combinedNotes,
        totalAmount: discountedTotal,
      });

      const refreshed = await visitService.getClientVisits(id);
      setVisits(refreshed.data);
      setVisitServices([]);
      setDiscountPercent("");
      setVisitNotes("");
      
      // Update local client state to reflect new total spent/last visit
      setClient(prev => ({
          ...prev, 
          lastVisit: visitDate, 
          totalSpent: (prev.totalSpent || 0) + discountedTotal 
      }));
      toast.success("Bill saved successfully");
      if (whatsappUrl) {
        window.location.href = whatsappUrl;
      }
    } catch {
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
            <button
              type="button"
              disabled={isDeletingClient}
              onClick={deleteClient}
              className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl shadow-sm active:scale-95 transition-transform disabled:opacity-60"
              aria-label="Delete client"
            >
              {isDeletingClient ? "..." : <TrashIcon className="h-5 w-5" />}
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
              required
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
                            min="0"
                            step="1"
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

            <div className="grid grid-cols-[1fr_auto] gap-3 items-center bg-gray-50 p-4 rounded-2xl">
              <label className="text-xs font-bold text-gray-500 uppercase" htmlFor="bill-discount">
                Discount
              </label>
              <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-gray-100">
                <input
                  id="bill-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  className="w-14 bg-transparent text-right text-sm font-black text-gray-900 focus:outline-none"
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  onClick={(e) => e.target.select()}
                />
                <span className="text-xs font-black text-brandPink">%</span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Any remarks? (Optional)"
              className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm outline-none"
              value={visitNotes}
              maxLength="1000"
              onChange={(e) => setVisitNotes(e.target.value)}
            />

            <div className="pt-2 space-y-3">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span>&#8377;{formatMoney(currentTotal)}</span>
                </div>
                {normalizedDiscountPercent > 0 && (
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Discount ({normalizedDiscountPercent}%)</span>
                    <span>-&#8377;{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</span>
                  <span className="text-2xl font-black text-gray-900">&#8377;{formatMoney(discountedTotal)}</span>
                </div>
              </div>
              <button 
                onClick={() => addVisit({ sendWhatsApp: true })} 
                disabled={isSavingVisit}
                className="w-full bg-primary text-white px-4 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSavingVisit ? "Saving..." : "Save & WhatsApp"}
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
                <input className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none" value={form.name} maxLength="120" onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
                <input className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none" value={form.phone} inputMode="numeric" maxLength="10" onChange={(e) => setForm({ ...form, phone: normalizePhoneInput(e.target.value) })} placeholder="Phone Number" />
                <input className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none" value={form.notes} maxLength="1000" onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
                <button onClick={saveClient} disabled={isSavingProfile} className="w-full bg-primary text-white py-4 rounded-2xl font-bold mt-2 shadow-lg shadow-primary/20 disabled:opacity-70">
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

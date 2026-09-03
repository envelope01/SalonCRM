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

function Icon({ children, className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const icons = {
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
  bill: (
    <Icon>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </Icon>
  ),
  history: (
    <Icon>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  check: (
    <Icon className="w-3 h-3">
      <path d="M20 6L9 17l-5-5" />
    </Icon>
  ),
};

function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

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

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const [visitDate, setVisitDate] = useState("");
  const [visitServices, setVisitServices] = useState([]);
  const [discountPercent, setDiscountPercent] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [deletingVisitId, setDeletingVisitId] = useState("");

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
          phone: clientRes.data.phone || "",
          notes: clientRes.data.notes || "",
        });
        setServices(serviceRes.data.filter((s) => s.isActive));
        setVisits(visitRes.data);
        if (settingsRes.data) {
          setBillSettings((current) => ({ ...current, ...settingsRes.data }));
        }
        setVisitDate(new Date().toISOString().slice(0, 10));
      } catch {
        toast.error("Unable to load client profile");
      }
    };
    load();
  }, [id]);

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

  const formatVisitDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getVisitSummary = (visitList) => {
    const totalSpent = visitList.reduce(
      (sum, visit) => sum + Number(visit.totalAmount || 0),
      0
    );
    const lastVisit = visitList.reduce((latest, visit) => {
      if (!visit.visitDate) return latest;
      if (!latest) return visit.visitDate;

      return new Date(visit.visitDate) > new Date(latest) ? visit.visitDate : latest;
    }, null);

    return { lastVisit, totalSpent };
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
    const phone = String(client.phone || "").replace(/\D/g, "");
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
      const nextVisits = refreshed.data || [];
      setVisits(nextVisits);
      setVisitServices([]);
      setDiscountPercent("");
      setVisitNotes("");
      
      setClient((prev) => ({
        ...prev,
        ...getVisitSummary(nextVisits),
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

  const deleteVisit = async (visit) => {
    const confirmed = await confirm({
      title: "Delete visit?",
      message: `Delete the visit from ${formatVisitDate(visit.visitDate)}? This will remove it from history and reports.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const previousVisits = visits;
    const previousClient = client;
    const nextVisits = visits.filter((item) => item._id !== visit._id);

    try {
      setDeletingVisitId(visit._id);
      setVisits(nextVisits);
      setClient((prev) => ({
        ...prev,
        ...getVisitSummary(nextVisits),
      }));
      await visitService.deleteVisit(visit._id);
      toast.success("Visit deleted successfully");
    } catch {
      setVisits(previousVisits);
      setClient(previousClient);
    } finally {
      setDeletingVisitId("");
    }
  };

  const initials = (n) => {
    if (!n) return "C";
    const parts = n.trim().split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  };

  if (!client) return <div className="p-8 text-center text-brandPink font-bold animate-pulse">Loading profile...</div>;

  const clientPhone = String(client.phone || "").replace(/\D/g, "");
  const hasPhone = clientPhone.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <TopHeader title="Client Profile" showBack={true} />

      <main className="flex-1 space-y-4 p-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
          <div className="absolute left-0 top-0 h-14 w-full bg-gradient-to-r from-primary/8 to-brandPink/8" />
          
          <div className="relative z-10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-primary text-xl font-semibold text-white shadow-sm shadow-brandPink/20">
            {initials(client.name)}
          </div>
          
          <h2 className="text-lg font-semibold text-gray-950">{client.name}</h2>
          {hasPhone && (
            <p className="text-sm font-semibold text-gray-500 mt-1">{clientPhone}</p>
          )}
          
          {client.notes && (
            <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              {client.notes}
            </div>
          )}

          <div className="flex justify-center gap-3 mt-5">
            {hasPhone && (
              <>
            <a href={`tel:${clientPhone}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brandPink/10 text-brandPink transition-transform active:scale-95" aria-label={`Call ${client.name}`}>
              {icons.phone}
            </a>
            <a href={`https://wa.me/91${clientPhone}`} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-500 transition-transform active:scale-95" aria-label={`WhatsApp ${client.name}`}>
              {icons.whatsapp}
            </a>
              </>
            )}
            <button onClick={() => setShowEditSheet(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-transform active:scale-95" aria-label="Edit client">
              {icons.edit}
            </button>
            <button
              type="button"
              disabled={isDeletingClient}
              onClick={deleteClient}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-transform active:scale-95 disabled:opacity-60"
              aria-label="Delete client"
            >
              {isDeletingClient ? "..." : <TrashIcon className="h-5 w-5" />}
            </button>
          </div>

        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-950">
            <span className="text-brandPink">{icons.bill}</span> New Bill
          </h3>

          <div className="space-y-4">
            <input
              type="date"
              required
              className="input-soft"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />

            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
              {visitServices.length === 0 ? (
                <div className="text-center text-gray-400 py-4 text-sm font-medium">Tap below to add services</div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {visitServices.map((s, i) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} key={i} className="flex justify-between items-center group">
                        <div className="flex flex-1 items-center gap-2">
                          <button type="button" onClick={() => removeService(i)} className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-500 active:scale-95">×</button>
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

            <button type="button" onClick={() => setShowServicePicker(true)} className="w-full rounded-xl border border-dashed border-brandPink/30 py-3 text-sm font-semibold text-brandPink transition-colors active:bg-brandPink/5">
              + Add Service
            </button>

            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-gray-50 p-4">
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
                  className="w-14 bg-transparent text-right text-sm font-semibold text-gray-900 focus:outline-none"
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  onClick={(e) => e.target.select()}
                />
                <span className="text-xs font-semibold text-brandPink">%</span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Any remarks? (Optional)"
              className="input-soft"
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
                  <span className="text-xl font-semibold text-gray-950">&#8377;{formatMoney(discountedTotal)}</span>
                </div>
              </div>
              <button 
                onClick={() => addVisit({ sendWhatsApp: hasPhone })} 
                disabled={isSavingVisit}
                className="btn-primary w-full"
              >
                {isSavingVisit ? "Saving..." : hasPhone ? "Save & WhatsApp" : "Save"}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 font-semibold text-gray-950">
            <span className="text-brandPink">{icons.history}</span> Visit History
          </h3>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {visits.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No visits recorded yet.</p>}
            
            {visits.map((v) => (
              <div key={v._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-brandPink text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {icons.check}
                </div>
                
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {formatVisitDate(v.visitDate)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">₹{v.totalAmount}</span>
                      <button
                        type="button"
                        disabled={deletingVisitId === v._id}
                        onClick={() => deleteVisit(v)}
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm active:scale-90 transition-transform disabled:opacity-60"
                        aria-label={`Delete visit from ${formatVisitDate(v.visitDate)}`}
                      >
                        {deletingVisitId === v._id ? "..." : <TrashIcon />}
                      </button>
                    </div>
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

      <AnimatePresence>
        {showEditSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowEditSheet(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h2 className="mb-5 text-lg font-semibold text-gray-950">Edit Profile</h2>
              <div className="space-y-4">
                <input className="input-soft" value={form.name} maxLength="120" onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
                <input className="input-soft" value={form.phone} inputMode="numeric" maxLength="10" onChange={(e) => setForm({ ...form, phone: normalizePhoneInput(e.target.value) })} placeholder="Phone Number (optional)" />
                <input className="input-soft" value={form.notes} maxLength="1000" onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
                <button onClick={saveClient} disabled={isSavingProfile} className="btn-primary mt-2 w-full">
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showServicePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowServicePicker(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="flex h-[70vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 pb-2 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-950">Select Service</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {services.map(s => (
                  <button key={s._id} onClick={() => handleAddServiceToBill(s)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center active:scale-95 transition-transform shadow-sm">
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{s.category || 'General'}</p>
                    </div>
                    <p className="font-semibold text-brandPink">₹{s.price}</p>
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

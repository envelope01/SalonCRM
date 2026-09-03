import React, { useEffect, useMemo, useState } from "react";
import MainHeader from "../components/MainHeader";
import { appConfig } from "../config";
import { settingsService } from "../services/settingsService";
import { staffService } from "../services/staffService";
import { toast } from "../notifications/toastBus";

function Icon({ children, className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const icons = {
  upi: (
    <Icon>
      <path d="M4 7h16" />
      <path d="M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M9 11h6" />
      <path d="M9 15h3" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  ),
  whatsapp: (
    <Icon>
      <path d="M20 11.5a8 8 0 0 1-11.8 7.02L4 20l1.48-4.2A8 8 0 1 1 20 11.5z" />
      <path d="M9.5 8.5c.2 2 1.8 4.1 4 5.1l1.2-1.1 2 .8c-.3 1.2-1.2 2-2.5 2-2.8 0-6.5-3.6-6.5-6.4 0-1.3.8-2.2 2-2.5l.8 2.1-.5 0z" />
    </Icon>
  ),
  staff: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </Icon>
  ),
  salon: (
    <Icon>
      <path d="M4 21h16" />
      <path d="M6 21V8l6-4 6 4v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h6" />
    </Icon>
  ),
};

function extractUpiId(paymentUrl) {
  try {
    const parsed = new URL(paymentUrl);
    return parsed.searchParams.get("pa") || "";
  } catch {
    const match = String(paymentUrl || "").match(/[?&]pa=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
}

function buildPaymentUrl(upiId) {
  return `upi://pay?pa=${encodeURIComponent(String(upiId || "").trim())}&pn=SalonName&am={{BillAmount}}&cu=INR`;
}

function fillTemplate(template, values) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
    template || "",
  );
}

const exampleValues = {
  customer: "Vivek",
  services: [
    { name: "Hair Spa", amount: "1,200" },
    { name: "Beard Trim", amount: "300" },
  ],
  subtotal: "1,500",
  discount: "10",
  discountAmount: "150",
  total: "1,350",
};

function buildPreview(settings) {
  const serviceLineTemplate = settings.billServiceLineTemplate || appConfig.billServiceLineTemplate;
  const discountLineTemplate = settings.billDiscountLineTemplate || appConfig.billDiscountLineTemplate;
  const billTemplate = settings.billMessageTemplate || appConfig.billMessageTemplate;
  const serviceLines = exampleValues.services
    .map((service, index) => fillTemplate(serviceLineTemplate, {
      Index: String(index + 1),
      ServiceName: service.name,
      ServiceAmount: service.amount,
    }))
    .join("\n");
  const paymentUrl = buildPaymentUrl(settings.upiId || "");
  const discountSection = fillTemplate(discountLineTemplate, {
    DiscountPercent: exampleValues.discount,
    DiscountAmount: exampleValues.discountAmount,
  });

  return fillTemplate(billTemplate, {
    CustomerName: exampleValues.customer,
    ServicesList: serviceLines,
    SubtotalAmount: exampleValues.subtotal,
    DiscountSection: discountSection,
    DiscountPercent: exampleValues.discount,
    DiscountAmount: exampleValues.discountAmount,
    BillAmount: exampleValues.total,
    PaymentURL: paymentUrl.replace("{{BillAmount}}", exampleValues.total),
    InstagramURL: settings.instagramUrl || "https://instagram.com/your_salon",
    GoogleReviewURL: settings.googleReviewUrl || "https://g.page/r/your-review-link",
  }).replace(/\n{3,}/g, "\n\n").trim();
}

function sampleToTemplate(message, settings) {
  const paymentUrl = buildPaymentUrl(settings.upiId || "").replace("{{BillAmount}}", exampleValues.total);
  const serviceLines = exampleValues.services
    .map((service, index) => `${index + 1}. ${service.name} - ₹${service.amount}`)
    .join("\n");

  return String(message || "")
    .replaceAll(exampleValues.customer, "{{CustomerName}}")
    .replace(serviceLines, "{{ServicesList}}")
    .replaceAll(`₹${exampleValues.subtotal}`, "₹{{SubtotalAmount}}")
    .replaceAll(`₹${exampleValues.total}`, "₹{{BillAmount}}")
    .replaceAll(paymentUrl, "{{PaymentURL}}")
    .replaceAll(settings.instagramUrl || "https://instagram.com/your_salon", "{{InstagramURL}}")
    .replaceAll(settings.googleReviewUrl || "https://g.page/r/your-review-link", "{{GoogleReviewURL}}")
    .replace(`Discount: ${exampleValues.discount}% (-₹${exampleValues.discountAmount})`, "{{DiscountSection}}")
    .trim();
}

function sampleLineToTemplate(line, type) {
  const value = String(line || "").trim();
  if (type === "service") {
    return value
      .replace("1", "{{Index}}")
      .replace("Hair Spa", "{{ServiceName}}")
      .replace("1,200", "{{ServiceAmount}}");
  }

  return value
    .replace("10", "{{DiscountPercent}}")
    .replace("150", "{{DiscountAmount}}");
}

const emptyStaffForm = {
  name: "",
  email: "",
  password: "",
};

function SettingsPage() {
  const [settings, setSettings] = useState({
    upiId: appConfig.upiId,
    paymentUrl: appConfig.paymentUrl,
    instagramUrl: appConfig.instagramUrl,
    googleReviewUrl: appConfig.googleReviewUrl,
    billMessageTemplate: appConfig.billMessageTemplate,
    billServiceLineTemplate: appConfig.billServiceLineTemplate,
    billDiscountLineTemplate: appConfig.billDiscountLineTemplate,
  });
  const [staff, setStaff] = useState([]);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [messageDraft, setMessageDraft] = useState("");
  const [serviceLineDraft, setServiceLineDraft] = useState("1. Hair Spa - ₹1,200");
  const [discountLineDraft, setDiscountLineDraft] = useState("Discount: 10% (-₹150)");
  const [editingMessage, setEditingMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [settingsRes, staffRes] = await Promise.all([
          settingsService.getSettings(),
          staffService.listStaff(),
        ]);
        const nextSettings = settingsRes.data || {};
        setSettings((current) => ({
          ...current,
          ...nextSettings,
          upiId: nextSettings.upiId || extractUpiId(nextSettings.paymentUrl || current.paymentUrl),
        }));
        const mergedSettings = {
          ...appConfig,
          ...nextSettings,
          upiId: nextSettings.upiId || extractUpiId(nextSettings.paymentUrl || appConfig.paymentUrl),
        };
        setMessageDraft(buildPreview(mergedSettings));
        setServiceLineDraft(fillTemplate(mergedSettings.billServiceLineTemplate || appConfig.billServiceLineTemplate, {
          Index: "1",
          ServiceName: "Hair Spa",
          ServiceAmount: "1,200",
        }));
        setDiscountLineDraft(fillTemplate(mergedSettings.billDiscountLineTemplate || appConfig.billDiscountLineTemplate, {
          DiscountPercent: "10",
          DiscountAmount: "150",
        }));
        setStaff(staffRes.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const previewMessage = useMemo(() => {
    if (editingMessage) return messageDraft;
    return buildPreview(settings);
  }, [editingMessage, messageDraft, settings]);

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateStaffField = (key, value) => {
    setStaffForm((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await settingsService.updateSettings({
        upiId: settings.upiId.trim(),
        instagramUrl: settings.instagramUrl.trim(),
        googleReviewUrl: settings.googleReviewUrl.trim(),
        billMessageTemplate: sampleToTemplate(editingMessage ? messageDraft : previewMessage, settings),
        billServiceLineTemplate: sampleLineToTemplate(serviceLineDraft, "service"),
        billDiscountLineTemplate: sampleLineToTemplate(discountLineDraft, "discount"),
      });
      setSettings((current) => ({ ...current, ...res.data }));
      setEditingMessage(false);
      toast.success("Settings saved successfully");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password) {
      toast.warning("Staff name, email, and password are required");
      return;
    }

    try {
      setSavingStaff(true);
      await staffService.createStaff({
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
      });
      const staffRes = await staffService.listStaff();
      setStaff(staffRes.data || []);
      setStaffForm(emptyStaffForm);
      toast.success("Staff member added");
    } catch {
    } finally {
      setSavingStaff(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      <MainHeader title="Settings" />

      <main className="p-4 space-y-4 flex-1">
        {loading ? (
          <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading settings...</div>
        ) : (
          <>
            <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brandPink/10 text-brandPink">{icons.salon}</div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-950">Salon Links</h2>
                  <p className="text-xs font-medium text-gray-400">Only paste what your salon owns.</p>
                </div>
              </div>

              <label className="block">
                <span className="text-[10px] font-semibold text-gray-400 uppercase">UPI ID</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 focus-within:ring-2 focus-within:ring-brandPink/20">
                  <span className="text-brandPink">{icons.upi}</span>
                  <input
                    type="text"
                    className="w-0 min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-gray-900 outline-none"
                    placeholder="Paste your UPI ID"
                    value={settings.upiId || ""}
                    maxLength="120"
                    onChange={(e) => updateField("upiId", e.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Instagram URL</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 focus-within:ring-2 focus-within:ring-brandPink/20">
                  <span className="text-gray-500">{icons.link}</span>
                  <input
                    type="url"
                    className="w-0 min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-gray-900 outline-none"
                    placeholder="https://instagram.com/your_salon"
                    value={settings.instagramUrl || ""}
                    maxLength="1000"
                    onChange={(e) => updateField("instagramUrl", e.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Google Review URL</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 focus-within:ring-2 focus-within:ring-brandPink/20">
                  <span className="text-gray-500">{icons.link}</span>
                  <input
                    type="url"
                    className="w-0 min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-gray-900 outline-none"
                    placeholder="https://g.page/r/your-review-link"
                    value={settings.googleReviewUrl || ""}
                    maxLength="1000"
                    onChange={(e) => updateField("googleReviewUrl", e.target.value)}
                  />
                </div>
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={saveSettings}
                className="btn-primary w-full"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">{icons.whatsapp}</div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-950">WhatsApp Bill Preview</h2>
                    <p className="text-xs font-medium text-gray-400">This is what customers will receive.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextEditing = !editingMessage;
                    if (nextEditing) {
                      setMessageDraft(buildPreview(settings));
                    }
                    setEditingMessage(nextEditing);
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-transform active:scale-95"
                >
                  {editingMessage ? "Preview" : "Edit Message"}
                </button>
              </div>

              {editingMessage ? (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Message</span>
                    <textarea
                      rows="12"
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      className="mt-2 w-full resize-none rounded-xl border border-gray-100 bg-gray-50 p-4 font-sans text-sm leading-relaxed text-gray-800 outline-none focus:ring-2 focus:ring-brandPink/20"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Service Line Sample</span>
                      <input
                        value={serviceLineDraft}
                        onChange={(e) => setServiceLineDraft(e.target.value)}
                        className="input-soft mt-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Discount Line Sample</span>
                      <input
                        value={discountLineDraft}
                        onChange={(e) => setDiscountLineDraft(e.target.value)}
                        className="input-soft mt-2"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageDraft(buildPreview({ ...settings, billMessageTemplate: appConfig.billMessageTemplate }));
                      setServiceLineDraft("1. Hair Spa - ₹1,200");
                      setDiscountLineDraft("Discount: 10% (-₹150)");
                    }}
                    className="text-xs font-semibold text-brandPink"
                  >
                    Reset to suggested message
                  </button>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words rounded-xl border border-gray-100 bg-gray-50 p-4 font-sans text-sm leading-relaxed text-gray-700">
                  {previewMessage}
                </pre>
              )}

              {!editingMessage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-gray-400">Service Line</p>
                    <p className="mt-2 break-words text-sm font-medium text-gray-800">{serviceLineDraft}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-gray-400">Discount Line</p>
                    <p className="mt-2 break-words text-sm font-medium text-gray-800">{discountLineDraft}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={saveSettings}
                className="btn-primary w-full"
              >
                {saving ? "Saving..." : "Save WhatsApp Message"}
              </button>
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icons.staff}</div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-950">Staff</h2>
                  <p className="text-xs font-medium text-gray-400">Add staff logins for your salon.</p>
                </div>
              </div>

              <form onSubmit={createStaff} className="grid gap-3">
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => updateStaffField("name", e.target.value)}
                  placeholder="Staff name"
                  maxLength="120"
                  className="input-soft"
                />
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => updateStaffField("email", e.target.value)}
                  placeholder="Staff email"
                  maxLength="254"
                  className="input-soft"
                />
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => updateStaffField("password", e.target.value)}
                  placeholder="Temporary password"
                  maxLength="128"
                  className="input-soft"
                />
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="btn-primary w-full"
                >
                  {savingStaff ? "Adding..." : "Add Staff"}
                </button>
              </form>

              <div className="space-y-2">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">{member.name}</p>
                      <p className="text-xs font-bold text-gray-400 truncate">{member.email}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${member.role === "owner" ? "bg-brandPink/10 text-brandPink" : "bg-primary/10 text-primary"}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default SettingsPage;

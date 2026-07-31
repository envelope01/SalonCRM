import React, { useEffect, useState } from "react";
import MainHeader from "../components/MainHeader";
import { appConfig } from "../config";
import { settingsService } from "../services/settingsService";
import { toast } from "../notifications/toastBus";

const settingFields = [
  { key: "paymentUrl", label: "Payment URL", type: "input" },
  { key: "instagramUrl", label: "Instagram URL", type: "input" },
  { key: "googleReviewUrl", label: "Google Review URL", type: "input" },
  { key: "billMessageTemplate", label: "WhatsApp Bill Message", type: "textarea", rows: 12 },
  { key: "billServiceLineTemplate", label: "Service Line", type: "textarea", rows: 3 },
  { key: "billDiscountLineTemplate", label: "Discount Line", type: "textarea", rows: 3 },
];

function SettingsPage() {
  const [settings, setSettings] = useState({
    paymentUrl: appConfig.paymentUrl,
    instagramUrl: appConfig.instagramUrl,
    googleReviewUrl: appConfig.googleReviewUrl,
    billMessageTemplate: appConfig.billMessageTemplate,
    billServiceLineTemplate: appConfig.billServiceLineTemplate,
    billDiscountLineTemplate: appConfig.billDiscountLineTemplate,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsService.getSettings();
        setSettings((current) => ({ ...current, ...res.data }));
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const restoreTemplates = () => {
    setSettings((current) => ({
      ...current,
      billMessageTemplate: appConfig.billMessageTemplate,
      billServiceLineTemplate: appConfig.billServiceLineTemplate,
      billDiscountLineTemplate: appConfig.billDiscountLineTemplate,
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await settingsService.updateSettings(settings);
      setSettings((current) => ({ ...current, ...res.data }));
      toast.success("Settings saved successfully");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      <MainHeader title="Settings" />

      <main className="p-4 space-y-4 flex-1">
        {loading ? (
          <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading settings...</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm space-y-4">
              {settingFields.slice(0, 3).map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{field.label}</span>
                  <input
                    type="url"
                    className="mt-2 w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/20"
                    value={settings[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-gray-900">WhatsApp Templates</h2>
                <button
                  type="button"
                  onClick={restoreTemplates}
                  className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                >
                  Restore
                </button>
              </div>
              {settingFields.slice(3).map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{field.label}</span>
                  <textarea
                    rows={field.rows}
                    className="mt-2 w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brandPink/20 resize-none leading-relaxed"
                    value={settings[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveSettings}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default SettingsPage;

import { defaultAppSettings, appSettingKeys, type AppSettings } from "../config/appSettings";
import { badRequest } from "../lib/httpErrors";
import { optionalText } from "../lib/validation";
import { settingsRepository } from "../repositories/settingsRepository";
import { requireSalonId } from "./tenantContext";

const maxLengths: Record<keyof AppSettings, number> = {
  upiId: 120,
  paymentUrl: 1000,
  instagramUrl: 1000,
  googleReviewUrl: 1000,
  billMessageTemplate: 5000,
  billServiceLineTemplate: 500,
  billDiscountLineTemplate: 500,
};

function extractUpiId(paymentUrl: string) {
  try {
    const parsed = new URL(paymentUrl);
    return parsed.searchParams.get("pa") || "";
  } catch {
    const match = paymentUrl.match(/[?&]pa=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
}

function buildUpiPaymentUrl(upiId: string) {
  return `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=SalonName&am={{BillAmount}}&cu=INR`;
}

function rowsToSettings(rows: Array<{ key: string; value: string }>): AppSettings {
  const settings = { ...defaultAppSettings };

  rows.forEach((row) => {
    if (appSettingKeys.includes(row.key as keyof AppSettings)) {
      settings[row.key as keyof AppSettings] = row.value;
    }
  });

  if (!settings.upiId && settings.paymentUrl) {
    settings.upiId = extractUpiId(settings.paymentUrl);
  }

  return settings;
}

function validateSettingsPayload(body: any) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Settings payload is required");
  }

  const values: Record<string, string> = {};

  for (const key of appSettingKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      values[key] = optionalText(body[key], { max: maxLengths[key] });
    }
  }

  if (Object.prototype.hasOwnProperty.call(values, "upiId")) {
    values.upiId = values.upiId.trim();
    values.paymentUrl = buildUpiPaymentUrl(values.upiId);
  }

  return values;
}

export const settingsService = {
  async getSettings(user?: any) {
    const rows = await settingsRepository.findAll(requireSalonId(user));
    return rowsToSettings(rows);
  },

  async updateSettings(body: any, user?: any) {
    const salonId = requireSalonId(user);
    const values = validateSettingsPayload(body);
    await settingsRepository.upsertMany(values, salonId);
    return this.getSettings(user);
  },
};

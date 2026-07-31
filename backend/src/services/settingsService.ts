import { defaultAppSettings, appSettingKeys, type AppSettings } from "../config/appSettings";
import { badRequest } from "../lib/httpErrors";
import { optionalText } from "../lib/validation";
import { settingsRepository } from "../repositories/settingsRepository";

const maxLengths: Record<keyof AppSettings, number> = {
  paymentUrl: 1000,
  instagramUrl: 1000,
  googleReviewUrl: 1000,
  billMessageTemplate: 5000,
  billServiceLineTemplate: 500,
  billDiscountLineTemplate: 500,
};

function rowsToSettings(rows: Array<{ key: string; value: string }>): AppSettings {
  const settings = { ...defaultAppSettings };

  rows.forEach((row) => {
    if (appSettingKeys.includes(row.key as keyof AppSettings)) {
      settings[row.key as keyof AppSettings] = row.value;
    }
  });

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

  return values;
}

export const settingsService = {
  async getSettings() {
    const rows = await settingsRepository.findAll();
    return rowsToSettings(rows);
  },

  async updateSettings(body: any) {
    const values = validateSettingsPayload(body);
    await settingsRepository.upsertMany(values);
    return this.getSettings();
  },
};

import { badRequest } from "./httpErrors";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireText(value: unknown, fieldName: string, options: { max?: number } = {}) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw badRequest(`${fieldName} is required`);
  }

  if (options.max && text.length > options.max) {
    throw badRequest(`${fieldName} must be ${options.max} characters or less`);
  }

  return text;
}

export function optionalText(value: unknown, options: { max?: number } = {}) {
  const text = String(value ?? "").trim();

  if (options.max && text.length > options.max) {
    throw badRequest(`Text must be ${options.max} characters or less`);
  }

  return text;
}

export function requireUuid(value: unknown, fieldName = "id") {
  const text = String(value ?? "").trim();

  if (!uuidPattern.test(text)) {
    throw badRequest(`Invalid ${fieldName}`);
  }

  return text;
}

export function requireEmail(value: unknown) {
  const email = requireText(value, "Email", { max: 254 }).toLowerCase();

  if (!emailPattern.test(email)) {
    throw badRequest("Invalid email address");
  }

  return email;
}

export function requirePassword(value: unknown) {
  const password = String(value ?? "");

  if (!password) {
    throw badRequest("Password is required");
  }

  if (password.length < 6) {
    throw badRequest("Password must be at least 6 characters");
  }

  return password;
}

export function normalizePhone(value: unknown) {
  const phone = String(value ?? "").replace(/\D/g, "");

  if (!phone) {
    throw badRequest("Phone is required");
  }

  if (phone.length !== 10) {
    throw badRequest("Phone must be exactly 10 digits");
  }

  return phone;
}

export function optionalPhone(value: unknown) {
  const phone = String(value ?? "").replace(/\D/g, "");
  if (!phone) return null;

  if (phone.length !== 10) {
    throw badRequest("Phone must be exactly 10 digits");
  }

  return phone;
}

export function requireMoney(value: unknown, fieldName: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw badRequest(`${fieldName} must be a valid number`);
  }

  if (amount < 0) {
    throw badRequest(`${fieldName} cannot be negative`);
  }

  return amount;
}

export function optionalMoney(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return requireMoney(value, fieldName);
}

export function optionalDate(value: unknown, fieldName: string) {
  if (!value) return undefined;

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${fieldName} must be a valid date`);
  }

  return date;
}

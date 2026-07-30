export const PHONE_DIGITS = 10;

export function normalizePhoneInput(value) {
  return String(value || "").replace(/\D/g, "").slice(0, PHONE_DIGITS);
}

export function isValidPhone(value) {
  return normalizePhoneInput(value).length === PHONE_DIGITS;
}

export function isBlank(value) {
  return String(value || "").trim().length === 0;
}

export function parseMoney(value) {
  if (value === "" || value === null || value === undefined) return null;

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return amount;
}

export function isValidDate(value) {
  if (!value) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function clientValidationError({ name, phone }) {
  if (isBlank(name)) return "Name is required";
  if (!isValidPhone(phone)) return `Phone number must be exactly ${PHONE_DIGITS} digits`;
  return "";
}

export function duplicatePhoneError(phone, clients, ignoredClientId) {
  const normalizedPhone = normalizePhoneInput(phone);

  if (!isValidPhone(normalizedPhone)) return "";

  const duplicate = clients.some((client) => {
    const samePhone = normalizePhoneInput(client.phone) === normalizedPhone;
    const sameClient = ignoredClientId && client._id === ignoredClientId;
    return samePhone && !sameClient;
  });

  return duplicate ? "Client with this phone number already exists" : "";
}

export function serviceValidationError({ name, price }) {
  if (isBlank(name)) return "Service name is required";
  if (parseMoney(price) === null) return "Price must be a valid non-negative amount";
  return "";
}

export function expenseValidationError({ date, category, amount }) {
  if (!isValidDate(date)) return "Date is required";
  if (isBlank(category)) return "Category is required";
  if (parseMoney(amount) === null) return "Amount must be a valid non-negative amount";
  return "";
}

export function loginValidationError({ email, password }) {
  if (isBlank(email)) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return "Enter a valid email address";
  }
  if (!password) return "Password is required";
  return "";
}

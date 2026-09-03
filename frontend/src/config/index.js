function deriveDevelopmentApiBaseUrl() {
  const configuredDevHost = (process.env.REACT_APP_DEV_API_HOST || "").trim();
  const configuredDevPort = (process.env.REACT_APP_DEV_API_PORT || "").trim();
  const apiPort = configuredDevPort || "5000";

  if (typeof window === "undefined") {
    return `http://localhost:${apiPort}/api`;
  }

  const { hostname, protocol } = window.location;
  const host = configuredDevHost || hostname || "localhost";
  const apiProtocol = protocol === "https:" ? "https:" : "http:";

  return `${apiProtocol}//${host}:${apiPort}/api`;
}

function resolveApiBaseUrl() {
  const configured = (process.env.REACT_APP_API_BASE_URL || "").trim();
  const isAuto = !configured || configured.toLowerCase() === "auto";

  if (process.env.NODE_ENV === "development" && isAuto) {
    return deriveDevelopmentApiBaseUrl();
  }

  if (!configured || configured.toLowerCase() === "auto") {
    throw new Error("REACT_APP_API_BASE_URL is required outside development auto mode");
  }

  return configured;
}

const defaultBillConfig = {
  upiId: "",
  paymentUrl: "upi://pay?pa=&pn=SalonName&am={{BillAmount}}&cu=INR",
  instagramUrl: "https://instagram.com/your_salon",
  googleReviewUrl: "https://g.page/r/your-review-link",
  billMessageTemplate: [
    "Hi {{CustomerName}},",
    "",
    "Thank you for visiting our salon.",
    "",
    "Services:",
    "{{ServicesList}}",
    "",
    "Subtotal: ₹{{SubtotalAmount}}",
    "{{DiscountSection}}",
    "Total: ₹{{BillAmount}}",
    "",
    "Pay here: {{PaymentURL}}",
    "",
    "Follow us: {{InstagramURL}}",
    "Review us: {{GoogleReviewURL}}",
    "",
    "See you again soon.",
  ].join("\n"),
  billServiceLineTemplate: "{{Index}}. {{ServiceName}} - ₹{{ServiceAmount}}",
  billDiscountLineTemplate: "Discount: {{DiscountPercent}}% (-₹{{DiscountAmount}})",
};

export const appConfig = {
  env: process.env.NODE_ENV || "development",
  apiBaseUrl: resolveApiBaseUrl(),
  upiId: (process.env.REACT_APP_UPI_ID || defaultBillConfig.upiId).trim(),
  paymentUrl: (process.env.REACT_APP_PAYMENT_URL || defaultBillConfig.paymentUrl).trim(),
  googleReviewUrl: (process.env.REACT_APP_GOOGLE_REVIEW_URL || defaultBillConfig.googleReviewUrl).trim(),
  instagramUrl: (process.env.REACT_APP_INSTAGRAM_URL || defaultBillConfig.instagramUrl).trim(),
  billMessageTemplate: (process.env.REACT_APP_BILL_MESSAGE_TEMPLATE || defaultBillConfig.billMessageTemplate).replace(/\\n/g, "\n").trim(),
  billServiceLineTemplate: (process.env.REACT_APP_BILL_SERVICE_LINE_TEMPLATE || defaultBillConfig.billServiceLineTemplate).replace(/\\n/g, "\n").trim(),
  billDiscountLineTemplate: (process.env.REACT_APP_BILL_DISCOUNT_LINE_TEMPLATE || defaultBillConfig.billDiscountLineTemplate).replace(/\\n/g, "\n").trim(),
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

export default appConfig;

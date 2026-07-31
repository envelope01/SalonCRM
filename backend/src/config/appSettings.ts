export const defaultAppSettings = {
  paymentUrl: "upi://pay?pa=9082355838@kotak&pn=SalonName&am={{BillAmount}}&cu=INR",
  instagramUrl: "https://instagram.com/your_salon",
  googleReviewUrl: "https://g.page/r/your-review-link",
  billMessageTemplate: [
    "Hi *{{CustomerName}}*! 😊",
    "",
    "Thank you for visiting our salon! ❤️",
    "",
    "🧾 *Services Taken:*",
    "{{ServicesList}}",
    "",
    "💰 *Subtotal:* ₹{{SubtotalAmount}}",
    "{{DiscountSection}}",
    "🧾 *Your Bill Amount:* ₹{{BillAmount}}",
    "",
    "We're grateful for your visit and look forward to serving you again.",
    "",
    "💳 *Click here to pay:*",
    "{{PaymentURL}}",
    "",
    "📸 *Follow us on Instagram:*",
    "{{InstagramURL}}",
    "",
    "⭐ *Loved your experience? Please leave us a Google Review:*",
    "{{GoogleReviewURL}}",
    "",
    "Your feedback means a lot to us and helps us serve you even better. Thank you for your support! 🙏",
  ].join("\n"),
  billServiceLineTemplate: "{{Index}}. {{ServiceName}} - ₹{{ServiceAmount}}",
  billDiscountLineTemplate: "🎉 *You Saved:* ₹{{DiscountAmount}} ({{DiscountPercent}}% discount)",
};

export type AppSettings = typeof defaultAppSettings;
export type AppSettingKey = keyof AppSettings;

export const appSettingKeys = Object.keys(defaultAppSettings) as AppSettingKey[];

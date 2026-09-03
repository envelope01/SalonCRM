export const defaultAppSettings = {
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

export type AppSettings = typeof defaultAppSettings;
export type AppSettingKey = keyof AppSettings;

export const appSettingKeys = Object.keys(defaultAppSettings) as AppSettingKey[];

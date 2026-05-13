export const APP_NAME = "Limoura Creative Studio";
export const APP_SUBTITLE = "Financial Tracking & Analytics";

export const CURRENCY = {
  code: "USD",
  symbol: "$",
  locale: "en-US",
} as const;

export const SERVICE_TYPES = [
  "Amazon Listing Images",
  "A+ Content",
  "Storefront Design",
  "Product Infographics",
  "Video Editing",
  "Branding Assets",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Freelancer Payments",
  "Software Subscriptions",
  "AI Tools",
  "Internet & Utilities",
  "Rent",
  "Marketing",
  "Equipment",
  "Office Expenses",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_STATUSES = ["PAID", "PARTIAL", "PENDING", "OVERDUE"] as const;
export type PaymentStatusType = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "PayPal",
  "Wise",
  "Card",
  "Cash",
  "Other",
] as const;

// Chart palette — restrained, monochrome-leaning, with accent green/clay
export const CHART_COLORS = [
  "#1F3D2B", // accent — primary
  "#737373", // neutral 500
  "#A3A3A3", // neutral 400
  "#9B3A2E", // muted clay
  "#8A6D3B", // muted ochre
  "#355F44", // accent 500
  "#D4D4D4", // neutral 300
] as const;

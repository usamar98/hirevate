export type DefaultLeverSource = {
  companyName: string;
  industry: string;
  slug: string;
};

// Employer-owned public Lever boards with dependable Australian or UAE vacancies.
// The sync keeps every public role from each board, and country pages filter the
// normalized location at read time.
export const defaultLeverSources = [
  { companyName: "MYOB", industry: "Accounting software", slug: "myob-2" },
  { companyName: "Deputy", industry: "Workforce management", slug: "deputy" },
  { companyName: "Blinq", industry: "Business software", slug: "blinq" },
  { companyName: "Objective Corporation", industry: "Enterprise software", slug: "objective" },
  { companyName: "RecordPoint", industry: "Information governance", slug: "recordpoint" },
  { companyName: "ServiceRocket", industry: "Technology services", slug: "servicerocket" },
  { companyName: "ShopBack", industry: "Commerce", slug: "shopback-2" },
  { companyName: "Xsolla", industry: "Payments and gaming", slug: "xsolla" },
  { companyName: "Palantir", industry: "Enterprise software", slug: "palantir" },
  { companyName: "Yassir", industry: "Mobility and financial services", slug: "Yassir" },
  { companyName: "Extreme Networks", industry: "Networking", slug: "extremenetworks" }
] as const satisfies readonly DefaultLeverSource[];

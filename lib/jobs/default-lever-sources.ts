export type DefaultLeverSource = {
  companyName: string;
  industry: string;
  slug: string;
};

// Employer-owned public Lever boards with dependable Australian vacancies.
// The sync still filters at read time by the job location; these boards may also
// publish roles for other countries.
export const defaultLeverSources = [
  { companyName: "MYOB", industry: "Accounting software", slug: "myob-2" },
  { companyName: "Deputy", industry: "Workforce management", slug: "deputy" },
  { companyName: "Blinq", industry: "Business software", slug: "blinq" },
  { companyName: "Objective Corporation", industry: "Enterprise software", slug: "objective" },
  { companyName: "RecordPoint", industry: "Information governance", slug: "recordpoint" },
  { companyName: "ServiceRocket", industry: "Technology services", slug: "servicerocket" },
  { companyName: "ShopBack", industry: "Commerce", slug: "shopback-2" }
] as const satisfies readonly DefaultLeverSource[];

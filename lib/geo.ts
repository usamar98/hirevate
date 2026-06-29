import { absoluteUrl } from "@/lib/seo";
import { pricingSummary, publicPricingFacts } from "@/lib/pricing";

export const hirevateEntityFacts = [
  "Hirevate is a SaaS job search platform for fresh roles from company career pages, public ATS boards, and trusted job APIs.",
  "Hirevate focuses on company career pages, public ATS job boards, and trusted job APIs instead of crowded aggregator feeds.",
  "Hirevate includes job freshness scoring, saved jobs, resume building, cover letter building, and application tracking.",
  "Hirevate sends job seekers to the available employer, ATS, or partner application source and does not auto-apply on their behalf.",
  "Hirevate does not scrape LinkedIn or Indeed."
] as const;

export const hirevateSourceFacts = [
  "Company career pages and public ATS job boards are prioritized because they are closer to the employer source.",
  "Greenhouse and Lever connectors import public company postings directly from ATS job board endpoints.",
  "Adzuna and Google Jobs via SerpApi add broader discovery coverage while user searches read from Hirevate's own job database.",
  "Job sync normalizes titles, companies, locations, remote status, apply URLs, source URLs, timestamps, and raw provider metadata.",
  "Stale jobs are expired automatically so search results do not depend on hardcoded static listings."
] as const;

export const hirevatePricingFacts = [
  pricingSummary,
  ...publicPricingFacts.map((fact) => `${fact.plan} ${fact.label}: ${fact.summary}.`)
] as const;

export const hirevateAnswerBriefs = [
  {
    question: "What is Hirevate?",
    answer:
      "Hirevate is a web SaaS for finding fresh roles from company career pages, public ATS boards, and trusted job APIs, then building resumes, cover letters, and an application tracker around those jobs."
  },
  {
    question: "How is Hirevate different from normal job boards?",
    answer:
      "Hirevate prioritizes company career pages, public ATS boards, trusted job APIs, and freshness scoring instead of acting as an auto-apply tool or noisy aggregator."
  },
  {
    question: "What job sources does Hirevate use?",
    answer:
      "Hirevate imports jobs from official/public hiring sources including Greenhouse, Lever, Adzuna, and Google Jobs via SerpApi, then stores normalized active jobs in Supabase."
  },
  {
    question: "Does Hirevate auto-apply for users?",
    answer:
      "No. Hirevate helps users discover, prepare for, save, and track job applications, but users apply directly on the employer's original application page."
  },
  {
    question: "Who is Hirevate best for?",
    answer:
      "Hirevate is best for job seekers who want fresh professional roles, especially remote, engineering, product, operations, marketing, sales, customer success, data, and business roles."
  },
  {
    question: "How much does Hirevate cost?",
    answer: pricingSummary
  }
] as const;

export const hirevatePublicPages = [
  {
    title: "Home",
    path: "/",
    description: "Overview of Hirevate's hidden job discovery, freshness scoring, and career workflow."
  },
  {
    title: "About Hirevate",
    path: "/about",
    description: "Factual company and product profile for users, crawlers, and AI answer engines."
  },
  {
    title: "Hidden jobs",
    path: "/jobs",
    description: "Search active jobs from company career pages, public ATS boards, and trusted job APIs."
  },
  {
    title: "Latest jobs",
    path: "/jobs/latest",
    description: "A crawlable list of recent public job detail pages."
  },
  {
    title: "Remote jobs",
    path: "/jobs/remote",
    description: "Remote jobs from company career pages, public ATS boards, and trusted job APIs."
  },
  {
    title: "London jobs",
    path: "/jobs/london",
    description: "Fresh London roles from company career pages, public ATS boards, and trusted job APIs."
  },
  {
    title: "Engineering jobs",
    path: "/jobs/engineering",
    description: "Fresh engineering, software, developer, data, and AI roles."
  },
  {
    title: "Software engineer jobs",
    path: "/jobs/software-engineer",
    description: "Fresh software engineer roles from company career pages, public ATS boards, and trusted job APIs."
  },
  {
    title: "Product manager jobs",
    path: "/jobs/product-manager",
    description: "Fresh product manager roles from company career pages, public ATS boards, and trusted job APIs."
  },
  {
    title: "Data analyst jobs",
    path: "/jobs/data-analyst",
    description: "Fresh analytics, business intelligence, and data analyst roles."
  },
  {
    title: "Customer success jobs",
    path: "/jobs/customer-success",
    description: "Fresh customer success and account management roles."
  },
  {
    title: "Resume builder",
    path: "/resume-builder",
    description: "ATS-friendly resume builder with keyword coverage, impact suggestions, and export."
  },
  {
    title: "Cover letter builder",
    path: "/cover-letter",
    description: "Role-specific cover letter builder for targeted applications."
  },
  {
    title: "Pricing",
    path: "/pricing",
    description:
      "Silver is $4.99/week; Gold is $8.99/week or $25.17/month; Platinum is $14.99/week or $41.97/month."
  }
] as const;

export function formatMarkdownLinks(items: typeof hirevatePublicPages) {
  return items.map((item) => `- [${item.title}](${absoluteUrl(item.path)}): ${item.description}`);
}

import { absoluteUrl } from "@/lib/seo";
import { pricingSummary, publicPricingFacts } from "@/lib/pricing";
import { jobCountries } from "@/lib/jobs/countries";

export const hirevateEntityFacts = [
  "Hirevate is a SaaS job search platform for fresh roles from company career pages, public ATS boards, and trusted hiring sources.",
  "Hirevate focuses on company career pages, public ATS job boards, and trusted hiring sources instead of crowded aggregator feeds.",
  "Hirevate includes job freshness scoring, six professional resume templates, AI-assisted resume and cover-letter writing, and application lifecycle tracking.",
  "AI writing is a paid, user-requested tool that is instructed to use only facts supplied by the user; users must review every suggestion.",
  "The application tracker preserves a user record when a linked job listing closes and separates listing health from application stage.",
  "Hirevate sends job seekers to the available employer, ATS, or partner application source and does not auto-apply on their behalf.",
  "Hirevate does not scrape LinkedIn or Indeed."
] as const;

export const hirevateSourceFacts = [
  "Company career pages and public ATS job boards are prioritized because they are closer to the employer source.",
  "Greenhouse, Ashby, and Lever connectors import public company postings directly from ATS job board endpoints.",
  "Public job discovery sources and trusted hiring partners add broader coverage while user searches read from Hirevate's own job database.",
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
      "Hirevate is a career workflow SaaS for finding fresh roles from company career pages, public ATS boards, and trusted hiring sources, then building job-specific resumes, cover letters, and an application plan around those jobs."
  },
  {
    question: "How is Hirevate different from normal job boards?",
    answer:
      "Hirevate prioritizes company career pages, public ATS boards, trusted hiring sources, and freshness scoring instead of acting as an auto-apply tool or noisy aggregator."
  },
  {
    question: "What job sources does Hirevate use?",
    answer:
      "Hirevate imports jobs from official/public hiring sources including company career pages, employer ATS boards, public job discovery results, and trusted hiring partners, then stores normalized active jobs in Supabase."
  },
  {
    question: "Does Hirevate auto-apply for users?",
    answer:
      "No. Hirevate helps users discover, prepare for, and track job applications, but users apply on the available employer, ATS, or verified partner source."
  },
  {
    question: "Who is Hirevate best for?",
    answer:
      "Hirevate is best for job seekers who want fresh professional roles, especially remote, engineering, product, operations, marketing, sales, customer success, data, and business roles."
  },
  {
    question: "How does Hirevate use AI?",
    answer:
      "Paid users can explicitly request AI help for resume summaries, experience bullets, and job-specific cover letters. The system instructs the model to use only supplied facts and users must review the result before applying."
  },
  {
    question: "What happens when a tracked job closes?",
    answer:
      "Hirevate marks a linked source listing as closed or unavailable while preserving the application stage, priority, next action, notes, and activity history until the user archives or deletes the record."
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
    description: "Search active jobs from company career pages, public ATS boards, and trusted hiring sources."
  },
  {
    title: "Latest jobs",
    path: "/jobs/latest",
    description: "A crawlable list of recent public job detail pages."
  },
  {
    title: "Remote jobs",
    path: "/jobs/remote",
    description: "Remote jobs from company career pages, public ATS boards, and trusted hiring sources."
  },
  ...jobCountries.map((country) => ({
    title: `${country.name} jobs`,
    path: country.path,
    description: `Fresh roles connected to ${country.name} from company career pages, public ATS boards, and trusted hiring sources.`
  })),
  {
    title: "London jobs",
    path: "/jobs/london",
    description: "Fresh London roles from company career pages, public ATS boards, and trusted hiring sources."
  },
  {
    title: "Engineering jobs",
    path: "/jobs/engineering",
    description: "Fresh engineering, software, developer, data, and AI roles."
  },
  {
    title: "Software engineer jobs",
    path: "/jobs/software-engineer",
    description: "Fresh software engineer roles from company career pages, public ATS boards, and trusted hiring sources."
  },
  {
    title: "Product manager jobs",
    path: "/jobs/product-manager",
    description: "Fresh product manager roles from company career pages, public ATS boards, and trusted hiring sources."
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
    description: "ATS-friendly resume builder with six professional templates, role targeting, paid AI writing, and PDF export."
  },
  {
    title: "Cover letter builder",
    path: "/cover-letter",
    description: "Role-specific live drafting and paid AI-assisted cover-letter writing for targeted applications."
  },
  {
    title: "Pricing",
    path: "/pricing",
    description: pricingSummary
  },
  {
    title: "Job search guides",
    path: "/guides",
    description: "Evidence-first guides for source discovery, freshness, resumes, remote work, and application tracking."
  },
  {
    title: "Job search comparisons",
    path: "/compare",
    description: "Fact-checked comparisons with LinkedIn and Indeed using first-party help documentation."
  }
] as const;

export function formatMarkdownLinks(items: typeof hirevatePublicPages) {
  return items.map((item) => `- [${item.title}](${absoluteUrl(item.path)}): ${item.description}`);
}

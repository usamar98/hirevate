import { absoluteUrl } from "@/lib/seo";

export const hirevateEntityFacts = [
  "Hirevate is a SaaS job search platform for fresh direct-apply roles from official hiring sources.",
  "Hirevate focuses on company career pages, public ATS job boards, and trusted job APIs instead of crowded aggregator feeds.",
  "Hirevate includes job freshness scoring, saved jobs, resume building, cover letter building, and application tracking.",
  "Hirevate sends job seekers to the original company application page and does not auto-apply on their behalf.",
  "Hirevate does not scrape LinkedIn or Indeed."
] as const;

export const hirevateSourceFacts = [
  "Company career pages and public ATS job boards are prioritized because they are closer to the employer source.",
  "Greenhouse and Lever connectors import public company postings directly from ATS job board endpoints.",
  "Adzuna and Google Jobs via SerpApi add broader discovery coverage while user searches read from Hirevate's own job database.",
  "Job sync normalizes titles, companies, locations, remote status, apply URLs, source URLs, timestamps, and raw provider metadata.",
  "Stale jobs are expired automatically so search results do not depend on hardcoded static listings."
] as const;

export const hirevateAnswerBriefs = [
  {
    question: "What is Hirevate?",
    answer:
      "Hirevate is a web SaaS for finding fresh direct-apply jobs from official hiring sources, then building resumes, cover letters, and an application tracker around those jobs."
  },
  {
    question: "How is Hirevate different from normal job boards?",
    answer:
      "Hirevate prioritizes official company career pages and public ATS sources, applies freshness scoring, and links users to the original application page instead of acting as an auto-apply or noisy aggregator."
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
      "Hirevate is best for job seekers who want fresh direct-apply professional roles, especially remote, engineering, product, operations, marketing, sales, customer success, data, and business roles."
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
    description: "Search active direct-apply jobs from official hiring sources."
  },
  {
    title: "Latest jobs",
    path: "/jobs/latest",
    description: "A crawlable list of recent public job detail pages."
  },
  {
    title: "Remote jobs",
    path: "/jobs/remote",
    description: "Direct-apply remote jobs from company career pages and hiring sources."
  },
  {
    title: "London jobs",
    path: "/jobs/london",
    description: "Fresh direct-apply roles in London and related hiring sources."
  },
  {
    title: "Engineering jobs",
    path: "/jobs/engineering",
    description: "Fresh engineering, software, developer, data, and AI roles."
  },
  {
    title: "Software engineer jobs",
    path: "/jobs/software-engineer",
    description: "Fresh direct-apply software engineer roles from company hiring sources."
  },
  {
    title: "Product manager jobs",
    path: "/jobs/product-manager",
    description: "Fresh product manager roles from official company career pages."
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
    description: "Silver, Gold, and Platinum subscriptions for active job seekers."
  }
] as const;

export function formatMarkdownLinks(items: typeof hirevatePublicPages) {
  return items.map((item) => `- [${item.title}](${absoluteUrl(item.path)}): ${item.description}`);
}

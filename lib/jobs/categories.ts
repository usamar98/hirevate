export type JobCategorySlug =
  | "remote"
  | "london"
  | "engineering"
  | "software-engineer"
  | "product-manager"
  | "data-analyst"
  | "customer-success";

export type JobCategoryPage = {
  slug: JobCategorySlug;
  path: string;
  label: string;
  title: string;
  description: string;
  heading: string;
  eyebrow: string;
  emptyTitle: string;
  emptyDescription: string;
  answerReady: {
    bestSources: string;
    faqs: Array<{
      answer: string;
      question: string;
    }>;
    freshness: string;
    helpsWith: string;
  };
  keywords?: string[];
};

export const jobCategoryPages: Record<JobCategorySlug, JobCategoryPage> = {
  remote: {
    slug: "remote",
    path: "/jobs/remote",
    label: "Remote jobs",
    title: "Remote Jobs | Hirevate",
    description:
      "Find fresh remote jobs from company career pages, public ATS boards, and trusted hiring sources before crowded job boards catch up.",
    heading: "Remote jobs from public hiring sources",
    eyebrow: "Remote job search",
    emptyTitle: "No remote jobs found",
    emptyDescription:
      "Run a fresh job sync or browse all hidden jobs while new remote listings are collected.",
    answerReady: {
      helpsWith:
        "This page helps remote-first job seekers find fresh roles with clear source labels, work-mode signals, and links to the available employer, ATS, or partner apply source.",
      bestSources:
        "The strongest remote coverage usually comes from employer ATS boards, company career pages, public job discovery results, and trusted hiring partners.",
      freshness:
        "Remote freshness score favors recently updated roles with a usable apply URL, clear remote location text, and complete source metadata.",
      faqs: [
        {
          question: "What does the remote jobs page help with?",
          answer:
            "It helps users find remote roles from public hiring sources without depending only on crowded generic job boards."
        },
        {
          question: "Which sources are best for remote jobs?",
          answer:
            "Employer ATS boards, company career pages, public job discovery results, and hiring partners are useful because remote roles often appear on several public hiring surfaces."
        },
        {
          question: "How is freshness scored for remote jobs?",
          answer:
            "Freshness uses recency, apply URL presence, remote/location quality, and role relevance signals."
        },
        {
          question: "Does Hirevate auto-apply to remote jobs?",
          answer:
            "No. Hirevate shows the available apply source and users apply themselves."
        },
        {
          question: "Can I use the resume and cover letter tools for remote jobs?",
          answer:
            "Yes. Users can pair remote job pages with the resume builder, cover letter builder, and job tracker."
        }
      ]
    }
  },
  london: {
    slug: "london",
    path: "/jobs/london",
    label: "London jobs",
    title: "London Jobs | Hirevate",
    description:
      "Find fresh London jobs from company career pages, public ATS boards, and trusted hiring sources, with clear source and freshness signals.",
    heading: "London jobs with clear apply sources",
    eyebrow: "London job search",
    emptyTitle: "No London jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more roles from London hiring sources.",
    answerReady: {
      helpsWith:
        "This page helps job seekers monitor London-based roles across company career pages, public ATS boards, and trusted hiring sources.",
      bestSources:
        "London coverage is strongest when employer ATS boards, company career pages, public job discovery results, and hiring partners all contribute location-tagged roles.",
      freshness:
        "London freshness score favors roles with recent updates, clear London or UK location text, valid apply links, and strong title relevance.",
      faqs: [
        {
          question: "What does the London jobs page help with?",
          answer:
            "It helps users find London roles from public hiring sources while keeping source and freshness signals visible."
        },
        {
          question: "Which sources are best for London jobs?",
          answer:
            "Company career pages, employer ATS boards, public job discovery results, and hiring partners can all contribute useful London listings."
        },
        {
          question: "How is freshness scored for London jobs?",
          answer:
            "Freshness rewards recent source updates, complete London location data, apply URL presence, and role relevance."
        },
        {
          question: "Are London remote or hybrid roles included?",
          answer:
            "Yes, if the source marks the role as remote, hybrid, or includes those terms in the title or location."
        },
        {
          question: "Does Hirevate apply to London jobs for me?",
          answer:
            "No. Hirevate surfaces the source and users apply on the available employer, ATS, or partner page."
        }
      ]
    }
  },
  engineering: {
    slug: "engineering",
    path: "/jobs/engineering",
    label: "Engineering jobs",
    title: "Engineering Jobs | Hirevate",
    description:
      "Find fresh engineering, software, and developer jobs from company career pages, public ATS boards, and trusted hiring sources before they get crowded.",
    heading: "Engineering jobs before they get crowded",
    eyebrow: "Engineering job search",
    emptyTitle: "No engineering jobs found",
    emptyDescription:
      "Try a broader jobs search or run a fresh sync to import more engineering roles.",
    answerReady: {
      helpsWith:
        "This page helps engineers scan fresh software, developer, data, infrastructure, and AI roles from public hiring sources.",
      bestSources:
        "Engineering roles are often strongest on employer ATS boards, company career pages, and public job discovery results.",
      freshness:
        "Engineering freshness score rewards recent updates, apply link quality, location completeness, and engineering title relevance.",
      faqs: [
        {
          question: "What engineering jobs does this page include?",
          answer:
            "It can include software engineering, developer, data, infrastructure, platform, AI, and related technical roles."
        },
        {
          question: "Which sources are best for engineering jobs?",
          answer:
            "Employer ATS boards, company career pages, and public job discovery results are useful because many technical teams publish there first."
        },
        {
          question: "How is freshness scored for engineering jobs?",
          answer:
            "Freshness uses recent source updates, apply URL presence, location quality, and technical role keywords."
        },
        {
          question: "Can I target my resume to engineering roles?",
          answer:
            "Yes. The resume builder can be used with engineering keywords and role-specific experience bullets."
        },
        {
          question: "Does Hirevate scrape LinkedIn or Indeed for engineering jobs?",
          answer:
            "No. Hirevate uses company career pages, public ATS boards, and trusted hiring sources."
        }
      ]
    }
  },
  "software-engineer": {
    slug: "software-engineer",
    path: "/jobs/software-engineer",
    label: "Software engineer jobs",
    title: "Software Engineer Jobs | Hirevate",
    description:
      "Find fresh software engineer jobs from company career pages, public ATS boards, and trusted hiring sources with clear source and freshness signals.",
    heading: "Software engineer jobs from public hiring sources",
    eyebrow: "Software engineering job search",
    emptyTitle: "No software engineer jobs found",
    emptyDescription:
      "Try engineering jobs or run a fresh sync to import more software engineering roles.",
    answerReady: {
      helpsWith:
        "This page helps software engineers find frontend, backend, full stack, platform, and related developer roles with clear source labels.",
      bestSources:
        "Software engineer roles are especially common on employer ATS boards, company career pages, and public job discovery results.",
      freshness:
        "Software engineer freshness score rewards recent updates, valid apply URLs, clear remote or location data, and software-related title matches.",
      faqs: [
        {
          question: "What does this software engineer jobs page include?",
          answer:
            "It includes roles matching software engineer, software developer, frontend, backend, full stack, and similar terms."
        },
        {
          question: "Which sources are best for software engineer jobs?",
          answer:
            "Employer ATS boards, employer career pages, and public job discovery results are strong sources for software engineering listings."
        },
        {
          question: "How is freshness scored for software engineer jobs?",
          answer:
            "Freshness considers recent updates, apply link availability, source quality, location detail, and software keyword relevance."
        },
        {
          question: "Can I create a software engineer resume in Hirevate?",
          answer:
            "Yes. The resume builder supports role targeting, keyword coverage, and impact-focused software engineering bullets."
        },
        {
          question: "Does Hirevate auto-apply to software engineer jobs?",
          answer:
            "No. Users review the source and apply themselves."
        }
      ]
    },
    keywords: ["software engineer", "software developer", "frontend", "backend", "full stack"]
  },
  "product-manager": {
    slug: "product-manager",
    path: "/jobs/product-manager",
    label: "Product manager jobs",
    title: "Product Manager Jobs | Hirevate",
    description:
      "Find fresh product manager jobs from company career pages, public ATS boards, and trusted hiring sources.",
    heading: "Product manager jobs before they get crowded",
    eyebrow: "Product job search",
    emptyTitle: "No product manager jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more product roles.",
    answerReady: {
      helpsWith:
        "This page helps product managers find PM, product owner, product lead, and group product manager roles from public hiring sources.",
      bestSources:
        "Product roles are commonly surfaced through employer ATS boards, company career pages, public job discovery results, and hiring partners.",
      freshness:
        "Product manager freshness score rewards recent source updates, complete company and location data, valid apply links, and product title relevance.",
      faqs: [
        {
          question: "What does the product manager jobs page help with?",
          answer:
            "It helps users find fresh PM roles without relying only on broad job-board searches."
        },
        {
          question: "Which sources are best for product manager jobs?",
          answer:
            "Company career pages, employer ATS boards, public job discovery results, and hiring partners can all surface product roles."
        },
        {
          question: "How is freshness scored for product manager jobs?",
          answer:
            "Freshness uses recency, apply URL presence, location quality, and product-title relevance."
        },
        {
          question: "Can I write a product manager cover letter in Hirevate?",
          answer:
            "Yes. The cover letter builder can target a company, product role, proof points, and keywords."
        },
        {
          question: "Does Hirevate claim product jobs are exclusive?",
          answer:
            "No. Hirevate surfaces public roles from cleaner sources and does not claim exclusivity unless a cited page says so."
        }
      ]
    },
    keywords: ["product manager", "product owner", "product lead", "group product manager"]
  },
  "data-analyst": {
    slug: "data-analyst",
    path: "/jobs/data-analyst",
    label: "Data analyst jobs",
    title: "Data Analyst Jobs | Hirevate",
    description:
      "Find fresh data analyst, analytics, and business intelligence jobs from company career pages, public ATS boards, and trusted hiring sources.",
    heading: "Data analyst jobs with clear apply sources",
    eyebrow: "Data job search",
    emptyTitle: "No data analyst jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more data and analytics roles.",
    answerReady: {
      helpsWith:
        "This page helps analysts find analytics, BI, data analyst, and related roles from public hiring sources with freshness signals.",
      bestSources:
        "Data analyst roles can appear across company career pages, employer ATS boards, public job discovery results, and hiring partners.",
      freshness:
        "Data analyst freshness score rewards recent updates, apply URL availability, location completeness, and data or analytics keyword relevance.",
      faqs: [
        {
          question: "What jobs are included on the data analyst page?",
          answer:
            "It can include data analyst, analytics, business intelligence, reporting, and related data roles."
        },
        {
          question: "Which sources are best for data analyst jobs?",
          answer:
            "Company career pages, employer ATS boards, public job discovery results, and hiring partners provide useful coverage."
        },
        {
          question: "How is freshness scored for data analyst jobs?",
          answer:
            "Freshness uses recency, apply link quality, source metadata, location detail, and data-related title matches."
        },
        {
          question: "Can I target my resume to data analyst jobs?",
          answer:
            "Yes. The resume builder can help align skills, tools, metrics, and keywords to a target data role."
        },
        {
          question: "Does Hirevate auto-apply to data analyst jobs?",
          answer:
            "No. Hirevate helps users prepare and track applications, but users submit applications themselves."
        }
      ]
    },
    keywords: ["data analyst", "analytics", "business intelligence", "data scientist"]
  },
  "customer-success": {
    slug: "customer-success",
    path: "/jobs/customer-success",
    label: "Customer success jobs",
    title: "Customer Success Jobs | Hirevate",
    description:
      "Find fresh customer success and account management jobs from company career pages, public ATS boards, and trusted hiring sources.",
    heading: "Customer success jobs from public hiring sources",
    eyebrow: "Customer success job search",
    emptyTitle: "No customer success jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more customer-facing roles.",
    answerReady: {
      helpsWith:
        "This page helps customer-facing candidates find customer success, account management, implementation, and support roles.",
      bestSources:
        "Customer success roles often appear on company career pages, employer ATS boards, public job discovery results, and hiring partners.",
      freshness:
        "Customer success freshness score rewards recent updates, valid apply links, location completeness, and customer-facing title relevance.",
      faqs: [
        {
          question: "What roles are included on the customer success page?",
          answer:
            "It can include customer success manager, account manager, implementation manager, and customer support roles."
        },
        {
          question: "Which sources are best for customer success jobs?",
          answer:
            "Company career pages, employer ATS boards, public job discovery results, and hiring partners provide broad customer-facing role coverage."
        },
        {
          question: "How is freshness scored for customer success jobs?",
          answer:
            "Freshness uses recent source updates, apply URL presence, location quality, and customer-facing title relevance."
        },
        {
          question: "Can I write a customer success cover letter in Hirevate?",
          answer:
            "Yes. The cover letter builder can focus on customer outcomes, retention, onboarding, and proof points."
        },
        {
          question: "Does Hirevate apply to customer success jobs automatically?",
          answer:
            "No. Hirevate does not auto-apply; users apply on the available source."
        }
      ]
    },
    keywords: ["customer success", "account manager", "implementation manager", "customer support"]
  }
};

export const jobCategoryList = Object.values(jobCategoryPages);

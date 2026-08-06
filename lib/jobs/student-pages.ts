import type { StudentJobAudience, StudentJobCountry } from "@/lib/jobs/student-part-time";

export type StudentJobsPageConfig = {
  audience: StudentJobAudience;
  country: StudentJobCountry | null;
  path: string;
  label: string;
  title: string;
  description: string;
  heading: string;
  eyebrow: string;
  intro: string;
  officialGuidance?: {
    href: string;
    label: string;
    summary: string;
  };
  faqs: Array<{ question: string; answer: string }>;
};

const sharedPartTimeFaqs = [
  {
    question: "How does Hirevate identify part-time jobs?",
    answer:
      "Hirevate looks for explicit part-time, weekly-hours, evening, weekend, seasonal, and temporary signals in the original public listing. A badge describes the evidence found."
  },
  {
    question: "Does a student badge mean I am legally allowed to take the job?",
    answer:
      "No. Badges summarize wording in the listing and do not determine immigration or work eligibility. Confirm the role with the employer and your university or immigration adviser."
  },
  {
    question: "How fresh are these jobs?",
    answer:
      "Hirevate refreshes supported sources daily and automatically removes jobs that have not been verified within ten days."
  },
  {
    question: "Where do the listings come from?",
    answer:
      "Listings come from public employer career pages, public ATS job boards, Adzuna discovery results, and trusted hiring sources. Hirevate links back to the available original application source."
  }
];

const usGuidance = {
  href: "https://www.ice.gov/sevis/employment",
  label: "Official US ICE/SEVP employment guidance",
  summary:
    "F-1 employment rules depend on the work type and authorization. On-campus work and authorized practical training are distinct categories, so confirm every opportunity with your DSO."
};

const ukGuidance = {
  href: "https://www.gov.uk/student-visa",
  label: "Official UK Student visa guidance",
  summary:
    "Permitted work depends on your visa conditions, course and whether it is term time. Check your eVisa or decision details and official guidance before accepting hours."
};

export const studentJobsPages = {
  partTime: {
    audience: "part-time",
    country: null,
    path: "/jobs/part-time",
    label: "Part-time jobs",
    title: "Fresh Part-Time Jobs in the US & UK | Hirevate",
    description:
      "Find fresh part-time jobs in the US and UK with weekly-hours, evening, weekend, student and work-authorization evidence from original public listings.",
    heading: "Fresh part-time jobs with schedule evidence",
    eyebrow: "US and UK part-time jobs",
    intro:
      "Compare recently verified roles across supported US and UK sources. Evidence badges show what the employer actually stated, so you can screen opportunities faster without treating a listing as immigration advice.",
    faqs: sharedPartTimeFaqs
  },
  partTimeUs: {
    audience: "part-time",
    country: "us",
    path: "/jobs/part-time/us",
    label: "Part-time jobs in the US",
    title: "Part-Time Jobs in the US for Students | Hirevate",
    description:
      "Find fresh US part-time jobs with on-campus, hours, schedule, CPT/OPT and work-authorization evidence taken from original public listings.",
    heading: "Part-time jobs in the US for students and newcomers",
    eyebrow: "United States",
    intro:
      "Review recently verified US roles and use the evidence badges to distinguish on-campus wording, student mentions, weekly hours and employer authorization requirements.",
    officialGuidance: usGuidance,
    faqs: sharedPartTimeFaqs
  },
  partTimeUk: {
    audience: "part-time",
    country: "uk",
    path: "/jobs/part-time/uk",
    label: "Part-time jobs in the UK",
    title: "Part-Time Jobs in the UK for International Students | Hirevate",
    description:
      "Find fresh UK part-time jobs with weekly-hours, evening, weekend, student and work-authorization evidence from original public listings.",
    heading: "Part-time jobs in the UK for international students",
    eyebrow: "United Kingdom",
    intro:
      "Review recently verified UK roles and compare schedule evidence against the work conditions shown on your own visa record. Hirevate never assumes a universal hours limit.",
    officialGuidance: ukGuidance,
    faqs: sharedPartTimeFaqs
  },
  studentUs: {
    audience: "student",
    country: "us",
    path: "/jobs/student/us",
    label: "Student jobs in the US",
    title: "Student Jobs in the US: Campus, Part-Time & Internships | Hirevate",
    description:
      "Discover fresh US student jobs, internships and on-campus opportunities with CPT/OPT and authorization wording clearly labeled when present.",
    heading: "Student jobs, campus roles and internships in the US",
    eyebrow: "US student job search",
    intro:
      "Find roles whose public listing mentions students, internships, campus work or part-time schedules. Confirm any F-1 employment category and authorization with your DSO before applying or accepting work.",
    officialGuidance: usGuidance,
    faqs: sharedPartTimeFaqs
  },
  studentUk: {
    audience: "student",
    country: "uk",
    path: "/jobs/student/uk",
    label: "Student jobs in the UK",
    title: "Student Jobs in the UK: Part-Time, Weekend & Internships | Hirevate",
    description:
      "Discover fresh UK student jobs, part-time roles and internships with schedule and authorization wording clearly labeled when present.",
    heading: "Student jobs, part-time roles and internships in the UK",
    eyebrow: "UK student job search",
    intro:
      "Find roles whose public listing mentions students, internships or flexible schedules. Compare stated hours with the conditions on your own visa record before accepting work.",
    officialGuidance: ukGuidance,
    faqs: sharedPartTimeFaqs
  }
} as const satisfies Record<string, StudentJobsPageConfig>;

export const studentJobsPageList = Object.values(studentJobsPages);

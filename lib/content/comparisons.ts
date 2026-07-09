export type Comparison = {
  slug: string;
  competitor: string;
  title: string;
  description: string;
  officialReferences: Array<{
    label: string;
    url: string;
  }>;
  rows: Array<{
    topic: string;
    hirevate: string;
    competitor: string;
  }>;
  bestForHirevate: string[];
  bestForCompetitor: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const comparisons: Comparison[] = [
  {
    slug: "hirevate-vs-linkedin",
    competitor: "LinkedIn",
    title: "Hirevate vs LinkedIn for Job Search",
    description:
      "A factual comparison of Hirevate's public-source job workflow with LinkedIn's job search, professional network, Easy Apply, and external apply paths.",
    officialReferences: [
      {
        label: "LinkedIn: Search for jobs",
        url: "https://www.linkedin.com/help/linkedin/answer/a511260"
      },
      {
        label: "LinkedIn: Apply for jobs",
        url: "https://www.linkedin.com/help/linkedin/answer/a512388"
      }
    ],
    rows: [
      {
        topic: "Primary experience",
        hirevate:
          "Focused job discovery and preparation using company career pages, public ATS boards, and trusted hiring sources.",
        competitor:
          "Job search inside a professional network, with profile, recruiter, company, and social features."
      },
      {
        topic: "Application path",
        hirevate:
          "Sends the user to the available employer, ATS, or verified partner source. Hirevate does not auto-apply.",
        competitor:
          "LinkedIn documents two paths: Easy Apply on LinkedIn and Apply links that route to a company or third-party site."
      },
      {
        topic: "Source transparency",
        hirevate:
          "Shows whether the available destination is an employer page, public ATS board, or partner hiring source.",
        competitor:
          "Shows the job posting and whether the action is Easy Apply or an external Apply path."
      },
      {
        topic: "Preparation workflow",
        hirevate:
          "Connects job discovery with a resume builder, resume-to-job comparison, cover letters, saved jobs, and an application tracker.",
        competitor:
          "Supports profile-based job search, saved jobs, alerts, uploaded resumes, and Easy Apply where enabled."
      }
    ],
    bestForHirevate: [
      "You want a focused feed without a professional social network.",
      "You want source labels and freshness signals beside each role.",
      "You want resume, cover letter, and tracking tools connected to the same workflow."
    ],
    bestForCompetitor: [
      "You want professional networking and recruiter-facing profile features.",
      "You want LinkedIn Easy Apply where an employer enables it.",
      "You use LinkedIn job alerts and company or professional-network context."
    ],
    faqs: [
      {
        question: "Does Hirevate replace LinkedIn?",
        answer:
          "Not necessarily. The products serve different workflows and can be used together."
      },
      {
        question: "Does Hirevate scrape LinkedIn jobs?",
        answer: "No. Hirevate does not scrape LinkedIn."
      },
      {
        question: "Can Hirevate submit LinkedIn Easy Apply applications?",
        answer:
          "No. Hirevate does not auto-apply and does not submit LinkedIn Easy Apply applications."
      }
    ]
  },
  {
    slug: "hirevate-vs-indeed",
    competitor: "Indeed",
    title: "Hirevate vs Indeed for Job Search",
    description:
      "A factual comparison of Hirevate's public-source workflow with Indeed's broad job search, filters, alerts, application paths, and My Jobs tracking.",
    officialReferences: [
      {
        label: "Indeed: Improving job searches",
        url: "https://support.indeed.com/hc/en-us/articles/204488950-Improving-Your-Job-Searches-Tips-and-Help"
      },
      {
        label: "Indeed: My Jobs overview",
        url: "https://support.indeed.com/hc/en-us/articles/205332490-My-Jobs-Section-Overview"
      },
      {
        label: "Indeed: Applying for a job",
        url: "https://support.indeed.com/hc/en-ca/articles/204652920-Applying-for-a-Job-on-Indeed"
      }
    ],
    rows: [
      {
        topic: "Primary experience",
        hirevate:
          "Focused discovery from company career pages, public ATS boards, and trusted hiring sources.",
        competitor:
          "Broad job search with keyword, location, pay, work-setting, job-type, and date filters."
      },
      {
        topic: "Application path",
        hirevate:
          "Sends the user to the available employer, ATS, or verified partner source. Hirevate does not auto-apply.",
        competitor:
          "Indeed documents applications completed on Indeed and jobs that route to an employer website."
      },
      {
        topic: "Freshness",
        hirevate:
          "Ranks normalized listings with recency, source completeness, location, and apply-path signals.",
        competitor:
          "Includes date-posted filtering and personalized search tools as documented in Indeed Support."
      },
      {
        topic: "Tracking",
        hirevate:
          "Tracks saved, applied, interview, offer, rejected, and withdrawn stages with user-entered context.",
        competitor:
          "Indeed My Jobs includes Saved, Applied, Interviews, and Archived; external applications may require manual status updates."
      }
    ],
    bestForHirevate: [
      "You want a smaller, source-focused workflow rather than the broadest possible search surface.",
      "You want freshness and apply-source labels visible before opening the listing.",
      "You want resume-to-job comparison and cover letter tools beside your tracker."
    ],
    bestForCompetitor: [
      "You want broad search coverage and detailed search filters.",
      "You use Indeed-hosted applications and Indeed profile preferences.",
      "You want Indeed company reviews, salary resources, or its wider job-search ecosystem."
    ],
    faqs: [
      {
        question: "Does Hirevate replace Indeed?",
        answer:
          "Not necessarily. Hirevate offers a focused public-source workflow, while Indeed provides a broad job-search ecosystem."
      },
      {
        question: "Does Hirevate scrape Indeed?",
        answer: "No. Hirevate does not scrape Indeed."
      },
      {
        question: "Does Hirevate claim to have more jobs than Indeed?",
        answer:
          "No. Hirevate does not claim broader coverage than Indeed."
      }
    ]
  }
];

export function getComparison(slug: string) {
  return comparisons.find((comparison) => comparison.slug === slug);
}

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  updatedAt: string;
  readMinutes: number;
  sections: GuideSection[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const guides: Guide[] = [
  {
    slug: "find-hidden-jobs",
    title: "How to Find Hidden Jobs Before They Get Crowded",
    description:
      "A practical process for finding public job openings on company career pages and ATS boards before relying on crowded aggregators.",
    eyebrow: "Job discovery",
    updatedAt: "2026-07-09",
    readMinutes: 6,
    sections: [
      {
        heading: "What a hidden job actually means",
        paragraphs: [
          "A hidden job is not secret or exclusive. It is a public opening that is easier to find at its original hiring source than in a broad social feed or general job board.",
          "Company career pages and public applicant tracking system boards often publish the canonical listing. A focused search can surface that page early, while the role still has clear source details and a usable application path."
        ]
      },
      {
        heading: "Use a source-first search routine",
        paragraphs: [
          "Start with a role family, a short list of companies, and acceptable locations. Search the employer career page, then check its public ATS board and a trusted job discovery source.",
          "Record the source URL and the date you found the role. This prevents repeated review of the same listing and makes stale openings easier to identify."
        ],
        bullets: [
          "Search related job titles, not one exact title.",
          "Check company career pages at a consistent time each day.",
          "Prefer listings with a clear employer, location, description, and apply URL.",
          "Tailor the resume only after confirming the listing is still active."
        ]
      },
      {
        heading: "Use freshness as a decision signal",
        paragraphs: [
          "A recent timestamp is useful, but it is not proof that a role was newly created. Some sources refresh existing listings. Combine recency with a working apply path, complete location data, and a description that still matches the employer page.",
          "Hirevate's freshness score is a ranking aid. It does not guarantee that a role is new, exclusive, or still accepting applications, so always verify the destination before applying."
        ]
      }
    ],
    faqs: [
      {
        question: "Are hidden jobs private jobs?",
        answer:
          "No. In Hirevate, hidden jobs are public openings found through company career pages, public ATS boards, and trusted hiring sources."
      },
      {
        question: "Does Hirevate scrape LinkedIn or Indeed?",
        answer:
          "No. Hirevate does not scrape LinkedIn or Indeed."
      },
      {
        question: "Does Hirevate guarantee fewer applicants?",
        answer:
          "No. Hirevate cannot see the complete applicant count and does not guarantee that a listing has fewer applicants."
      }
    ]
  },
  {
    slug: "search-company-career-pages",
    title: "How to Search Company Career Pages Efficiently",
    description:
      "Build a repeatable company career-page search that catches new openings without manually checking every page all day.",
    eyebrow: "Source strategy",
    updatedAt: "2026-07-09",
    readMinutes: 5,
    sections: [
      {
        heading: "Build a company watchlist",
        paragraphs: [
          "A useful watchlist is small enough to review and broad enough to produce opportunities. Group employers by role fit, location, industry, and hiring frequency.",
          "Keep the company name, career-page URL, ATS provider when visible, target role families, and last review date in one place."
        ]
      },
      {
        heading: "Search by role family",
        paragraphs: [
          "Employers name similar work differently. A customer success search may also need implementation, onboarding, account management, or customer operations. Engineering searches may need platform, infrastructure, frontend, backend, or developer.",
          "Use several precise terms and remove terms that repeatedly create irrelevant results."
        ],
        bullets: [
          "Confirm the employer name and domain.",
          "Open the canonical job detail page before preparing an application.",
          "Check location restrictions on remote roles.",
          "Save the exact apply URL, not only the search-results URL."
        ]
      },
      {
        heading: "Avoid stale-page traps",
        paragraphs: [
          "A search engine can retain an old job URL after the employer closes it. Treat the employer or ATS page as the final authority. If the apply action is gone, the role redirects, or the page says closed, do not submit through an unrelated mirror."
        ]
      }
    ],
    faqs: [
      {
        question: "How often should I check a company career page?",
        answer:
          "For an active search, daily or several times per week is usually enough. The right frequency depends on how often that employer posts relevant roles."
      },
      {
        question: "What is a public ATS board?",
        answer:
          "It is a publicly accessible hiring board hosted by an applicant tracking system on behalf of an employer."
      },
      {
        question: "Is every career-page job direct apply?",
        answer:
          "Only when the apply URL belongs to the employer or its ATS. Partner and discovery-source URLs should be described as partner apply paths."
      }
    ]
  },
  {
    slug: "remote-job-search",
    title: "A Better Remote Job Search Process",
    description:
      "Find remote jobs while checking location restrictions, source quality, freshness, and role fit before investing in an application.",
    eyebrow: "Remote work",
    updatedAt: "2026-07-09",
    readMinutes: 6,
    sections: [
      {
        heading: "Remote does not always mean worldwide",
        paragraphs: [
          "A remote listing may still require residence in a country, state, province, or time zone. Read the location line and description together before treating a role as location-independent.",
          "Tax, employment, security, and team-collaboration requirements can all limit where an employer can hire."
        ]
      },
      {
        heading: "Filter in the right order",
        paragraphs: [
          "Start with role fit, then work mode, allowed geography, seniority, and freshness. Filtering by remote first can produce a large but weak result set.",
          "When the location is unclear, use the employer page as the authority and contact the employer if the restriction affects your eligibility."
        ],
        bullets: [
          "Look for an explicit country or region.",
          "Check required working hours or time-zone overlap.",
          "Separate fully remote from hybrid roles.",
          "Verify that the apply destination is still active."
        ]
      },
      {
        heading: "Tailor for remote evidence",
        paragraphs: [
          "A remote resume should show outcomes, ownership, written communication, asynchronous work, and collaboration across teams or time zones when those facts are true. Avoid adding remote-work claims you cannot support."
        ]
      }
    ],
    faqs: [
      {
        question: "Does remote mean I can work from any country?",
        answer:
          "No. Many remote roles limit applicants to specific countries, regions, or time zones."
      },
      {
        question: "How does Hirevate identify remote roles?",
        answer:
          "Hirevate normalizes work-mode and location signals supplied by public hiring sources. Users should still confirm restrictions on the destination page."
      },
      {
        question: "Can I browse remote roles without an account?",
        answer:
          "Yes. Public remote job pages can be browsed without signing in, subject to the current product experience."
      }
    ]
  },
  {
    slug: "job-freshness-score",
    title: "How Hirevate's Job Freshness Score Works",
    description:
      "Understand what Hirevate's freshness score measures, what it does not prove, and how to use it when prioritizing applications.",
    eyebrow: "Product guide",
    updatedAt: "2026-07-09",
    readMinutes: 4,
    sections: [
      {
        heading: "A ranking signal, not a promise",
        paragraphs: [
          "The freshness score helps sort public listings using source recency, apply URL availability, location completeness, and role relevance.",
          "It does not prove that a role was created today, that the employer has reviewed no candidates, or that an interview is more likely."
        ]
      },
      {
        heading: "Why multiple signals matter",
        paragraphs: [
          "A timestamp alone can be misleading because some feeds refresh existing records. A usable destination, complete source data, and a coherent role record make recency more useful.",
          "Hirevate refreshes source records and expires stale jobs according to its sync policy. The destination hiring page remains the final authority."
        ]
      },
      {
        heading: "How to use the score",
        paragraphs: [
          "Use freshness to order a shortlist, then verify role fit and source validity. A lower-scored role that strongly matches your experience can still be more valuable than a newer but irrelevant one."
        ]
      }
    ],
    faqs: [
      {
        question: "Does a score of 100 guarantee a new job?",
        answer:
          "No. It indicates strong freshness and completeness signals inside Hirevate, not guaranteed creation time."
      },
      {
        question: "Can a refreshed listing be an older role?",
        answer:
          "Yes. Sources can update or republish existing records, which is why users should check the employer or ATS page."
      },
      {
        question: "Does freshness predict an interview?",
        answer:
          "No. Interview outcomes depend on fit, application quality, employer decisions, timing, and other factors."
      }
    ]
  },
  {
    slug: "resume-job-match",
    title: "How to Compare a Resume With a Job Description",
    description:
      "Use a resume-to-job comparison as a practical editing checklist without treating a match score as a hiring decision.",
    eyebrow: "Resume strategy",
    updatedAt: "2026-07-09",
    readMinutes: 6,
    sections: [
      {
        heading: "Start with required evidence",
        paragraphs: [
          "Separate the job description into responsibilities, required skills, preferred skills, tools, domain knowledge, and outcome expectations.",
          "For each important requirement, identify truthful evidence in your experience. If no evidence exists, do not add the keyword as if it does."
        ]
      },
      {
        heading: "Improve clarity before keyword density",
        paragraphs: [
          "A strong resume explains what you did, the context, and the result. Relevant terms should appear naturally in achievement-focused bullets and skill sections.",
          "Exact wording can help an ATS recognize familiar skills, but repetition without evidence makes the document weaker for a human reviewer."
        ],
        bullets: [
          "Match the target role title when accurate.",
          "Move the most relevant evidence higher.",
          "Quantify outcomes when you can verify the numbers.",
          "Remove unrelated detail that hides stronger proof."
        ]
      },
      {
        heading: "Treat the score as guidance",
        paragraphs: [
          "Hirevate's resume match is a comparison aid, not an employer ATS and not a prediction of selection. Use the gaps to guide editing, then review the final resume for accuracy, readability, and role fit."
        ]
      }
    ],
    faqs: [
      {
        question: "Does a high resume match score guarantee an interview?",
        answer:
          "No. It only reflects the comparison signals available to the tool."
      },
      {
        question: "Should I copy every keyword from the job description?",
        answer:
          "No. Include relevant terms only when they truthfully describe your skills or experience."
      },
      {
        question: "Is Hirevate the employer's ATS?",
        answer:
          "No. Hirevate's comparison is an independent preparation tool and does not represent an employer's screening system."
      }
    ]
  },
  {
    slug: "application-tracking",
    title: "How to Track Job Applications Without Losing Context",
    description:
      "Use a simple application tracker to record sources, resume versions, dates, stages, and interview outcomes.",
    eyebrow: "Search workflow",
    updatedAt: "2026-07-09",
    readMinutes: 5,
    sections: [
      {
        heading: "Track decisions, not just job links",
        paragraphs: [
          "A useful tracker records the company, role, source URL, application date, resume version, current stage, next action, and notes.",
          "This makes it easier to follow up, avoid duplicate applications, and understand which role families are producing conversations."
        ]
      },
      {
        heading: "Use consistent stages",
        paragraphs: [
          "Choose a small set of stages such as saved, applied, interview, offer, rejected, and withdrawn. Update the stage when something actually changes.",
          "Keep factual notes about recruiter contact, interview dates, required tasks, and follow-up commitments."
        ],
        bullets: [
          "Record the canonical application URL.",
          "Name the resume version used.",
          "Add the next action and its date.",
          "Separate no response from a confirmed rejection."
        ]
      },
      {
        heading: "Read conversion rates carefully",
        paragraphs: [
          "Application-to-interview rate can reveal patterns, but small samples are noisy. Compare similar job titles and resume versions over enough applications before drawing a conclusion.",
          "A tracker cannot identify every cause. Market conditions, eligibility, timing, competition, and employer process also affect outcomes."
        ]
      }
    ],
    faqs: [
      {
        question: "What should a job application tracker include?",
        answer:
          "At minimum: company, job title, source URL, date, resume version, status, next action, and notes."
      },
      {
        question: "Can Hirevate know whether an employer viewed my application?",
        answer:
          "Not unless that information is explicitly recorded by the user or provided through an integrated source. Hirevate does not claim universal employer-side tracking."
      },
      {
        question: "How many applications are needed for a useful conversion rate?",
        answer:
          "There is no universal minimum. More comparable observations produce a more stable signal than a very small sample."
      }
    ]
  }
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}

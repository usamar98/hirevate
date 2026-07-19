import { env } from "@/lib/env";
import { pricingSummary } from "@/lib/pricing";

export type LegalSection = {
  title: string;
  text?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: string;
  shortTitle: string;
  title: string;
  description: string;
  summary: string;
  sections: LegalSection[];
};

export const legalEffectiveDate = "2026-07-17";
export const legalEffectiveDateLabel = "July 17, 2026";

export const legalIdentity = {
  operatorName: env.legalOperatorName || "Hirevate",
  contactEmail: env.legalEmail || "support@hirevate.com",
  address: env.legalAddress,
  registrationNumber: env.legalRegistrationNumber,
  country: env.legalCountry
} as const;

export const legalDocuments: LegalDocument[] = [
  {
    slug: "privacy-policy",
    shortTitle: "Privacy",
    title: "Hirevate Privacy Policy",
    description: "How Hirevate handles accounts, payments, job-search activity, browser-stored resume drafts, service providers, retention, and privacy rights.",
    summary: "This policy explains what personal information Hirevate handles, why it is used, and the choices available to users.",
    sections: [
      {
        title: "Information we handle",
        bullets: [
          "Account details, authentication records, approximate country signals, subscription references, tracker entries, support messages, pseudonymous consented visitor measurements, and limited service activity.",
          "Public job information from company career pages, public ATS boards, and trusted job sources."
        ]
      },
      {
        title: "Resume and document data",
        text: ["Resume-builder drafts and resume-match text are saved in local browser storage by default. When a user explicitly requests AI writing, the relevant resume or cover-letter inputs are sent through Hirevate servers to the configured AI provider to produce the requested suggestion."]
      },
      {
        title: "Use, sharing, and retention",
        text: [
          "Information is used to provide accounts, billing, career tools, security, support, and legal compliance. Specialist hosting, authentication, database, payment, and email providers receive only what they need. Hirevate does not sell personal information.",
          "Information is kept only while needed for its purpose, account or transaction records, disputes, or law. Users may request access, correction, export, or deletion through the legal contact."
        ]
      }
    ]
  },
  {
    slug: "terms-of-service",
    shortTitle: "Terms",
    title: "Hirevate Terms of Service",
    description: "Terms governing Hirevate accounts, job discovery, resume tools, subscriptions, acceptable use, third-party links, ownership, and limitations.",
    summary: "These terms govern access to Hirevate and form the agreement between each user and the service operator.",
    sections: [
      {
        title: "Accounts and acceptable use",
        bullets: [
          "Users must be at least 18, provide accurate information, secure their account, and use Hirevate lawfully.",
          "Do not bypass limits, disrupt the service, deceive employers, or submit inaccurate or infringing application content."
        ]
      },
      {
        title: "Job service and outcomes",
        text: ["Hirevate is not an employer, recruiter, staffing agency, or representative of listed companies. Users must verify roles at the original source. Hirevate does not guarantee availability, interviews, offers, salaries, or hiring outcomes."]
      },
      {
        title: "Ownership, changes, and liability",
        text: ["Hirevate software and original content remain protected by law. Features may change where reasonably necessary. The service is provided with reasonable care, and liability is limited to the extent permitted by law without affecting mandatory consumer rights."]
      }
    ]
  },
  {
    slug: "subscription-terms",
    shortTitle: "Subscriptions",
    title: "Hirevate Subscription and Cancellation Terms",
    description: "Hirevate daily, weekly, monthly, and annual recurring billing, automatic renewal, cancellation at period end, paid access, refunds, and price changes.",
    summary: "Paid plans renew for the selected billing period until the subscriber cancels.",
    sections: [
      {
        title: "Plans and renewal",
        text: [pricingSummary, "The selected price and interval are shown before payment. Stripe processes card details and recurring charges. A subscription renews daily, weekly, monthly, or annually until cancellation."]
      },
      {
        title: "Cancellation",
        text: ["A signed-in subscriber can open Account Subscription from the dashboard and select Cancel subscription. Cancellation takes effect at the end of the paid period, with access continuing until then."]
      },
      {
        title: "Refunds and payment issues",
        text: ["Charges are generally non-refundable except where required by law or the EU withdrawal policy. Failed or reversed payments may limit paid access. Material price changes apply prospectively after notice."]
      }
    ]
  },
  {
    slug: "eu-withdrawal-refund-policy",
    shortTitle: "EU refunds",
    title: "EU Withdrawal and Refund Policy",
    description: "Hirevate's 14-day EU consumer withdrawal process, immediate service access, request information, refund timing, and statutory rights.",
    summary: "Eligible European consumers may have a statutory right to withdraw from an online service contract.",
    sections: [
      {
        title: "Fourteen-day period",
        text: ["An eligible EU consumer may notify Hirevate of withdrawal within 14 days after entering the subscription contract, without giving a reason."]
      },
      {
        title: "Immediate access",
        text: ["When immediate access is requested during the withdrawal period, a refund may be reduced by the value already supplied where law permits. Rights that cannot be waived remain available."]
      },
      {
        title: "Request and refund",
        text: ["Email the legal contact with the account email, payment date, plan, and withdrawal request. Do not send full card details. Approved statutory refunds are returned through the original payment method without undue delay, normally within 14 days."]
      }
    ]
  },
  {
    slug: "cookie-policy",
    shortTitle: "Cookies",
    title: "Hirevate Cookie and Local Storage Policy",
    description: "How Hirevate uses essential authentication cookies, consent preferences, optional visitor measurement, and local browser storage.",
    summary: "Hirevate uses essential browser technologies and, with permission, privacy-conscious visitor measurement.",
    sections: [
      {
        title: "Essential cookies",
        text: ["Authentication and security cookies keep users signed in, refresh sessions, save consent choices, and protect restricted areas."]
      },
      {
        title: "Local storage",
        text: ["Resume-builder drafts, resume-match text, and preferences may be saved in the user's browser. They can be cleared in the relevant tool or browser settings."]
      },
      {
        title: "Optional cookies and choices",
        text: ["When a user permits optional measurement, Hirevate stores a pseudonymous visitor identifier to count daily visitors and page views. It does not store the visitor's IP address. Rejecting optional cookies does not block essential account functions. Clearing the consent preference causes Hirevate to ask again."]
      }
    ]
  },
  {
    slug: "privacy-notice-at-collection",
    shortTitle: "Collection notice",
    title: "Hirevate Privacy Notice at Collection",
    description: "Categories of personal information collected by Hirevate at signup, payment, support, and job tracking, with purposes and retention.",
    summary: "This short notice applies where Hirevate collects personal information directly from a user.",
    sections: [
      {
        title: "Categories and purposes",
        text: ["Hirevate may collect account identifiers, approximate country signals, subscription references, tracker entries, support messages, and technical information needed for authentication, reliability, security, and service limits."]
      },
      {
        title: "Sharing",
        text: ["Contracted hosting, authentication, database, payment, and email providers receive information needed for their service. Hirevate does not sell personal information."]
      },
      {
        title: "Retention and choices",
        text: ["Retention depends on the account, transaction, support, security, and legal purpose. Users may use account controls or the legal contact to exercise applicable privacy rights."]
      }
    ]
  },
  {
    slug: "job-source-takedown-policy",
    shortTitle: "Job sources",
    title: "Hirevate Job Source and Takedown Policy",
    description: "Hirevate job sources, employer and ATS links, freshness checks, corrections, expired listings, source rights, and takedown requests.",
    summary: "Hirevate organizes public job information and routes users to the relevant employer, ATS, or authorized partner destination.",
    sections: [
      {
        title: "Sources and freshness",
        text: ["Listings may come from company career pages, public ATS boards, and trusted job APIs. Internal provenance is retained even when cards use a simple Apply now label. Hirevate checks sources and expires stale listings."]
      },
      {
        title: "Original source controls",
        text: ["The original hiring source controls availability, requirements, compensation, and applications. Displaying a job or logo does not imply sponsorship or an employment relationship with Hirevate."]
      },
      {
        title: "Corrections and removal",
        text: ["An employer, rights holder, provider, or affected person may send the job URL, organization, requested action, and evidence of authority to the legal contact."]
      }
    ]
  },
  {
    slug: "copyright-dmca-policy",
    shortTitle: "Copyright",
    title: "Hirevate Copyright and DMCA Policy",
    description: "How to submit copyright and DMCA notices for material located through Hirevate and request review of company trademarks or logos.",
    summary: "Hirevate respects intellectual-property rights and reviews sufficiently detailed notices.",
    sections: [
      {
        title: "Copyright notice",
        text: ["Identify the protected work, the Hirevate URL or material, contact information, authority to act, good-faith and accuracy statements, and a physical or electronic signature."]
      },
      {
        title: "Response and counter-notice",
        text: ["Hirevate may remove or disable material, request clarification, notify the affected source, and review a legally sufficient counter-notice when material was removed by mistake."]
      },
      {
        title: "Company marks",
        text: ["Company names and logos belong to their owners and are used only to identify relevant jobs. Rights holders may request review through the legal contact."]
      }
    ]
  },
  {
    slug: "ai-resume-match-disclosure",
    shortTitle: "Resume matching",
    title: "AI and Resume-Match Disclosure",
    description: "How Hirevate resume matching and AI writing work, what scores and suggestions mean, data processing, limitations, and user responsibility.",
    summary: "Hirevate resume matching is an advisory editing aid, not an employer ATS score or hiring decision.",
    sections: [
      {
        title: "How matching and AI writing work",
        text: ["Resume-match scoring uses rules-based text comparison for role terms, skills, action language, and measurable outcomes in the browser. AI writing runs only after a user requests it and sends the relevant inputs through Hirevate servers to the configured AI provider."]
      },
      {
        title: "AI safeguards and data",
        text: ["AI writing is instructed to use only user-provided facts and not invent employers, qualifications, metrics, or outcomes. AI requests are configured not to be stored by the model API, but provider processing and limited security retention may still apply under the provider terms."]
      },
      {
        title: "Limits of the score",
        text: ["The percentage indicates textual alignment with the selected Hirevate job description. It does not reproduce an employer ATS or predict screening, interviews, or hiring."]
      },
      {
        title: "User responsibility",
        text: ["Users must add only truthful experience and qualifications, avoid sending unnecessary sensitive information, and review every AI suggestion. Hirevate does not auto-apply, guarantee hiring outcomes, or make employment decisions for employers."]
      }
    ]
  },
  {
    slug: "accessibility-statement",
    shortTitle: "Accessibility",
    title: "Hirevate Accessibility Statement",
    description: "Hirevate's accessibility commitment, WCAG target, supported interactions, third-party limitations, and feedback process.",
    summary: "Hirevate aims to provide a usable job-search and career workflow for people with disabilities.",
    sections: [
      {
        title: "Accessibility target",
        text: ["Hirevate works toward WCAG 2.2 Level AA principles, including semantic structure, keyboard access, visible focus, readable contrast, form labels, and responsive layouts."]
      },
      {
        title: "Ongoing improvement",
        text: ["Accessibility is reviewed as features change using automated checks and practical keyboard and screen-size testing."]
      },
      {
        title: "Help and third parties",
        text: ["External employer, ATS, or payment pages are controlled by their operators. Send the page, feature, assistive technology, and problem encountered to the legal contact so Hirevate can investigate or provide an alternative."]
      }
    ]
  },
  {
    slug: "legal-notice",
    shortTitle: "Legal notice",
    title: "Hirevate Legal Notice and Imprint",
    description: "The Hirevate website operator, legal contact, service description, intellectual-property notice, and third-party disclosures.",
    summary: "This notice identifies the service and contact channel for legal, privacy, copyright, and consumer requests.",
    sections: [
      {
        title: "Service operator",
        bullets: [
          `Operator: ${legalIdentity.operatorName}`,
          "Website: https://www.hirevate.com",
          `Legal and support contact: ${legalIdentity.contactEmail}`,
          ...(legalIdentity.address ? [`Registered address: ${legalIdentity.address}`] : []),
          ...(legalIdentity.registrationNumber ? [`Registration number: ${legalIdentity.registrationNumber}`] : []),
          ...(legalIdentity.country ? [`Country of establishment: ${legalIdentity.country}`] : [])
        ]
      },
      {
        title: "Service and third parties",
        text: ["Hirevate is an online job-discovery and career-workflow service, not an employer, recruiter, or representative of listed companies. Third-party marks, job content, and linked services remain their owners' property."]
      },
      {
        title: "Verified operator details",
        text: ["The legal operator name, registered address, registration number, and country can be configured for this page when the operating entity is finalized. Hirevate does not publish invented or unverified business details."]
      }
    ]
  }
];

export function getLegalDocument(slug: string) {
  return legalDocuments.find((document) => document.slug === slug);
}

export const legalFooterLinks = legalDocuments.map((document) => ({
  href: `/legal/${document.slug}`,
  label: document.shortTitle
}));

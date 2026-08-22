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

export const legalEffectiveDate = "2026-08-22";
export const legalEffectiveDateLabel = "August 22, 2026";

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
    description: "How Hirevate collects, uses, shares, protects, and retains account, payment, job-search, resume, AI, analytics, and support information.",
    summary: "This policy explains what personal information Hirevate handles, why it is needed, which providers receive it, and the privacy choices available to users.",
    sections: [
      {
        title: "1. Scope and who is responsible",
        text: [
          `This Privacy Policy applies to https://www.hirevate.com, Hirevate accounts, and the job-search, resume, cover-letter, application-tracking, subscription, and support features provided by ${legalIdentity.operatorName}. It does not govern an employer, applicant-tracking system, job source, Stripe-hosted page, or other third-party service reached through Hirevate.`,
          `${legalIdentity.operatorName} is responsible for Hirevate's handling of personal information. Privacy questions and requests may be sent to ${legalIdentity.contactEmail}. Additional operator information appears in the Hirevate Legal Notice.`
        ]
      },
      {
        title: "2. Information Hirevate collects",
        bullets: [
          "Account and profile information: name, username, email address, authentication identifiers, account dates, country preference, and account settings. Authentication is provided through Supabase; Hirevate does not store a readable copy of the user's password.",
          "Subscription information: selected plan, Stripe customer and subscription references, payment status, billing interval, renewal or cancellation status, and relevant transaction dates. Full card numbers and card security codes are collected by Stripe and are not stored on Hirevate servers.",
          "Job-search and application information: saved jobs, application stages, priorities, follow-up dates, contacts, salary notes, user notes, and related activity entered into the application tracker.",
          "Resume and writing information: resume drafts, career facts, skills, job descriptions, job links, cover-letter inputs, selected templates, and AI-generated output when a user chooses to use those tools.",
          "Service activity and security information: feature requests, trial and access-control records, timestamps, error and security logs, device or browser information made available to hosting providers, and communications with support.",
          "Optional analytics information: consent choice, a pseudonymous visitor identifier, pages visited, visit counts, approximate country derived from infrastructure headers, and standard Google Analytics information when optional analytics is accepted. Hirevate's own visitor record does not store an IP address."
        ]
      },
      {
        title: "3. Where information comes from",
        text: [
          "Hirevate receives information directly from users, from their use of the service, from Stripe payment and subscription events, from authentication and infrastructure providers, and from consented analytics. Approximate country may be inferred from request headers supplied by hosting infrastructure.",
          "Public job listings come from company career pages, public applicant-tracking-system boards, job APIs, and other public hiring sources. Public job information is not treated as a user's personal account information merely because it appears in search results."
        ]
      },
      {
        title: "4. How Hirevate uses information",
        bullets: [
          "Create and secure accounts, authenticate users, remember settings, and provide customer support.",
          "Provide job discovery, saved jobs, application tracking, resume analysis, resume generation, cover-letter drafting, document export, and related account features.",
          "Administer free access, subscriptions, payment status, renewals, cancellations, refunds, fraud controls, and service limits.",
          "Fetch a public job page only when needed to display a listing or when a user asks Hirevate to analyze that page.",
          "Operate, debug, protect, measure, and improve the service; detect misuse; enforce the Terms; and comply with legal obligations.",
          "Send transactional account, security, billing, and service messages. Marketing messages are sent only where permitted and can be declined using the method provided in the message or by contacting support."
        ]
      },
      {
        title: "5. Legal bases for EEA and UK users",
        text: [
          "Where data-protection law requires a legal basis, Hirevate relies on performance of a contract to provide requested account and paid features; legitimate interests in securing, supporting, and improving the service; consent for optional analytics or marketing; and legal obligations relating to payments, tax, disputes, and lawful requests. Consent may be withdrawn at any time without affecting earlier lawful processing."
        ]
      },
      {
        title: "6. Payments and Stripe",
        text: [
          "Stripe processes Checkout, card details, payment authentication, invoices, recurring subscription charges, refunds, and payment-risk signals. Hirevate sends Stripe the account email, internal user reference, selected plan, and information needed to create and manage the subscription. Stripe returns customer, subscription, Checkout, invoice, payment, and status references needed to grant or remove paid access.",
          "No payment method is requested to start the three-day trial. Stripe receives payment information only if a user actively chooses a paid membership and proceeds to Stripe Checkout. Hirevate records trial dates and access-control information needed to provide the trial, prevent repeat trials, apply service limits, and schedule a trial-ending reminder.",
          "Stripe handles payment information under its own privacy terms and applicable role as a payment provider. Users should not send full card information to Hirevate by email or support message."
        ]
      },
      {
        title: "7. Resume, cover-letter, and AI processing",
        text: [
          "Resume-builder drafts and resume-match text are stored in the user's browser by default. They remain there until the user resets the tool, clears browser storage, or removes the data through browser controls.",
          "When a user requests AI job analysis, resume generation, or cover-letter writing, the relevant job link or pasted job description and the career facts or writing inputs needed for that request are sent through Hirevate servers to the configured OpenAI service. Requests are configured with model-response storage disabled. Provider processing and limited security retention may still apply under the provider's terms.",
          "Hirevate does not sell resume content, use it to make employment decisions, or represent that an AI output is accurate. Users should remove unnecessary sensitive information and review every generated statement before use."
        ]
      },
      {
        title: "8. Cookies, local storage, and analytics",
        text: [
          "Essential cookies and similar technologies support sign-in, session refresh, security, and consent preferences. Local browser storage may hold resume drafts, resume-match text, interface preferences, and time-limited offer display state.",
          "Optional analytics runs only after the user accepts optional measurement. It may include Hirevate's pseudonymous daily visitor measurement and Google Analytics. Users can reject optional analytics without losing essential account functionality and can change the choice by clearing the saved consent preference. Additional details appear in the Cookie and Local Storage Policy."
        ]
      },
      {
        title: "9. When information is shared",
        bullets: [
          "Supabase for authentication, database, account, and application-tracker infrastructure.",
          "Vercel and related infrastructure providers for website hosting, request delivery, security, and operational logs.",
          "Stripe for Checkout, recurring billing, payment processing, fraud prevention, refunds, and subscription management.",
          "OpenAI when a user requests AI job analysis, resume generation, or career writing.",
          "Resend or another configured email provider for transactional service messages, including a scheduled membership reminder shortly before a trial ends.",
          "Google Analytics only after optional analytics consent.",
          "Professional advisers, authorities, courts, or counterparties when reasonably necessary to comply with law, protect users or the service, investigate misuse, establish legal claims, or complete a legitimate business reorganization subject to appropriate safeguards."
        ]
      },
      {
        title: "10. Selling, advertising, and automated decisions",
        text: [
          "Hirevate does not sell personal information and does not share it for cross-context behavioral advertising. Hirevate does not make employment, credit, housing, insurance, or other legally significant decisions about users. Resume-match scores and AI suggestions are advisory editing tools and are not employer decisions or predictions of a hiring result."
        ]
      },
      {
        title: "11. International processing",
        text: [
          "Hirevate and its providers may process information in countries other than the user's country. Where required, Hirevate relies on contractual protections, adequacy decisions, or another lawful transfer mechanism. Provider locations and safeguards may change as infrastructure changes."
        ]
      },
      {
        title: "12. Retention",
        bullets: [
          "Account, profile, saved-job, application-tracker, and access-control records are generally kept while the account remains open and are deleted or de-identified after account deletion, subject to backups and legal exceptions.",
          "Subscription and transaction references are kept for billing, reconciliation, fraud prevention, tax, accounting, dispute, and legal-record purposes for the period required or reasonably necessary.",
          "Support, security, and operational records are retained only as long as needed to resolve the request, protect the service, document consent, enforce rights, or meet legal obligations.",
          "Browser-stored resume and preference information remains under the user's browser controls. Aggregated or de-identified statistics that no longer identify a person may be retained."
        ]
      },
      {
        title: "13. Security",
        text: [
          "Hirevate uses HTTPS, access controls, scoped credentials, row-level database protections, payment-provider Checkout, and other technical and organizational safeguards appropriate to the service. No online service can guarantee absolute security. Users should use a unique password, protect their account, and promptly report suspected unauthorized access."
        ]
      },
      {
        title: "14. Privacy rights and choices",
        text: [
          "Depending on location, a user may have rights to access, correct, delete, restrict, object to, or receive a portable copy of personal information; withdraw consent; opt out of marketing; or appeal a denied request. Users may update available profile fields or permanently delete an account through account controls, or email the legal contact.",
          "Hirevate may verify identity and authority before fulfilling a request. Legally permitted exceptions may apply, including records needed for security, fraud prevention, billing, disputes, or law. Hirevate will not discriminate against a user for exercising a privacy right. Users may also complain to their local data-protection authority."
        ]
      },
      {
        title: "15. Children",
        text: [
          "Hirevate is intended for people aged 18 or older and is not directed to children. If Hirevate learns that it collected personal information from a child contrary to applicable law, it will take reasonable steps to delete it."
        ]
      },
      {
        title: "16. Changes and contact",
        text: [
          `Hirevate may update this policy to reflect legal, provider, security, or product changes. The effective date will be updated, and material changes will receive additional notice where required. Questions, complaints, and privacy requests should be sent to ${legalIdentity.contactEmail}. Do not include passwords, full card details, government identifiers, or other unnecessary sensitive information.`
        ]
      }
    ]
  },
  {
    slug: "terms-of-service",
    shortTitle: "Terms",
    title: "Hirevate Terms of Service",
    description: "Terms governing Hirevate accounts, the three-day free trial, paid subscriptions, job discovery, AI resume and cover-letter tools, acceptable use, cancellations, refunds, and liability.",
    summary: "These terms form the agreement for using Hirevate's job-search, resume, cover-letter, application-tracking, free-access, and paid subscription services.",
    sections: [
      {
        title: "1. Agreement and service operator",
        text: [
          `These Terms of Service are a binding agreement between each user and ${legalIdentity.operatorName}, the operator of https://www.hirevate.com. By creating an account, accessing a restricted feature, starting free access, or purchasing a subscription, the user agrees to these Terms and acknowledges the Privacy Policy. If the user does not agree, the service must not be used.`,
          `Questions about these Terms may be sent to ${legalIdentity.contactEmail}. The Legal Notice contains the operator details configured for the website.`
        ]
      },
      {
        title: "2. Eligibility and accounts",
        bullets: [
          "Users must be at least 18 years old and legally able to enter this agreement. A person using Hirevate for an organization confirms authority to bind that organization.",
          "Account information must be accurate and kept current. Users are responsible for account credentials and activity conducted through their accounts, except where caused by Hirevate's failure to use reasonable security.",
          "Accounts are personal unless Hirevate expressly authorizes an organizational plan. Users must promptly report suspected unauthorized access and must not sell, transfer, or share access with an unauthorized person."
        ]
      },
      {
        title: "3. What Hirevate provides",
        text: [
          "Hirevate is an online job-discovery and career-workflow service. Depending on access level, features may include public job search, job-source links, saved jobs, an application tracker, job analysis, resume building and export, resume matching, cover-letter drafting, and AI-assisted writing.",
          "Hirevate is not an employer, recruiter, staffing agency, immigration adviser, or representative of a listed company. Hirevate does not submit an application for the user, verify work authorization, promise that a listing remains open, or guarantee an interview, offer, salary, visa, or hiring outcome."
        ]
      },
      {
        title: "4. Three-day free access",
        text: [
          "An eligible user may receive one three-day trial of selected Hirevate features when the account is created. No payment method is required, no subscription is created, and no charge is made when the trial starts.",
          "The trial ends automatically at the displayed trial end time. It does not convert to a paid membership, and Hirevate does not automatically charge the user when it ends. Continuing after the trial requires the user to actively choose a monthly or annual membership and complete Stripe Checkout.",
          "Hirevate schedules a courtesy reminder approximately 24 hours before the trial ends, inviting the user to choose a membership if they want continued access. Email delivery can be delayed or fail for reasons outside Hirevate's control; whether or not the reminder arrives, no paid membership or automatic charge begins from the free trial alone.",
          "Trial access is an evaluation of selected core features and is subject to feature availability, anti-abuse controls, and technical usage safeguards. It has no cash value, cannot be transferred, combined, extended, repeatedly claimed, or exchanged for credit, and may be withdrawn for fraud, duplicate accounts, circumvention, or unlawful use. Mandatory consumer rights remain unaffected."
        ]
      },
      {
        title: "5. Paid plans, prices, and recurring billing",
        text: [
          pricingSummary,
          "Prices are stated in United States dollars unless Checkout clearly displays another currency. The selected plan, billing interval, total charge, and applicable payment details are shown before purchase. Stripe processes the payment and may perform payment authentication or fraud checks.",
          "A paid subscription begins only after the user selects a plan, completes Stripe Checkout, and Stripe confirms the initial payment. Paid subscriptions renew automatically for the same billing interval until canceled. By purchasing a paid membership, the subscriber authorizes Stripe and Hirevate to charge the payment method for each disclosed initial or renewal amount, subject to applicable law. Bank conversion or issuer fees are controlled by the user's payment provider."
        ]
      },
      {
        title: "6. Cancellation",
        text: [
          "The free trial does not need to be canceled because it ends automatically without creating a paid membership or charge. A signed-in paid subscriber can open Account, choose Subscription, and select Cancel subscription. Cancellation after payment normally stops the next renewal and takes effect at the end of the current paid billing period; paid access remains available until then. Deleting an account also triggers cancellation of active recurring subscriptions located for that account, but users should confirm the resulting Stripe status.",
          `If self-service cancellation is unavailable, contact ${legalIdentity.contactEmail} from the account email before the next renewal. Cancellation does not create a refund for time already billed, except where law or the Refund Policy requires one.`
        ]
      },
      {
        title: "7. Refunds, failed payments, and disputes",
        text: [
          "Subscription charges are generally non-refundable once the paid period begins, and Hirevate does not provide prorated refunds for unused time or a change of mind, except where required by law or expressly stated in the EU Withdrawal and Refund Policy. Duplicate or incorrect charges should be reported promptly so they can be investigated.",
          "Failed, reversed, disputed, or overdue payments may cause paid access to remain pending, be restricted, or end. Approved refunds are returned through Stripe to the original payment method. Nothing in these Terms limits statutory refund, chargeback, or consumer rights that cannot legally be excluded."
        ]
      },
      {
        title: "8. User content and truthful applications",
        text: [
          "Users retain ownership of resume text, cover-letter inputs, application notes, and other content they provide. Users grant Hirevate a limited permission to host, process, transmit, reproduce, and format that content only as needed to provide, secure, and support the requested service.",
          "Users are responsible for ensuring that application materials are truthful, lawful, non-confidential where shared with providers, and do not infringe another person's rights. Users must review AI suggestions and source listings before relying on or submitting them."
        ]
      },
      {
        title: "9. AI and resume-match tools",
        text: [
          "AI-generated analysis and writing may be incomplete, inaccurate, outdated, or unsuitable. Resume-match percentages measure textual alignment within Hirevate and do not reproduce an employer's applicant-tracking system, make an employment decision, or predict screening or hiring.",
          "Hirevate instructs its AI provider to use user-supplied career facts and not invent experience, qualifications, employers, or achievements. Users remain solely responsible for checking every output and for the final content they use. Additional processing details appear in the AI and Resume-Match Disclosure and Privacy Policy."
        ]
      },
      {
        title: "10. Job listings and third-party services",
        text: [
          "Job information may come from public employer pages, public ATS boards, job APIs, and other public hiring sources. The original source controls the role, requirements, compensation, application process, deadlines, and availability. Hirevate may correct, expire, or remove listings without preserving a permanent copy.",
          "Employer, ATS, Stripe, and other third-party websites have separate terms, privacy practices, availability, and security. A link or company name does not mean Hirevate endorses, employs, represents, or is sponsored by that organization. Users should verify a destination before submitting personal information or money."
        ]
      },
      {
        title: "11. Acceptable use",
        bullets: [
          "Do not violate law, sanctions, export controls, employment rules, privacy rights, intellectual-property rights, or another person's contractual rights.",
          "Do not create deceptive applications, impersonate a person or company, misrepresent qualifications, upload malware, phish, harass, discriminate, or use Hirevate to facilitate fraud or spam.",
          "Do not bypass authentication, payment, trial, feature, rate, geographic, or security controls; create duplicate accounts to evade restrictions; probe vulnerabilities; interfere with operation; or access another user's data.",
          "Do not scrape, crawl, bulk-export, resell, mirror, reverse engineer, or train a competing system on Hirevate or its compiled job index except where applicable law expressly permits and only after any required notice.",
          "Do not submit special-category, highly sensitive, confidential, or third-party personal information unless it is lawful, necessary, and appropriate for the requested feature."
        ]
      },
      {
        title: "12. Hirevate intellectual property",
        text: [
          "Hirevate and its licensors retain rights in the software, design, branding, templates, compilation, and original website content. Subject to these Terms, Hirevate grants each user a limited, revocable, non-exclusive, non-transferable right to use the service for personal career activity during the applicable access period.",
          "Company names, logos, job descriptions, and third-party materials belong to their respective owners. Feedback may be used to improve Hirevate without payment or restriction, provided it does not identify the user publicly without permission."
        ]
      },
      {
        title: "13. Service changes, suspension, and termination",
        text: [
          "Hirevate may maintain, change, add, limit, or discontinue features to improve security, comply with law or provider requirements, manage costs, or develop the service. Material changes to a paid service will receive notice where reasonably practicable or legally required.",
          "Hirevate may suspend or terminate access for a material breach, payment failure, security threat, fraud, abuse, legal requirement, or risk to users or the service. Where appropriate, Hirevate will provide notice and an opportunity to correct the issue. Users may stop using Hirevate or delete their account at any time."
        ]
      },
      {
        title: "14. Disclaimers",
        text: [
          "Hirevate provides the service using reasonable care. To the maximum extent permitted by law, the service and third-party job information are otherwise provided on an as-available basis without implied guarantees of uninterrupted operation, error-free AI output, listing accuracy, fitness for a particular role, employment success, or continued availability of a third-party source.",
          "Nothing in these Terms excludes warranties or remedies that cannot lawfully be excluded, including mandatory consumer guarantees."
        ]
      },
      {
        title: "15. Limitation of liability",
        text: [
          "To the maximum extent permitted by law, neither party is liable for indirect, incidental, special, consequential, exemplary, or punitive loss, or for lost profits, opportunities, data, goodwill, or anticipated savings that were not reasonably foreseeable when the agreement was formed.",
          "To the maximum extent permitted by law, Hirevate's aggregate liability arising from the paid service is limited to the amount the affected user paid Hirevate during the twelve months before the event giving rise to the claim. For free access, aggregate liability is limited to the greater of USD 25 or the minimum amount required by law.",
          "These limits do not apply to fraud, willful misconduct, death or personal injury caused by negligence, breach of confidentiality or data-protection duties where liability cannot be limited, or any other liability that applicable law prohibits limiting."
        ]
      },
      {
        title: "16. Governing rules and disputes",
        text: [
          "The laws and competent courts applicable to the Hirevate operator identified in the Legal Notice govern these Terms, except that a consumer retains mandatory protections and any right to bring a claim in the consumer's home forum that applicable law does not permit these Terms to remove.",
          `Before filing a non-urgent claim, users are encouraged to send a description and requested resolution to ${legalIdentity.contactEmail} so both sides can attempt to resolve the matter. This does not shorten or waive any statutory limitation period or right to seek urgent relief.`
        ]
      },
      {
        title: "17. General terms",
        text: [
          "If one provision is unenforceable, the remaining provisions continue to apply and the invalid provision will be limited to the minimum extent necessary. A failure to enforce a provision is not a waiver. Users may not assign this agreement without Hirevate's consent; Hirevate may assign it as part of a lawful reorganization, financing, or transfer of the service with appropriate notice and data safeguards.",
          "The Terms, Privacy Policy, Subscription Terms, applicable Refund Policy, and any plan details shown at purchase form the agreement for the service. If purchase-specific terms conflict with these general Terms, the clearer purchase-specific term controls for that transaction."
        ]
      },
      {
        title: "18. Changes to these Terms",
        text: [
          "Hirevate may update these Terms for legal, security, payment, provider, or product changes. The effective date will be updated. Material changes will receive reasonable advance notice where required, and continued use after the effective date constitutes acceptance where permitted by law. If a user does not accept a material change, the user may cancel before it takes effect."
        ]
      }
    ]
  },
  {
    slug: "subscription-terms",
    shortTitle: "Subscriptions",
    title: "Hirevate Subscription and Cancellation Terms",
    description: "Hirevate no-card trial terms, monthly and annual recurring billing, automatic renewal, cancellation, paid access, refunds, and price changes.",
    summary: "The free trial ends without an automatic charge; paid plans begin only after checkout and renew until the subscriber cancels.",
    sections: [
      {
        title: "Three-day trial",
        text: [
          "Eligible users receive one limited three-day trial when they create an account. No payment method is required, no paid subscription starts, and no charge is made.",
          "The trial ends automatically and does not convert to a paid plan. A courtesy reminder is scheduled approximately 24 hours before the trial ends, inviting the user to choose a monthly or annual membership. Continued access requires the user to actively select a plan and complete Stripe Checkout."
        ]
      },
      {
        title: "Plans and renewal",
        text: [pricingSummary, "Prices are stated in United States dollars. The selected price, currency, interval, and total charge are shown before payment. Stripe processes card details and recurring charges. A subscription renews monthly or annually until cancellation."]
      },
      {
        title: "Cancellation",
        text: ["The free trial needs no cancellation and ends without an automatic charge. A signed-in paid subscriber can open Subscription from the Account menu and select Cancel subscription. After a paid period starts, cancellation takes effect at the end of that period, with access continuing until then."]
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
        text: ["Resume-match scoring uses rules-based text comparison for role terms, skills, action language, and measurable outcomes in the browser. Job-to-resume generation runs only after a user submits a public job link or description, confirms the extracted role, chooses a template, and requests generation. Relevant inputs are then sent through Hirevate servers to the configured AI provider."]
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

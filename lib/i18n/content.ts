import type { SupportedLanguage } from "@/lib/i18n/config";

export const siteCopy = {
  en: {
    navigation: {
      findJobs: "Find Jobs",
      resume: "Resume",
      about: "About",
      guides: "Guides",
      jobTracker: "Job Tracker",
      coverLetter: "Cover Letter",
      dashboard: "Dashboard",
      users: "Users",
      admin: "Admin",
      login: "Log in",
      pricing: "Pricing"
    },
    account: {
      trigger: "Account",
      menuLabel: "Account menu",
      subscription: "Subscription",
      savedJobs: "Saved jobs",
      about: "About",
      guides: "Guides",
      logout: "Log out"
    },
    footer: {
      description:
        "Roles from company career pages, public ATS boards, and trusted hiring sources. No LinkedIn scraping, no auto-apply, no noisy boards.",
      productLinksLabel: "Product links",
      legalLinksLabel: "Legal links",
      legal: "Legal",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      cookiePolicy: "Cookie Policy",
      subscriptionTerms: "Subscription Terms",
      euRefundPolicy: "EU Refund Policy",
      links: {
        findJobs: "Find Jobs",
        latestJobs: "Latest Jobs",
        remoteJobs: "Remote Jobs",
        ukJobs: "UK Jobs",
        engineeringJobs: "Engineering Jobs",
        resume: "Resume",
        coverLetter: "Cover Letter",
        pricing: "Pricing",
        guides: "Guides",
        about: "About",
        login: "Login"
      }
    },
    cookies: {
      label: "Cookie preferences",
      message:
        "Hirevate uses essential cookies for sign-in and security. With permission, optional measurement helps count daily visitors and page views.",
      policy: "Cookie policy",
      essential: "Essential only",
      optional: "Allow optional"
    }
  },
  de: {
    navigation: {
      findJobs: "Jobs finden",
      resume: "Lebenslauf",
      about: "Über uns",
      guides: "Ratgeber",
      jobTracker: "Bewerbungs-Tracker",
      coverLetter: "Anschreiben",
      dashboard: "Dashboard",
      users: "Benutzer",
      admin: "Admin",
      login: "Anmelden",
      pricing: "Preise"
    },
    account: {
      trigger: "Konto",
      menuLabel: "Kontomenü",
      subscription: "Abonnement",
      savedJobs: "Gespeicherte Jobs",
      about: "Über uns",
      guides: "Ratgeber",
      logout: "Abmelden"
    },
    footer: {
      description:
        "Stellen aus Unternehmenskarriereseiten, öffentlichen ATS-Jobbörsen und vertrauenswürdigen Einstellungsquellen. Kein LinkedIn-Scraping, keine automatischen Bewerbungen und keine überladenen Jobbörsen.",
      productLinksLabel: "Produktlinks",
      legalLinksLabel: "Rechtliche Links",
      legal: "Rechtliches",
      privacyPolicy: "Datenschutzerklärung",
      termsOfService: "Nutzungsbedingungen",
      cookiePolicy: "Cookie-Richtlinie",
      subscriptionTerms: "Abonnementbedingungen",
      euRefundPolicy: "EU-Rückerstattungsrichtlinie",
      links: {
        findJobs: "Jobs finden",
        latestJobs: "Neueste Jobs",
        remoteJobs: "Remote-Jobs",
        ukJobs: "Jobs im Vereinigten Königreich",
        engineeringJobs: "Engineering-Jobs",
        resume: "Lebenslauf",
        coverLetter: "Anschreiben",
        pricing: "Preise",
        guides: "Ratgeber",
        about: "Über uns",
        login: "Anmelden"
      }
    },
    cookies: {
      label: "Cookie-Einstellungen",
      message:
        "Hirevate verwendet notwendige Cookies für Anmeldung und Sicherheit. Mit Ihrer Zustimmung hilft eine optionale Messung dabei, tägliche Besucher und Seitenaufrufe zu zählen.",
      policy: "Cookie-Richtlinie",
      essential: "Nur notwendige",
      optional: "Optionale erlauben"
    }
  }
} as const;

export const landingCopy = {
  en: {
    landingDescription:
      "Find fresh hidden jobs, build job-specific resumes and cover letters with secure AI assistance, and manage every application from interest to decision.",
    hero: {
      title: "Find hidden jobs and turn them into stronger applications",
      description:
        "Discover fresh roles from company career pages, public ATS boards, and trusted hiring sources. Then tailor your resume, write a focused cover letter, and manage every next step.",
      jobsCta: "Find fresh jobs",
      resumeCta: "Build my resume"
    },
    companies: {
      title: "Companies in current listings",
      description: "Company logos are drawn from jobs currently returned by the Hirevate index.",
      eyebrow: "Live company jobs",
      empty: "Current company listings will appear after the next successful job index refresh."
    },
    comparison: {
      crowdedTitle: "What crowded boards usually miss",
      crowdedItems: [
        "Fresh roles before they become heavily promoted everywhere.",
        "Clear freshness signals instead of recycled listings.",
        "Cleaner apply paths without social-feed noise.",
        "Resume, cover letter, and application planning connected to the search."
      ],
      hirevateTitle: "What Hirevate gives you instead",
      hirevateItems: [
        "Company career pages, public ATS boards, and trusted hiring sources.",
        "Search filters for role, company, location, work mode, and freshness.",
        "Neutral apply buttons that send users to the available hiring source.",
        "AI-assisted application writing and a lifecycle tracker with next actions."
      ]
    },
    workflow: {
      eyebrow: "One connected workflow",
      title: "From fresh job to final decision",
      description:
        "Hirevate connects discovery, application writing, and follow-up planning without auto-applying on your behalf.",
      steps: [
        {
          title: "Find a current role",
          description: "Search latest, remote, and category pages with source and freshness context.",
          cta: "Explore latest jobs"
        },
        {
          title: "Tailor the application",
          description: "Use professional resume templates, role targeting, and reviewable AI writing.",
          cta: "Open resume builder"
        },
        {
          title: "Run the follow-up plan",
          description: "Track stages, priorities, next actions, listing health, interviews, and outcomes.",
          cta: "Compare full-access plans"
        }
      ]
    },
    featuresTitle: "Built for focused job discovery",
    featuresDescription:
      "Search by title, location, remote preference, and freshness without adding noisy application tools.",
    features: [
      {
        title: "Fresh jobs",
        description:
          "Scan company career pages, public ATS boards, and trusted hiring sources for recently updated professional roles."
      },
      {
        title: "Verified apply paths",
        description:
          "See whether a role opens through an employer page, public ATS board, or verified hiring source."
      },
      {
        title: "Remote filters",
        description: "Filter for remote roles and locations without losing the direct source context."
      },
      {
        title: "Freshness score",
        description: "Rank roles by recency, location quality, apply URL presence, and role relevance."
      },
      {
        title: "AI application writing",
        description:
          "Improve resume summaries, experience bullets, and job-specific cover letters using only facts you provide."
      },
      {
        title: "Application command center",
        description:
          "Track stage, priority, next action, follow-ups, listing health, and outcomes in one pipeline."
      }
    ],
    explore: {
      title: "Explore fresh job paths",
      description:
        "Start with the public pages crawlers can understand: latest roles, remote roles, and focused category searches."
    },
    discoveryLinks: [
      {
        label: "Latest jobs",
        description: "Recently indexed roles from the public job database."
      },
      {
        label: "Remote jobs",
        description: "Remote roles from company career pages, public ATS boards, and trusted hiring sources."
      },
      {
        label: "Software engineer jobs",
        description: "Fresh engineering and software roles with clear apply-source labels."
      },
      {
        label: "Product manager jobs",
        description: "Product roles collected from company hiring pages and trusted hiring sources."
      },
      {
        label: "Data analyst jobs",
        description: "Analytics, BI, and data roles from public hiring sources."
      },
      {
        label: "Customer success jobs",
        description: "Customer-facing roles from employer and ATS sources."
      }
    ],
    workflowLinks: [
      {
        label: "Resume builder",
        description: "Choose from six professional templates, target a role, improve content with AI, and export to PDF."
      },
      {
        label: "Cover letter builder",
        description: "Create a focused live draft or a paid AI-assisted cover letter for a specific role."
      },
      {
        label: "Pricing",
        description: "Compare Hirevate daily, weekly, monthly, and annual paid plans."
      },
      {
        label: "About Hirevate",
        description: "Read product facts, source policy, pricing facts, and AI context."
      },
      {
        label: "Job search guides",
        description: "Use practical guides for hidden jobs, freshness, resumes, and tracking."
      },
      {
        label: "Compare Hirevate",
        description: "Read fact-checked comparisons with LinkedIn and Indeed."
      }
    ],
    pricing: {
      title: "Simple pricing for serious search",
      description:
        "Choose daily, weekly, monthly, or annual access for the complete job feed and career workflow tools.",
      cta: "View pricing",
      plans: {
        starter: { name: "Daily Plan", detail: "Billed daily. Cancel anytime." },
        silver: { name: "Weekly Plan", detail: "Billed weekly. Cancel anytime." },
        gold: { name: "Monthly Plan", detail: "About $5.75 per week." },
        platinum: { name: "Annual Plan", detail: "About $1.35 per week." }
      }
    },
    faqTitle: "FAQ",
    faqItems: [
      {
        question: "What is Hirevate?",
        answer:
          "Hirevate is a career workflow SaaS for finding fresh roles from company career pages, public ATS boards, and trusted hiring sources, then building targeted resumes, cover letters, and an application plan around those roles."
      },
      {
        question: "Who is Hirevate for?",
        answer:
          "Hirevate is for job seekers who want professional roles from cleaner hiring sources, including remote, engineering, product, data, customer success, sales, marketing, operations, and business roles."
      },
      {
        question: "What sources does Hirevate use?",
        answer:
          "Hirevate uses company career pages, public ATS job boards, public job discovery sources, and trusted hiring partners."
      },
      {
        question: "Does Hirevate scrape LinkedIn or Indeed?",
        answer:
          "No. Hirevate uses company career pages, public ATS boards, and trusted hiring sources, then sends you to the available apply source."
      },
      {
        question: "Can Hirevate auto-apply for me?",
        answer:
          "No. Hirevate helps you find roles and sends you to the available employer, ATS, or partner apply source."
      },
      {
        question: "What does freshness score mean?",
        answer: "It combines recent updates, location completeness, apply URL availability, and role relevance."
      },
      {
        question: "How does Hirevate use AI for applications?",
        answer:
          "Paid users can ask Hirevate to improve resume summaries and experience bullets or draft a job-specific cover letter. The AI is instructed to use only user-provided facts, and every suggestion should be reviewed before applying."
      },
      {
        question: "What happens when a tracked job listing closes?",
        answer:
          "Hirevate marks linked listings as closed or unavailable while preserving the application stage, notes, next actions, and history until the user archives or deletes the record."
      }
    ],
    preview: {
      emptyTitle: "Fresh jobs are being indexed",
      emptyCompany: "Hirevate public job index",
      emptyLocation: "Browse the latest available roles",
      verifiedSource: "Verified source",
      companyFallback: "Company",
      locationFallback: "Location not listed",
      title: "Hidden jobs feed",
      subtitle: "Public sources - sorted by freshness",
      verified: "Fresh Verified",
      searchTerm: "Backend engineer",
      search: "Search",
      score: "Score",
      apply: "Apply now"
    }
  },
  de: {
    landingDescription:
      "Finden Sie aktuelle versteckte Stellen, erstellen Sie mit sicherer KI-Unterstützung passende Lebensläufe und Anschreiben und verwalten Sie jede Bewerbung bis zur Entscheidung.",
    hero: {
      title: "Versteckte Stellen finden und überzeugendere Bewerbungen daraus machen",
      description:
        "Entdecken Sie aktuelle Stellen auf Unternehmenskarriereseiten, öffentlichen ATS-Jobbörsen und vertrauenswürdigen Einstellungsquellen. Passen Sie anschließend Ihren Lebenslauf an, schreiben Sie ein gezieltes Anschreiben und verwalten Sie jeden nächsten Schritt.",
      jobsCta: "Aktuelle Jobs finden",
      resumeCta: "Lebenslauf erstellen"
    },
    companies: {
      title: "Unternehmen in aktuellen Stellenanzeigen",
      description: "Die Firmenlogos stammen aus Jobs, die derzeit im Hirevate-Index enthalten sind.",
      eyebrow: "Aktuelle Unternehmensjobs",
      empty: "Aktuelle Unternehmensstellen erscheinen nach der nächsten erfolgreichen Aktualisierung des Jobindex."
    },
    comparison: {
      crowdedTitle: "Was überfüllte Jobbörsen häufig übersehen",
      crowdedItems: [
        "Aktuelle Stellen, bevor sie überall stark beworben werden.",
        "Klare Aktualitätssignale statt wiederverwerteter Anzeigen.",
        "Direktere Bewerbungswege ohne Ablenkung durch soziale Feeds.",
        "Lebenslauf, Anschreiben und Bewerbungsplanung direkt mit der Suche verbunden."
      ],
      hirevateTitle: "Was Hirevate Ihnen stattdessen bietet",
      hirevateItems: [
        "Unternehmenskarriereseiten, öffentliche ATS-Jobbörsen und vertrauenswürdige Einstellungsquellen.",
        "Suchfilter für Position, Unternehmen, Standort, Arbeitsmodell und Aktualität.",
        "Neutrale Bewerbungsbuttons, die zur verfügbaren Einstellungsquelle führen.",
        "KI-gestütztes Bewerbungsschreiben und ein Bewerbungs-Tracker mit nächsten Schritten."
      ]
    },
    workflow: {
      eyebrow: "Ein durchgängiger Ablauf",
      title: "Von der aktuellen Stelle bis zur endgültigen Entscheidung",
      description:
        "Hirevate verbindet Stellensuche, Bewerbungserstellung und Nachfassplanung, ohne sich automatisch in Ihrem Namen zu bewerben.",
      steps: [
        {
          title: "Eine aktuelle Stelle finden",
          description: "Durchsuchen Sie neue, remote und kategorisierte Stellen mit Quellen- und Aktualitätsangaben.",
          cta: "Neueste Jobs ansehen"
        },
        {
          title: "Bewerbung anpassen",
          description: "Nutzen Sie professionelle Lebenslaufvorlagen, Stellenausrichtung und überprüfbare KI-Texte.",
          cta: "Lebenslauf-Builder öffnen"
        },
        {
          title: "Nachfassplan verwalten",
          description: "Verfolgen Sie Phasen, Prioritäten, nächste Schritte, Anzeigenstatus, Gespräche und Ergebnisse.",
          cta: "Tarife mit Vollzugriff vergleichen"
        }
      ]
    },
    featuresTitle: "Für eine fokussierte Jobsuche entwickelt",
    featuresDescription:
      "Suchen Sie nach Titel, Standort, Remote-Präferenz und Aktualität – ohne unnötig überladene Bewerbungstools.",
    features: [
      {
        title: "Aktuelle Jobs",
        description:
          "Durchsuchen Sie Unternehmenskarriereseiten, öffentliche ATS-Jobbörsen und vertrauenswürdige Einstellungsquellen nach kürzlich aktualisierten Stellen."
      },
      {
        title: "Geprüfte Bewerbungswege",
        description:
          "Erkennen Sie, ob eine Stelle über eine Arbeitgeberseite, eine öffentliche ATS-Jobbörse oder eine geprüfte Einstellungsquelle geöffnet wird."
      },
      {
        title: "Remote-Filter",
        description: "Filtern Sie Remote-Stellen und Standorte, ohne den direkten Quellenkontext zu verlieren."
      },
      {
        title: "Aktualitätsbewertung",
        description: "Sortieren Sie Stellen nach Aktualität, Standortqualität, Bewerbungslink und Relevanz."
      },
      {
        title: "KI-gestützte Bewerbungstexte",
        description:
          "Verbessern Sie Lebenslaufprofile, Erfahrungsbeschreibungen und stellenbezogene Anschreiben ausschließlich mit Ihren Angaben."
      },
      {
        title: "Bewerbungszentrale",
        description:
          "Verfolgen Sie Phase, Priorität, nächste Aktion, Nachfasspunkte, Anzeigenstatus und Ergebnisse in einer Pipeline."
      }
    ],
    explore: {
      title: "Aktuelle Jobbereiche entdecken",
      description:
        "Beginnen Sie mit den öffentlichen Seiten, die Suchmaschinen verstehen: neueste Stellen, Remote-Stellen und fokussierte Kategoriesuchen."
    },
    discoveryLinks: [
      {
        label: "Neueste Jobs",
        description: "Kürzlich indexierte Stellen aus der öffentlichen Jobdatenbank."
      },
      {
        label: "Remote-Jobs",
        description: "Remote-Stellen von Unternehmenskarriereseiten, öffentlichen ATS-Jobbörsen und vertrauenswürdigen Quellen."
      },
      {
        label: "Jobs für Softwareentwickler",
        description: "Aktuelle Engineering- und Softwarestellen mit klarer Kennzeichnung der Bewerbungsquelle."
      },
      {
        label: "Jobs für Product Manager",
        description: "Produktstellen von Unternehmenskarriereseiten und vertrauenswürdigen Einstellungsquellen."
      },
      {
        label: "Jobs für Datenanalysten",
        description: "Stellen in Analytics, BI und Datenanalyse aus öffentlichen Einstellungsquellen."
      },
      {
        label: "Customer-Success-Jobs",
        description: "Kundennahe Stellen von Arbeitgebern und ATS-Quellen."
      }
    ],
    workflowLinks: [
      {
        label: "Lebenslauf-Builder",
        description: "Wählen Sie aus sechs professionellen Vorlagen, richten Sie Inhalte auf eine Stelle aus, verbessern Sie sie mit KI und exportieren Sie als PDF."
      },
      {
        label: "Anschreiben-Builder",
        description: "Erstellen Sie einen fokussierten Entwurf oder ein kostenpflichtiges, KI-gestütztes Anschreiben für eine bestimmte Stelle."
      },
      {
        label: "Preise",
        description: "Vergleichen Sie die täglichen, wöchentlichen, monatlichen und jährlichen Hirevate-Tarife."
      },
      {
        label: "Über Hirevate",
        description: "Lesen Sie Produktfakten, Quellenrichtlinien, Preisdetails und KI-Kontext."
      },
      {
        label: "Ratgeber zur Jobsuche",
        description: "Nutzen Sie praktische Ratgeber zu versteckten Jobs, Aktualität, Lebensläufen und Tracking."
      },
      {
        label: "Hirevate vergleichen",
        description: "Lesen Sie faktengeprüfte Vergleiche mit LinkedIn und Indeed."
      }
    ],
    pricing: {
      title: "Einfache Preise für eine ernsthafte Jobsuche",
      description:
        "Wählen Sie täglichen, wöchentlichen, monatlichen oder jährlichen Zugriff auf den vollständigen Jobfeed und alle Karriere-Workflow-Tools.",
      cta: "Preise ansehen",
      plans: {
        starter: { name: "Tagestarif", detail: "Tägliche Abrechnung. Jederzeit kündbar." },
        silver: { name: "Wochentarif", detail: "Wöchentliche Abrechnung. Jederzeit kündbar." },
        gold: { name: "Monatstarif", detail: "Etwa 5,75 $ pro Woche." },
        platinum: { name: "Jahrestarif", detail: "Etwa 1,35 $ pro Woche." }
      }
    },
    faqTitle: "Häufige Fragen",
    faqItems: [
      {
        question: "Was ist Hirevate?",
        answer:
          "Hirevate ist eine SaaS-Plattform für den Bewerbungsprozess. Sie findet aktuelle Stellen auf Unternehmenskarriereseiten, öffentlichen ATS-Jobbörsen und vertrauenswürdigen Quellen und verbindet diese mit passenden Lebensläufen, Anschreiben und einem Bewerbungsplan."
      },
      {
        question: "Für wen ist Hirevate gedacht?",
        answer:
          "Hirevate richtet sich an Jobsuchende, die professionelle Stellen aus übersichtlicheren Einstellungsquellen suchen – unter anderem in Remote-Arbeit, Engineering, Produkt, Daten, Customer Success, Vertrieb, Marketing, Operations und Business."
      },
      {
        question: "Welche Quellen nutzt Hirevate?",
        answer:
          "Hirevate nutzt Unternehmenskarriereseiten, öffentliche ATS-Jobbörsen, öffentliche Jobquellen und vertrauenswürdige Einstellungspartner."
      },
      {
        question: "Durchsucht Hirevate LinkedIn oder Indeed?",
        answer:
          "Nein. Hirevate nutzt Unternehmenskarriereseiten, öffentliche ATS-Jobbörsen und vertrauenswürdige Quellen und leitet Sie anschließend zur verfügbaren Bewerbungsquelle weiter."
      },
      {
        question: "Kann Hirevate sich automatisch für mich bewerben?",
        answer:
          "Nein. Hirevate hilft Ihnen, Stellen zu finden, und leitet Sie zur verfügbaren Arbeitgeber-, ATS- oder Partnerquelle weiter."
      },
      {
        question: "Was bedeutet die Aktualitätsbewertung?",
        answer: "Sie kombiniert aktuelle Änderungen, vollständige Standortangaben, verfügbare Bewerbungslinks und Stellenrelevanz."
      },
      {
        question: "Wie verwendet Hirevate KI für Bewerbungen?",
        answer:
          "Zahlende Nutzer können mit Hirevate Lebenslaufprofile und Erfahrungsbeschreibungen verbessern oder ein stellenbezogenes Anschreiben entwerfen. Die KI darf nur die vom Nutzer bereitgestellten Fakten verwenden; jeder Vorschlag sollte vor der Bewerbung geprüft werden."
      },
      {
        question: "Was passiert, wenn eine verfolgte Stellenanzeige geschlossen wird?",
        answer:
          "Hirevate markiert verknüpfte Anzeigen als geschlossen oder nicht verfügbar und bewahrt Bewerbungsphase, Notizen, nächste Schritte und Verlauf auf, bis der Nutzer den Eintrag archiviert oder löscht."
      }
    ],
    preview: {
      emptyTitle: "Aktuelle Jobs werden indexiert",
      emptyCompany: "Öffentlicher Hirevate-Jobindex",
      emptyLocation: "Neueste verfügbare Stellen durchsuchen",
      verifiedSource: "Geprüfte Quelle",
      companyFallback: "Unternehmen",
      locationFallback: "Kein Standort angegeben",
      title: "Feed mit versteckten Jobs",
      subtitle: "Öffentliche Quellen – nach Aktualität sortiert",
      verified: "Aktuell und geprüft",
      searchTerm: "Backend-Entwickler",
      search: "Suchen",
      score: "Bewertung",
      apply: "Jetzt bewerben"
    }
  }
} as const;

export function getSiteCopy(language: SupportedLanguage) {
  return siteCopy[language];
}

export function getLandingCopy(language: SupportedLanguage) {
  return landingCopy[language];
}

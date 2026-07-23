import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  FileText,
  Search,
  Sparkles,
  Target
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { swedishShowcaseCopy } from "@/lib/i18n/swedish";

const showcaseCopy = {
  en: {
    eyebrow: "See Hirevate in action",
    title: "Three tools. One focused job-search system.",
    description:
      "Preview how Hirevate helps you discover current roles, organize every application, and turn your experience into a polished resume.",
    demoLabel: "7 sec preview",
    features: [
      {
        key: "jobs",
        number: "01",
        label: "Find jobs",
        title: "Find fresh roles without the crowded-board noise",
        description:
          "Search company career pages, public ATS boards, and trusted hiring sources with clear freshness, location, salary, and apply-path signals.",
        bullets: ["Role and location filters", "Freshness and source context", "Direct, verified apply paths"],
        cta: "Explore fresh jobs",
        href: "/jobs#results",
        previewTitle: "Hidden jobs feed"
      },
      {
        key: "tracker",
        number: "02",
        label: "Job tracker",
        title: "Know the next move for every application",
        description:
          "Keep stages, priorities, follow-up dates, listing health, and next actions together from first interest through interview and decision.",
        bullets: ["Application-stage pipeline", "Follow-up reminders", "Progress and outcome signals"],
        cta: "Open job tracker",
        href: "/account/job-tracker",
        previewTitle: "Application command center"
      },
      {
        key: "resume",
        number: "03",
        label: "Resume templates",
        title: "Build a resume that looks ready before you export",
        description:
          "Choose from six professional templates, target a specific role, review keyword coverage, and create a clean print-ready PDF.",
        bullets: ["Six professional layouts", "ATS-friendly structure", "Role targeting and PDF export"],
        cta: "See resume templates",
        href: "/resume-builder",
        previewTitle: "Resume studio"
      }
    ]
  },
  sv: swedishShowcaseCopy,
  de: {
    eyebrow: "Hirevate in Aktion",
    title: "Drei Werkzeuge. Ein fokussiertes System für Ihre Jobsuche.",
    description:
      "Sehen Sie, wie Hirevate aktuelle Stellen findet, Bewerbungen organisiert und Ihre Erfahrung in einen professionellen Lebenslauf verwandelt.",
    demoLabel: "7-Sek.-Vorschau",
    features: [
      {
        key: "jobs",
        number: "01",
        label: "Jobs finden",
        title: "Aktuelle Stellen ohne den Lärm überfüllter Jobbörsen",
        description:
          "Durchsuchen Sie Karriereseiten, öffentliche ATS-Jobbörsen und vertrauenswürdige Quellen mit klaren Angaben zu Aktualität, Standort, Gehalt und Bewerbungsweg.",
        bullets: ["Filter für Position und Standort", "Aktualitäts- und Quellenkontext", "Direkte, geprüfte Bewerbungswege"],
        cta: "Aktuelle Jobs entdecken",
        href: "/jobs#results",
        previewTitle: "Feed mit versteckten Jobs"
      },
      {
        key: "tracker",
        number: "02",
        label: "Bewerbungs-Tracker",
        title: "Den nächsten Schritt jeder Bewerbung kennen",
        description:
          "Verwalten Sie Phasen, Prioritäten, Nachfassdaten, Anzeigenstatus und nächste Aktionen vom ersten Interesse bis zur Entscheidung.",
        bullets: ["Pipeline für Bewerbungsphasen", "Erinnerungen zum Nachfassen", "Fortschritts- und Ergebnissignale"],
        cta: "Bewerbungs-Tracker öffnen",
        href: "/account/job-tracker",
        previewTitle: "Bewerbungszentrale"
      },
      {
        key: "resume",
        number: "03",
        label: "Lebenslaufvorlagen",
        title: "Einen Lebenslauf erstellen, der vor dem Export überzeugt",
        description:
          "Wählen Sie aus sechs professionellen Vorlagen, richten Sie Inhalte auf eine Stelle aus, prüfen Sie Schlüsselwörter und exportieren Sie ein sauberes PDF.",
        bullets: ["Sechs professionelle Layouts", "ATS-freundliche Struktur", "Stellenausrichtung und PDF-Export"],
        cta: "Lebenslaufvorlagen ansehen",
        href: "/resume-builder",
        previewTitle: "Lebenslauf-Studio"
      }
    ]
  }
} as const;

type ShowcaseFeature = (typeof showcaseCopy.en.features)[number];

function DemoFrame({
  children,
  label,
  title
}: {
  children: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <div className="product-demo group relative overflow-hidden rounded-[26px] border border-white/15 bg-white shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>
          <span className="truncate text-xs font-semibold text-ink-700 sm:text-sm">{title}</span>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function JobsDemo() {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="product-demo-scan pointer-events-none absolute inset-x-8 top-20 h-16 rounded-full bg-blue-200/30 blur-2xl" />
      <div className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs text-ink-500 sm:text-sm">
            <Search className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Product designer
          </div>
          <div className="flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white sm:text-sm">
            Search jobs
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="blue">Remote</Badge>
          <Badge>Past 7 days</Badge>
          <Badge>Freshest first</Badge>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-[1fr_0.74fr]">
        <div className="product-demo-job-card rounded-xl border border-blue-100 bg-white p-4 shadow-[0_16px_35px_rgba(37,99,235,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">
                  NS
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Senior Product Designer</p>
                  <p className="text-[11px] text-ink-500">Northstar · Remote</p>
                </div>
              </div>
            </div>
            <Badge tone="green">96 fresh</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium text-ink-500">
            <span className="rounded-md bg-gray-50 px-2 py-1.5">$115k–$145k</span>
            <span className="rounded-md bg-gray-50 px-2 py-1.5">Design systems</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified ATS
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
              Apply now <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">Matches</p>
            <p className="mt-1 text-xl font-semibold text-ink-900">248</p>
            <p className="mt-1 text-[10px] text-emerald-700">+31 this week</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">Sources</p>
            <p className="mt-1 text-xl font-semibold text-ink-900">12</p>
            <p className="mt-1 text-[10px] text-ink-500">Employer + ATS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackerCard({
  company,
  focus,
  role,
  tone
}: {
  company: string;
  focus?: boolean;
  role: string;
  tone: "blue" | "green" | "amber";
}) {
  const toneClasses = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-400"
  };

  return (
    <div
      className={`rounded-lg border bg-white p-2.5 shadow-sm ${
        focus ? "product-demo-tracker-focus border-blue-200" : "border-gray-200"
      }`}
    >
      <span className={`block h-1 w-7 rounded-full ${toneClasses[tone]}`} />
      <p className="mt-2 text-[11px] font-semibold leading-4 text-ink-900">{role}</p>
      <p className="mt-0.5 text-[9px] text-ink-500">{company}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${toneClasses[tone]}`} style={{ width: focus ? "78%" : "48%" }} />
      </div>
    </div>
  );
}

function TrackerDemo() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 sm:p-6">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Tracked", "12"],
          ["Follow-ups", "3"],
          ["Interview rate", "24%"]
        ].map(([label, value]) => (
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" key={label}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-500">{label}</p>
            <p className="mt-1 text-base font-semibold text-ink-900 sm:text-xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white/80 p-2.5 shadow-sm sm:gap-3 sm:p-4">
        {[
          {
            title: "Interested",
            count: "4",
            cards: [<TrackerCard company="Aperture" key="a" role="UX Researcher" tone="blue" />]
          },
          {
            title: "Applied",
            count: "5",
            cards: [
              <TrackerCard company="Northstar" focus key="b" role="Product Designer" tone="amber" />,
              <TrackerCard company="Orbit" key="c" role="Design Lead" tone="blue" />
            ]
          },
          {
            title: "Interview",
            count: "3",
            cards: [<TrackerCard company="Vertex" key="d" role="Senior UX Designer" tone="green" />]
          }
        ].map((column) => (
          <div className="min-w-0" key={column.title}>
            <div className="mb-2 flex items-center justify-between gap-1">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-500 sm:text-[10px]">
                {column.title}
              </p>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-semibold text-ink-500">
                {column.count}
              </span>
            </div>
            <div className="space-y-2">{column.cards}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
        <CalendarClock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-amber-950">Follow-up due today</p>
          <p className="truncate text-[9px] text-amber-800">Send portfolio note to Northstar recruiter</p>
        </div>
      </div>
    </div>
  );
}

function ResumeDemo() {
  return (
    <div className="grid grid-cols-[0.6fr_1.4fr] gap-3 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-4 sm:gap-5 sm:p-6">
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-700">Templates</p>
        </div>
        {[
          ["Precision", "Most roles"],
          ["Modern", "Product + tech"],
          ["Executive", "Leadership"]
        ].map(([name, detail], index) => (
          <div
            className={`rounded-lg border p-2.5 ${
              index === 1
                ? "product-demo-template-choice border-blue-300 bg-blue-50 shadow-sm"
                : "border-gray-200 bg-white"
            }`}
            key={name}
          >
            <p className="text-[10px] font-semibold text-ink-900 sm:text-[11px]">{name}</p>
            <p className="mt-0.5 text-[8px] text-ink-500 sm:text-[9px]">{detail}</p>
          </div>
        ))}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] font-semibold uppercase text-emerald-800">ATS score</span>
            <span className="text-xs font-bold text-emerald-800">92</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-emerald-100">
            <div className="product-demo-resume-score h-full rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="product-demo-resume-page relative overflow-hidden rounded-md border border-gray-200 border-l-[5px] border-l-brand-600 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.15)] sm:p-5">
        <div className="product-demo-resume-shine pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-blue-100/60 to-transparent" />
        <div className="relative grid grid-cols-[0.68fr_1.32fr] gap-3">
          <div className="border-r border-gray-100 pr-3">
            <div className="h-2.5 w-16 rounded bg-slate-900" />
            <div className="mt-1.5 h-1.5 w-12 rounded bg-blue-500" />
            <div className="mt-4 h-1.5 w-8 rounded bg-slate-700" />
            <div className="mt-2 space-y-1.5">
              <div className="h-1 w-full rounded bg-gray-200" />
              <div className="h-1 w-4/5 rounded bg-gray-200" />
              <div className="h-1 w-3/5 rounded bg-gray-200" />
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {["React", "Figma", "A11y", "UX"].map((skill) => (
                <span className="rounded bg-gray-100 px-1.5 py-1 text-[7px] font-medium text-ink-500" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Target className="h-3 w-3 text-brand-600" aria-hidden="true" />
              <div className="h-1.5 w-16 rounded bg-slate-700" />
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1 w-full rounded bg-gray-200" />
              <div className="h-1 w-full rounded bg-gray-200" />
              <div className="h-1 w-4/5 rounded bg-gray-200" />
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3 w-3 text-brand-600" aria-hidden="true" />
              <div className="h-1.5 w-20 rounded bg-slate-700" />
            </div>
            <div className="mt-2 space-y-2.5">
              {["Northstar Labs", "Brightlane"].map((company, index) => (
                <div key={company}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[7px] font-bold text-ink-700">{company}</span>
                    <span className="text-[6px] text-ink-500">{index ? "2019–2022" : "2022–Now"}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <div className="h-1 w-full rounded bg-gray-200" />
                    <div className="h-1 w-5/6 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-700">
            <Check className="h-2.5 w-2.5" aria-hidden="true" /> ATS-ready
          </span>
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-brand-700">
            <FileText className="h-2.5 w-2.5" aria-hidden="true" /> PDF export
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureDemo({ feature }: { feature: ShowcaseFeature }) {
  if (feature.key === "jobs") return <JobsDemo />;
  if (feature.key === "tracker") return <TrackerDemo />;
  return <ResumeDemo />;
}

export function ProductShowcase({ language }: { language: SupportedLanguage }) {
  const copy = showcaseCopy[language];

  return (
    <section
      aria-labelledby="product-showcase-title"
      className="below-fold-section relative overflow-hidden bg-[#07111f] py-20 text-white sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -right-24 bottom-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="container-shell relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">{copy.eyebrow}</p>
          <h2 id="product-showcase-title" className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            {copy.description}
          </p>
        </div>

        <div className="mt-16 space-y-20 lg:mt-24 lg:space-y-28">
          {copy.features.map((feature, index) => (
            <article className="grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16" key={feature.key}>
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-blue-300">{feature.number}</span>
                  <span className="h-px w-8 bg-blue-400/50" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {feature.label}
                  </span>
                </div>
                <h3 className="mt-5 text-3xl font-semibold leading-tight text-white">{feature.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-300">{feature.description}</p>
                <ul className="mt-6 space-y-3">
                  {feature.bullets.map((bullet) => (
                    <li className="flex items-center gap-3 text-sm text-slate-200" key={bullet}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
                  href={feature.href}
                >
                  {feature.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                <DemoFrame label={copy.demoLabel} title={feature.previewTitle}>
                  <FeatureDemo feature={feature as ShowcaseFeature} />
                </DemoFrame>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

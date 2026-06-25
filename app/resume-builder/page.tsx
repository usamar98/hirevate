import type { Metadata } from "next";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo";

const resumeBuilderDescription =
  "Build an ATS-friendly, role-targeted resume with keyword coverage, impact suggestions, templates, and print-ready export.";

export const metadata: Metadata = {
  title: "Resume Builder",
  description: resumeBuilderDescription,
  alternates: {
    canonical: "/resume-builder"
  },
  openGraph: {
    title: "Resume Builder",
    description: resumeBuilderDescription,
    url: "/resume-builder"
  },
  twitter: {
    title: "Resume Builder",
    description: resumeBuilderDescription
  }
};

export default async function ResumeBuilderPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Hirevate Resume Builder",
          url: absoluteUrl("/resume-builder"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: resumeBuilderDescription,
          offers: {
            "@type": "Offer",
            name: "Resume builder testing-mode export",
            price: "0",
            priceCurrency: "USD"
          }
        }}
      />
      <ResumeBuilder />
    </>
  );
}

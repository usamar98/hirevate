import Image from "next/image";

const adzunaLogoUrl =
  "https://zunastatic-abf.kxcdn.com/assets/images/press/adzuna_logo/adzuna_logo.jpg";

function getAdzunaCountryUrl(externalId: string) {
  const country = externalId.split(":")[1]?.toLowerCase();

  if (country === "au") return "https://www.adzuna.com.au/";
  if (country === "ca") return "https://www.adzuna.ca/";
  if (country === "gb") return "https://www.adzuna.co.uk/";
  return "https://www.adzuna.com/";
}

export function JobSourceAttribution({
  externalId,
  source
}: {
  externalId: string;
  source: string | null;
}) {
  if (source !== "adzuna") return null;

  return (
    <a
      aria-label="Jobs by Adzuna"
      className="inline-flex min-h-[23px] min-w-[116px] items-center gap-1.5 rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-600 hover:border-brand-200"
      href={getAdzunaCountryUrl(externalId)}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span>Jobs by</span>
      <Image alt="Adzuna" height={16} src={adzunaLogoUrl} width={63} />
    </a>
  );
}

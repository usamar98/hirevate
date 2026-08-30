const supportedAdzunaCountries = new Set([
  "au", "at", "be", "br", "ca", "ch", "de", "es", "fr", "gb",
  "in", "it", "mx", "nl", "nz", "pl", "sg", "us", "za"
]);

export function normalizeAdzunaCountry(value: string) {
  const country = value.trim().toLowerCase();
  return supportedAdzunaCountries.has(country) ? country : null;
}

export function resolveAdzunaCountries(countries: string, legacyCountry: string) {
  const configured = countries
    .split(/[,.\n;\s]+/)
    .map(normalizeAdzunaCountry)
    .filter((country): country is string => Boolean(country));
  const fallback = [normalizeAdzunaCountry(legacyCountry), "au", "es"].filter(
    (country): country is string => Boolean(country)
  );

  // Preserve an explicit provider-market allowlist. Existing deployments that set
  // ADZUNA_COUNTRIES must add es to enable Spain; new configurations include it.
  return Array.from(new Set(configured.length > 0 ? configured : fallback)).sort(
    (left, right) => {
      if (left === "au") return -1;
      if (right === "au") return 1;
      return left.localeCompare(right);
    }
  );
}

const spanishSearchTerms: Record<string, string> = {
  "remote jobs": "teletrabajo",
  "software engineer": "desarrollador software",
  "data analyst": "analista de datos",
  "product manager": "responsable de producto",
  "project manager": "jefe de proyecto",
  "business analyst": "analista de negocio",
  "marketing manager": "responsable de marketing",
  "sales representative": "comercial",
  "customer success": "atención al cliente",
  "operations manager": "responsable de operaciones",
  designer: "diseñador",
  "finance analyst": "analista financiero",
  "account executive": "ejecutivo de cuentas",
  "human resources": "recursos humanos",
  "cybersecurity analyst": "ciberseguridad",
  "devops engineer": "ingeniero devops",
  "administrative assistant": "administrativo",
  "customer support": "soporte al cliente",
  "healthcare jobs": "sanidad",
  "warehouse supervisor": "responsable de almacén"
};

export function getAdzunaMarketQueries(queries: string[], country: string) {
  if (country !== "es") return queries;

  // Mix Spanish and English titles within the same bounded request budget.
  // Unrecognised/custom terms are preserved exactly; listing text is not translated.
  return Array.from(new Set(queries.map((query, index) => (
    index % 2 === 0 ? spanishSearchTerms[query.toLowerCase()] ?? query : query
  ))));
}

export function qualifyAdzunaLocation(location: string | null, country?: string) {
  if (country === "es") {
    if (!location) return "Spain";
    return /\b(?:spain|espa[ñn]a)\b/i.test(location) ? location : `${location}, Spain`;
  }

  if (country === "au" && location && !/\baustralia\b/i.test(location)) {
    return `${location}, Australia`;
  }

  return location;
}

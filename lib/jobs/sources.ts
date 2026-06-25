export function getJobSourceLabel(source: string | null | undefined) {
  if (source === "serpapi") return "Google Jobs";
  if (source === "adzuna") return "Adzuna";
  if (source === "greenhouse") return "Greenhouse";
  return "Hiring source";
}

export function getJobSourceDescription(source: string | null | undefined) {
  if (source === "serpapi") {
    return "Open the application page provided by Google Jobs.";
  }

  if (source === "adzuna") {
    return "Open the application page provided by Adzuna.";
  }

  return "Open the official company application page from the hiring source.";
}

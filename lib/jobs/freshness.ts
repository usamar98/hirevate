const SOFTWARE_KEYWORDS = [
  "software",
  "dev",
  "engineer",
  "frontend",
  "backend",
  "fullstack",
  "full-stack",
  "ai",
  "data"
];

export function calculateFreshnessScore({
  applyUrl,
  location,
  sourceUrl,
  title,
  updatedAt
}: {
  applyUrl?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  title: string;
  updatedAt?: string | null;
}) {
  let score = 50;

  if (updatedAt) {
    const updated = new Date(updatedAt);
    const ageMs = Date.now() - updated.getTime();
    if (Number.isFinite(ageMs) && ageMs <= 7 * 86_400_000) {
      score += 25;
    }
  }

  if (location) score += 15;
  if (applyUrl || sourceUrl) score += 10;

  const normalizedTitle = title.toLowerCase();
  if (SOFTWARE_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword))) {
    score += 10;
  }

  return Math.min(score, 100);
}

export function getFreshnessLabel(score: number) {
  if (score >= 90) return "Fresh Verified";
  if (score >= 70) return "Good";
  if (score >= 50) return "Normal";
  return "Maybe Stale";
}

export function getFreshnessTone(score: number): "green" | "blue" | "amber" | "gray" {
  if (score >= 90) return "green";
  if (score >= 70) return "blue";
  if (score >= 50) return "amber";
  return "gray";
}

export function inferRemoteType(title: string, location?: string | null) {
  const text = `${title} ${location ?? ""}`.toLowerCase();
  if (text.includes("remote")) return "remote";
  if (text.includes("hybrid")) return "hybrid";
  return "onsite";
}

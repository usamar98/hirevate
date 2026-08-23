export function calculateFreshnessScore({
  applyUrl,
  location,
  sourceUrl,
  updatedAt
}: {
  applyUrl?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  title: string;
  updatedAt?: string | null;
}) {
  let score = 40;

  if (updatedAt) {
    const updated = new Date(updatedAt);
    const ageMs = Date.now() - updated.getTime();
    if (Number.isFinite(ageMs)) {
      if (ageMs <= 86_400_000) score += 40;
      else if (ageMs <= 3 * 86_400_000) score += 30;
      else if (ageMs <= 7 * 86_400_000) score += 20;
      else if (ageMs <= 14 * 86_400_000) score += 10;
    }
  }

  if (location) score += 10;
  if (applyUrl || sourceUrl) score += 10;

  return Math.min(score, 100);
}

export function getFreshnessLabel(score: number) {
  if (score >= 90) return "Strong freshness";
  if (score >= 70) return "Good signals";
  if (score >= 50) return "Limited signals";
  return "Review source";
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

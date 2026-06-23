import { Badge } from "@/components/ui/badge";
import { getFreshnessLabel, getFreshnessTone } from "@/lib/jobs/freshness";

export function FreshnessBadge({ score }: { score: number }) {
  return (
    <Badge tone={getFreshnessTone(score)}>
      {getFreshnessLabel(score)} · {score}
    </Badge>
  );
}

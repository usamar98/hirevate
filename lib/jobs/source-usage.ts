import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SearchReservation = {
  allowed: boolean;
  searchesRemaining: number;
  searchesUsed: number;
  setupRequired?: boolean;
};

function getCurrentMonthIso() {
  return new Date().toISOString().slice(0, 7) + "-01";
}

function isMissingUsageSchema(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST202" ||
    error?.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

export async function getSourceUsage(source: string, monthlyLimit: number): Promise<Omit<SearchReservation, "allowed">> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      searchesRemaining: monthlyLimit,
      searchesUsed: 0
    };
  }

  const { data, error } = await supabase
    .from("job_source_usage")
    .select("searches_used")
    .eq("source", source)
    .eq("period_month", getCurrentMonthIso())
    .maybeSingle();

  if (error) {
    return {
      searchesRemaining: monthlyLimit,
      searchesUsed: 0,
      setupRequired: isMissingUsageSchema(error)
    };
  }

  const searchesUsed = data?.searches_used ?? 0;
  return {
    searchesRemaining: Math.max(monthlyLimit - searchesUsed, 0),
    searchesUsed
  };
}

export async function reserveSourceSearch(
  source: string,
  monthlyLimit: number,
  reserveCount = 1
): Promise<SearchReservation> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      allowed: false,
      searchesRemaining: monthlyLimit,
      searchesUsed: 0
    };
  }

  const { data, error } = await supabase.rpc("reserve_job_source_searches", {
    source_name: source,
    monthly_limit: monthlyLimit,
    reserve_count: reserveCount
  });

  if (error) {
    const usage = await getSourceUsage(source, monthlyLimit);
    return {
      allowed: false,
      searchesRemaining: usage.searchesRemaining,
      searchesUsed: usage.searchesUsed,
      setupRequired: isMissingUsageSchema(error) || usage.setupRequired
    };
  }

  const reservation = data?.[0];
  if (!reservation) {
    return {
      allowed: false,
      searchesRemaining: monthlyLimit,
      searchesUsed: 0
    };
  }

  return {
    allowed: reservation.allowed,
    searchesRemaining: reservation.searches_remaining,
    searchesUsed: reservation.searches_used
  };
}

import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { getSavedJobs } from "@/lib/jobs/queries";
import { getProfile, isPaidSubscription, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Saved Jobs",
  robots: {
    index: false,
    follow: false
  }
};

export default async function SavedJobsPage() {
  const user = await requireUser();
  const [savedJobs, profile] = await Promise.all([
    getSavedJobs(user.id),
    getProfile(user.id)
  ]);
  const isPaid = isPaidSubscription(profile?.subscription_status);
  const validSavedJobs = savedJobs.filter((item) => item.jobs);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell">
        <div>
          <h1 className="text-4xl font-semibold text-ink-900">Saved jobs</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
            Return to roles you want to review or apply to from the available source.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          {validSavedJobs.map((item) =>
            item.jobs ? (
              <JobCard canApply={isPaid} hasAccount isSaved job={item.jobs} key={item.id} />
            ) : null
          )}
        </div>
        {validSavedJobs.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No saved jobs yet"
              description="Save roles from the jobs feed and they will appear here."
              action={
                <Button asChild href="/jobs">
                  Browse jobs
                </Button>
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

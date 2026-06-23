import { Bookmark, BookmarkCheck } from "lucide-react";
import { deleteSavedJobAction, saveJobAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";

export function SaveJobButton({
  isSaved,
  jobId,
  variant = "outline"
}: {
  isSaved: boolean;
  jobId: string;
  variant?: "outline" | "ghost";
}) {
  return (
    <form action={isSaved ? deleteSavedJobAction : saveJobAction}>
      <input name="jobId" type="hidden" value={jobId} />
      <Button type="submit" variant={variant}>
        {isSaved ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        {isSaved ? "Saved" : "Save job"}
      </Button>
    </form>
  );
}

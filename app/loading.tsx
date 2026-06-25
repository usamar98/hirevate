import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container-shell flex min-h-[calc(100svh-64px)] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

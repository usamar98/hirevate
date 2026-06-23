import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  action,
  description,
  title
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-ink-500">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}

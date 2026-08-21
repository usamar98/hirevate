"use client";

import { AlertTriangle, Loader2, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deactivateAccountAction,
  deleteAccountAction
} from "@/app/actions/auth";
import { AuthStatusMessage, type AuthMessage } from "@/components/auth/auth-status-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notifyAuthStatusChanged } from "@/lib/auth/client-events";

type AccountAction = "deactivate" | "delete";

export function AccountDangerZone() {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<AccountAction | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expectedConfirmation = selectedAction === "deactivate" ? "DEACTIVATE" : "DELETE";

  function chooseAction(action: AccountAction) {
    setSelectedAction(action);
    setConfirmation("");
    setMessage(null);
  }

  function cancelAction() {
    setSelectedAction(null);
    setConfirmation("");
    setMessage(null);
  }

  async function submitAccountAction() {
    if (!selectedAction || confirmation.trim() !== expectedConfirmation) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      const result =
        selectedAction === "deactivate"
          ? await deactivateAccountAction({ confirmation })
          : await deleteAccountAction({ confirmation });

      if (!result.ok) {
        setMessage({ text: result.error, tone: "error" });
        return;
      }

      notifyAuthStatusChanged();
      router.replace(selectedAction === "deactivate" ? "/login?account=deactivated" : "/");
      router.refresh();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to update your account.",
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mt-6 border-red-200 p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-red-50 p-2 text-red-700">
          <AlertTriangle aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Account controls</h2>
          <p className="mt-1 text-sm leading-6 text-ink-500">
            Deactivation is reversible through support. Deletion is permanent.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Power aria-hidden="true" className="h-5 w-5 text-amber-700" />
          <h3 className="mt-3 font-semibold text-ink-900">Deactivate account</h3>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Signs you out everywhere and blocks future login. Cancel any renewing membership first;
            contact support when you want to reactivate.
          </p>
          <Button
            className="mt-4 border-amber-300 text-amber-900 hover:bg-amber-100"
            onClick={() => chooseAction("deactivate")}
            type="button"
            variant="outline"
          >
            Deactivate account
          </Button>
        </section>

        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <Trash2 aria-hidden="true" className="h-5 w-5 text-red-700" />
          <h3 className="mt-3 font-semibold text-ink-900">Delete account</h3>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Permanently removes your profile, saved jobs, and application data. Any active
            membership is canceled immediately. This cannot be undone.
          </p>
          <Button
            className="mt-4"
            onClick={() => chooseAction("delete")}
            type="button"
            variant="danger"
          >
            Delete account
          </Button>
        </section>
      </div>

      {selectedAction ? (
        <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-ink-900">
            Confirm account {selectedAction === "deactivate" ? "deactivation" : "deletion"}
          </h3>
          <label className="mt-3 block space-y-1.5" htmlFor="account-action-confirmation">
            <span className="text-sm text-ink-600">
              Type <span className="font-mono font-semibold">{expectedConfirmation}</span> to
              continue.
            </span>
            <Input
              autoComplete="off"
              id="account-action-confirmation"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              disabled={isSubmitting || confirmation.trim() !== expectedConfirmation}
              onClick={submitAccountAction}
              type="button"
              variant={selectedAction === "delete" ? "danger" : "primary"}
            >
              {isSubmitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {selectedAction === "delete"
                ? "Permanently delete account"
                : "Confirm deactivation"}
            </Button>
            <Button disabled={isSubmitting} onClick={cancelAction} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
          <div className="mt-4">
            <AuthStatusMessage message={message} />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

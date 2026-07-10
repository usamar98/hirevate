export type AuthMessage = {
  text: string;
  tone: "error" | "success";
};

export function AuthStatusMessage({ message }: { message: AuthMessage | null }) {
  if (!message) return null;

  return (
    <div
      aria-live="polite"
      className={
        message.tone === "success"
          ? "rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          : "rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
      }
      role={message.tone === "error" ? "alert" : "status"}
    >
      {message.text}
    </div>
  );
}

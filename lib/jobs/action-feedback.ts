export const jobActionErrorMessages = {
  invalid: "We could not understand that saved-job request. Refresh the page and try again.",
  setup: "Saved jobs are not configured yet. Check Supabase environment variables and database setup.",
  load: "We could not check your saved jobs right now. Please try again.",
  save: "We could not save this job right now. Please try again.",
  delete: "We could not remove this saved job right now. Please try again."
} as const;

export type JobActionErrorCode = keyof typeof jobActionErrorMessages;

export function getJobActionErrorMessage(value: string | string[] | undefined) {
  const code = Array.isArray(value) ? value[0] : value;

  return code && code in jobActionErrorMessages
    ? jobActionErrorMessages[code as JobActionErrorCode]
    : null;
}

/**
 * Shape returned by every admin server action, consumed by useActionState.
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  /** Field name -> first validation message. */
  errors?: Record<string, string>;
} | null;

export const EMPTY_STATE: ActionState = null;

/** Flattens a Zod error into the per-field map the forms render. */
export function fieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

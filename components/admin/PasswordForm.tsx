"use client";

import { useActionState, useEffect } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { changePasswordAction } from "@/app/admin/_actions/auth";
import { Field, FormSection, Input } from "@/components/admin/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useToast } from "@/components/admin/Toast";
import { EMPTY_STATE } from "@/lib/action-state";
import { CSRF_FIELD } from "@/lib/csrf-field";

export function PasswordForm({ csrf }: { csrf: string }) {
  const [state, formAction] = useActionState(changePasswordAction, EMPTY_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
  }, [state, toast]);

  return (
    <form action={formAction} className="max-w-xl">
      <input type="hidden" name={CSRF_FIELD} value={csrf} />

      <FormSection
        title="Change password"
        description="The new password is hashed and stored in the database, which then takes precedence over the hash in your .env file."
      >
        {state?.ok ? (
          <p className="flex items-start gap-2 border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {state.message}
          </p>
        ) : null}
        {state && !state.ok && state.message ? (
          <p className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {state.message}
          </p>
        ) : null}

        <Field
          label="Current password"
          htmlFor="current"
          required
          error={state?.errors?.current}
        >
          <Input
            id="current"
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <Field
          label="New password"
          htmlFor="next"
          required
          hint="At least 10 characters. A passphrase of three or four words is both stronger and easier to remember."
          error={state?.errors?.next}
        >
          <Input
            id="next"
            name="next"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </Field>

        <Field
          label="Repeat new password"
          htmlFor="confirm"
          required
          error={state?.errors?.confirm}
        >
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>

        <div>
          <SubmitButton>Update password</SubmitButton>
        </div>
      </FormSection>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { loginAction } from "@/app/admin/_actions/auth";
import { Field, Input } from "@/components/admin/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { EMPTY_STATE } from "@/lib/action-state";

export function LoginForm({ csrf, next }: { csrf: string; next: string }) {
  const [state, formAction] = useActionState(loginAction, EMPTY_STATE);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name={CSRF_FIELD} value={csrf} />
      <input type="hidden" name="next" value={next} />

      {state?.message ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {state.message}
        </p>
      ) : null}

      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
        />
      </Field>

      <Field label="Password" htmlFor="password" error={state?.errors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton pendingLabel="Signing in…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}

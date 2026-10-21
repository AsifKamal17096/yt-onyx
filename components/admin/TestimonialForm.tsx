"use client";

import { useActionState, useEffect } from "react";
import { saveTestimonialAction } from "@/app/admin/_actions/testimonials";
import { Checkbox, Field, Input, Textarea } from "@/components/admin/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useToast } from "@/components/admin/Toast";
import { EMPTY_STATE } from "@/lib/action-state";
import { CSRF_FIELD } from "@/lib/csrf-field";

export type TestimonialValues = {
  id?: string;
  quote: string;
  name: string;
  location: string;
  published: boolean;
};

/**
 * One testimonial: the words, who said them, where they are, and whether the
 * home page shows them. Used both for editing an existing entry and for
 * adding a new one.
 */
export function TestimonialForm({
  values,
  csrf,
  submitLabel,
  resetOnSuccess = false,
}: {
  values: TestimonialValues;
  csrf: string;
  submitLabel: string;
  /** The "add new" form clears itself once the entry is saved. */
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(saveTestimonialAction, EMPTY_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
    if (state && !state.ok && state.message) toast(state.message, "error");
  }, [state, toast]);

  // Remounting the fields after a successful add is what empties them.
  const formKey = resetOnSuccess && state?.ok ? "saved" : "editing";

  return (
    <form action={formAction} className="grid gap-4" key={formKey}>
      <input type="hidden" name={CSRF_FIELD} value={csrf} />
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field
        label="What they said"
        htmlFor={`quote-${values.id ?? "new"}`}
        required
        error={state?.errors?.quote}
      >
        <Textarea
          id={`quote-${values.id ?? "new"}`}
          name="quote"
          defaultValue={values.quote}
          required
          maxLength={600}
          className="min-h-28"
          placeholder="The lamp arrived in perfect condition, crated better than any furniture I have ordered…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Who"
          htmlFor={`name-${values.id ?? "new"}`}
          required
          hint="A name, or a description such as “Interior studio”."
          error={state?.errors?.name}
        >
          <Input
            id={`name-${values.id ?? "new"}`}
            name="name"
            defaultValue={values.name}
            required
            maxLength={80}
          />
        </Field>

        <Field
          label="Where"
          htmlFor={`location-${values.id ?? "new"}`}
          required
          hint="City and country."
          error={state?.errors?.location}
        >
          <Input
            id={`location-${values.id ?? "new"}`}
            name="location"
            defaultValue={values.location}
            required
            maxLength={80}
          />
        </Field>
      </div>

      <Checkbox
        name="published"
        label="Show on the home page"
        hint="Unpublished testimonials stay here but are not shown to visitors."
        defaultChecked={values.published}
      />

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

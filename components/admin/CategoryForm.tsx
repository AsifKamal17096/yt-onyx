"use client";

import { useActionState, useEffect, useState } from "react";
import { saveCategoryAction } from "@/app/admin/_actions/categories";
import { Field, FormSection, Input, Textarea } from "@/components/admin/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useToast } from "@/components/admin/Toast";
import { EMPTY_STATE } from "@/lib/action-state";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { slugify } from "@/lib/slug";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export function CategoryForm({
  values,
  csrf,
  submitLabel,
}: {
  values: CategoryFormValues;
  csrf: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(saveCategoryAction, EMPTY_STATE);
  const { toast } = useToast();

  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [slugLocked, setSlugLocked] = useState(Boolean(values.slug));

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
    if (state && !state.ok && state.message) toast(state.message, "error");
  }, [state, toast]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name={CSRF_FIELD} value={csrf} />
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <FormSection title={values.id ? "Category" : "New category"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required error={state?.errors?.name}>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugLocked) setSlug(slugify(event.target.value));
              }}
              required
            />
          </Field>
          <Field label="URL slug" htmlFor="slug" error={state?.errors?.slug}>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugLocked(true);
              }}
            />
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="description"
          hint="Shown at the top of the category page."
          error={state?.errors?.description}
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={values.description}
            className="min-h-24"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title" htmlFor="seoTitle">
            <Input id="seoTitle" name="seoTitle" defaultValue={values.seoTitle} />
          </Field>
          <Field label="SEO description" htmlFor="seoDescription">
            <Input
              id="seoDescription"
              name="seoDescription"
              defaultValue={values.seoDescription}
            />
          </Field>
        </div>

        <div>
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </FormSection>
    </form>
  );
}

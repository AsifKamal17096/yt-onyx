"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { saveProductAction } from "@/app/admin/_actions/products";
import {
  Checkbox,
  Field,
  FormSection,
  Input,
  Select,
  Textarea,
} from "@/components/admin/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useToast } from "@/components/admin/Toast";
import { EMPTY_STATE } from "@/lib/action-state";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { slugify } from "@/lib/slug";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  stoneTypeId: string;
  colorId: string;
  finishId: string;
  price: string;
  compareAt: string;
  length: string;
  width: string;
  height: string;
  dimensionUnit: string;
  weight: string;
  weightUnit: string;
  shortDescription: string;
  description: string;
  careInstructions: string;
  availability: string;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

type Option = { id: string; name: string };

export function ProductForm({
  values,
  options,
  csrf,
}: {
  values: ProductFormValues;
  options: {
    categories: Option[];
    stoneTypes: Option[];
    colors: Option[];
    finishes: Option[];
  };
  csrf: string;
}) {
  const [state, formAction] = useActionState(saveProductAction, EMPTY_STATE);
  const { toast } = useToast();

  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  // Once the slug has been edited by hand, stop rewriting it from the name.
  const [slugLocked, setSlugLocked] = useState(Boolean(values.slug));

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
    if (state && !state.ok && state.message) toast(state.message, "error");
  }, [state, toast]);

  const error = (field: string) => state?.errors?.[field];

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name={CSRF_FIELD} value={csrf} />
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-6">
        <FormSection title="The piece">
          <Field label="Name" htmlFor="name" required error={error("name")}>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugLocked) setSlug(slugify(event.target.value));
              }}
              required
              maxLength={160}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="URL slug"
              htmlFor="slug"
              hint="Appears in the web address."
              error={error("slug")}
            >
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugLocked(true);
                }}
                maxLength={90}
              />
            </Field>

            <Field label="SKU" htmlFor="sku" required error={error("sku")}>
              <Input
                id="sku"
                name="sku"
                defaultValue={values.sku}
                required
                maxLength={60}
              />
            </Field>
          </div>

          <Field
            label="Short description"
            htmlFor="shortDescription"
            required
            hint="One or two lines, shown under the title and in previews."
            error={error("shortDescription")}
          >
            <Textarea
              id="shortDescription"
              name="shortDescription"
              defaultValue={values.shortDescription}
              required
              maxLength={400}
              className="min-h-20"
            />
          </Field>

          <Field
            label="Full description"
            htmlFor="description"
            required
            hint="Leave a blank line between paragraphs."
            error={error("description")}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={values.description}
              required
              className="min-h-56"
            />
          </Field>

          <Field
            label="Care instructions"
            htmlFor="careInstructions"
            error={error("careInstructions")}
          >
            <Textarea
              id="careInstructions"
              name="careInstructions"
              defaultValue={values.careInstructions}
              className="min-h-28"
            />
          </Field>
        </FormSection>

        <FormSection
          title="Price"
          description="All prices are in US dollars. Enter the amount only, e.g. 1250.00"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (USD)" htmlFor="price" required error={error("priceCents")}>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                defaultValue={values.price}
                required
                placeholder="385.00"
              />
            </Field>
            <Field
              label="Compare-at price"
              htmlFor="compareAt"
              hint="Optional. Shown struck through to signal a discount."
              error={error("compareAtCents")}
            >
              <Input
                id="compareAt"
                name="compareAt"
                inputMode="decimal"
                defaultValue={values.compareAt}
                placeholder="—"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Dimensions & weight">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Length" htmlFor="length" error={error("length")}>
              <Input id="length" name="length" inputMode="decimal" defaultValue={values.length} />
            </Field>
            <Field label="Width" htmlFor="width" error={error("width")}>
              <Input id="width" name="width" inputMode="decimal" defaultValue={values.width} />
            </Field>
            <Field label="Height" htmlFor="height" error={error("height")}>
              <Input id="height" name="height" inputMode="decimal" defaultValue={values.height} />
            </Field>
            <Field label="Unit" htmlFor="dimensionUnit">
              <Select id="dimensionUnit" name="dimensionUnit" defaultValue={values.dimensionUnit}>
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="in">in</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Weight" htmlFor="weight" error={error("weight")}>
              <Input id="weight" name="weight" inputMode="decimal" defaultValue={values.weight} />
            </Field>
            <Field label="Unit" htmlFor="weightUnit">
              <Select id="weightUnit" name="weightUnit" defaultValue={values.weightUnit}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Search engines"
          description="Leave blank to use the name and short description."
        >
          <Field label="SEO title" htmlFor="seoTitle" error={error("seoTitle")}>
            <Input
              id="seoTitle"
              name="seoTitle"
              defaultValue={values.seoTitle}
              maxLength={200}
            />
          </Field>
          <Field
            label="SEO description"
            htmlFor="seoDescription"
            error={error("seoDescription")}
          >
            <Textarea
              id="seoDescription"
              name="seoDescription"
              defaultValue={values.seoDescription}
              maxLength={400}
              className="min-h-20"
            />
          </Field>
        </FormSection>
      </div>

      <aside className="grid h-fit gap-6 lg:sticky lg:top-6">
        <FormSection title="Visibility">
          <Checkbox
            name="published"
            label="Published"
            hint="Unpublished products are invisible on the website."
            defaultChecked={values.published}
          />
          <Checkbox
            name="featured"
            label="Featured"
            hint="Shown on the home page and at the top of “Featured” sorting."
            defaultChecked={values.featured}
          />
          <Field label="Availability" htmlFor="availability">
            <Select
              id="availability"
              name="availability"
              defaultValue={values.availability}
            >
              <option value="IN_STOCK">In Stock</option>
              <option value="MADE_TO_ORDER">Made to Order</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Classification">
          <Field label="Category" htmlFor="categoryId" required error={error("categoryId")}>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={values.categoryId}
              required
            >
              <option value="">Choose…</option>
              {options.categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Stone type" htmlFor="stoneTypeId">
            <Select id="stoneTypeId" name="stoneTypeId" defaultValue={values.stoneTypeId}>
              <option value="">—</option>
              {options.stoneTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Colour" htmlFor="colorId">
            <Select id="colorId" name="colorId" defaultValue={values.colorId}>
              <option value="">—</option>
              {options.colors.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Finish" htmlFor="finishId">
            <Select id="finishId" name="finishId" defaultValue={values.finishId}>
              <option value="">—</option>
              {options.finishes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
        </FormSection>

        <div className="border border-line bg-white p-5">
          {state && !state.ok && state.message ? (
            <p className="mb-4 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              {state.message}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="mb-4 flex items-start gap-2 border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {state.message}
            </p>
          ) : null}

          <SubmitButton className="w-full">
            {values.id ? "Save changes" : "Create product"}
          </SubmitButton>
        </div>
      </aside>
    </form>
  );
}

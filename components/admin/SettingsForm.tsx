"use client";

import { useActionState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { saveSettingsAction } from "@/app/admin/_actions/settings";
import { Field, FormSection, Input, Textarea } from "@/components/admin/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { useToast } from "@/components/admin/Toast";
import { EMPTY_STATE } from "@/lib/action-state";
import { CSRF_FIELD } from "@/lib/csrf-field";

export type SettingsValues = {
  whatsappNumber: string;
  whatsappTemplate: string;
  heroHeadline: string;
  heroSubtext: string;
  announcement: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  mapEmbedUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  pinterestUrl: string;
  tiktokUrl: string;
};

export function SettingsForm({
  values,
  csrf,
}: {
  values: SettingsValues;
  csrf: string;
}) {
  const [state, formAction] = useActionState(saveSettingsAction, EMPTY_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
    if (state && !state.ok && state.message) toast(state.message, "error");
  }, [state, toast]);

  const error = (field: string) => state?.errors?.[field];

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name={CSRF_FIELD} value={csrf} />

      <FormSection
        title="WhatsApp"
        description="Every order button on the website uses this number. Without it, those buttons send customers to the contact page instead."
      >
        <Field
          label="WhatsApp number"
          htmlFor="whatsappNumber"
          hint="Include the country code. Spaces, dashes and brackets are fine — e.g. +92 300 1234567."
          error={error("whatsappNumber")}
        >
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={values.whatsappNumber}
            placeholder="+92 300 1234567"
          />
        </Field>

        <Field
          label="Order message template"
          htmlFor="whatsappTemplate"
          hint="Placeholders: {name} {sku} {price} {qty} {url} — they are filled in automatically."
          error={error("whatsappTemplate")}
        >
          <Textarea
            id="whatsappTemplate"
            name="whatsappTemplate"
            defaultValue={values.whatsappTemplate}
            className="min-h-40 font-mono text-xs"
          />
        </Field>
      </FormSection>

      <FormSection title="Home page">
        <Field
          label="Hero headline"
          htmlFor="heroHeadline"
          required
          error={error("heroHeadline")}
        >
          <Input
            id="heroHeadline"
            name="heroHeadline"
            defaultValue={values.heroHeadline}
            required
          />
        </Field>
        <Field label="Hero subtext" htmlFor="heroSubtext" error={error("heroSubtext")}>
          <Textarea
            id="heroSubtext"
            name="heroSubtext"
            defaultValue={values.heroSubtext}
            className="min-h-20"
          />
        </Field>
        <Field
          label="Announcement bar"
          htmlFor="announcement"
          hint="A single line above the header. Leave empty to hide the bar."
          error={error("announcement")}
        >
          <Input
            id="announcement"
            name="announcement"
            defaultValue={values.announcement}
          />
        </Field>
      </FormSection>

      <FormSection title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="contactEmail" error={error("contactEmail")}>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={values.contactEmail}
            />
          </Field>
          <Field label="Telephone" htmlFor="contactPhone" error={error("contactPhone")}>
            <Input
              id="contactPhone"
              name="contactPhone"
              defaultValue={values.contactPhone}
            />
          </Field>
        </div>

        <Field label="Address" htmlFor="addressLine" error={error("addressLine")}>
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={values.addressLine}
          />
        </Field>

        <Field
          label="Map embed URL"
          htmlFor="mapEmbedUrl"
          hint="From Google Maps: Share → Embed a map → copy the src address only."
          error={error("mapEmbedUrl")}
        >
          <Input
            id="mapEmbedUrl"
            name="mapEmbedUrl"
            defaultValue={values.mapEmbedUrl}
            placeholder="https://www.google.com/maps/embed?pb=…"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Social links"
        description="Leave any of these empty and the icon disappears from the site."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" htmlFor="instagramUrl" error={error("instagramUrl")}>
            <Input id="instagramUrl" name="instagramUrl" defaultValue={values.instagramUrl} />
          </Field>
          <Field label="Facebook" htmlFor="facebookUrl" error={error("facebookUrl")}>
            <Input id="facebookUrl" name="facebookUrl" defaultValue={values.facebookUrl} />
          </Field>
          <Field label="Pinterest" htmlFor="pinterestUrl" error={error("pinterestUrl")}>
            <Input id="pinterestUrl" name="pinterestUrl" defaultValue={values.pinterestUrl} />
          </Field>
          <Field label="TikTok" htmlFor="tiktokUrl" error={error("tiktokUrl")}>
            <Input id="tiktokUrl" name="tiktokUrl" defaultValue={values.tiktokUrl} />
          </Field>
        </div>
      </FormSection>

      <div className="flex items-center gap-4 border border-line bg-white p-5">
        <SubmitButton>Save settings</SubmitButton>
        {state && !state.ok && state.message ? (
          <p className="flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.8} />
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

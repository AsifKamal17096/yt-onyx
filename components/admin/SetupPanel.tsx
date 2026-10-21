"use client";

import { useActionState } from "react";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { setupCatalogueAction } from "@/app/admin/_actions/setup";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { EMPTY_STATE } from "@/lib/action-state";
import { CSRF_FIELD } from "@/lib/csrf-field";

/**
 * Shown on the dashboard while the catalogue is empty. One button fills the
 * site with its categories, attribute lists and a demo catalogue, so a fresh
 * deployment is never a blank shop.
 */
export function SetupPanel({ csrf }: { csrf: string }) {
  const [state, formAction] = useActionState(setupCatalogueAction, EMPTY_STATE);

  if (state?.ok) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-green-300 bg-green-50 p-5">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-700" strokeWidth={2} />
        <div>
          <h2 className="text-sm font-medium text-green-900">
            Your catalogue is ready
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-green-800">
            {state.message} Reload this page to see the numbers update, then
            visit the site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 border border-gold/50 bg-gold/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
        <div className="flex-1">
          <h2 className="font-serif text-xl text-ink">
            Your shop is empty — start it off
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            This creates the eight categories, the stone, colour and finish
            lists, your site settings and eight demo products with placeholder
            imagery, so you can see the whole site working. Delete the demo
            products once your own photographs are in — they are tagged, and
            removable in one action from the Products page.
          </p>

          {state && !state.ok && state.message ? (
            <p className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              {state.message}
            </p>
          ) : null}

          <form action={formAction} className="mt-5">
            <input type="hidden" name={CSRF_FIELD} value={csrf} />
            <SubmitButton pendingLabel="Setting up — this takes a minute…">
              Set up my catalogue
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Quote } from "lucide-react";
import {
  deleteTestimonialAction,
  moveTestimonialAction,
} from "@/app/admin/_actions/testimonials";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AdminPage } from "@/components/admin/PageShell";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  await requireAdminPage();

  const [csrf, testimonials] = await Promise.all([
    csrfToken(),
    prisma.testimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const liveCount = testimonials.filter((item) => item.published).length;

  return (
    <AdminPage
      title="Testimonials"
      description="The home page shows the first three published testimonials, in this order. With none published, the section is hidden entirely."
    >
      {liveCount > 3 ? (
        <p className="mb-6 border border-line bg-white px-4 py-3 text-xs leading-relaxed text-muted">
          {liveCount} are published — only the first three appear on the home
          page. Reorder them to choose which.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <section
            key={testimonial.id}
            className="border border-line bg-white p-5"
          >
            <header className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-gold-deep" strokeWidth={1.6} />
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">
                  {testimonial.published
                    ? index < 3
                      ? `On the home page · position ${index + 1}`
                      : "Published · not shown (only three fit)"
                    : "Hidden"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <form action={moveTestimonialAction}>
                  <input type="hidden" name={CSRF_FIELD} value={csrf} />
                  <input type="hidden" name="id" value={testimonial.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label="Move earlier"
                    className="p-1.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                </form>
                <form action={moveTestimonialAction}>
                  <input type="hidden" name={CSRF_FIELD} value={csrf} />
                  <input type="hidden" name="id" value={testimonial.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === testimonials.length - 1}
                    aria-label="Move later"
                    className="p-1.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                </form>
                <form action={deleteTestimonialAction} className="ml-1">
                  <input type="hidden" name={CSRF_FIELD} value={csrf} />
                  <input type="hidden" name="id" value={testimonial.id} />
                  <ConfirmButton
                    title="Delete this testimonial?"
                    body={`“${testimonial.quote.slice(0, 90)}…” will be removed permanently.`}
                    className="h-7 px-2 text-[0.58rem]"
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </header>

            <TestimonialForm
              csrf={csrf}
              submitLabel="Save"
              values={{
                id: testimonial.id,
                quote: testimonial.quote,
                name: testimonial.name,
                location: testimonial.location,
                published: testimonial.published,
              }}
            />
          </section>
        ))}
      </div>

      <section className="mt-8 max-w-3xl border border-dashed border-line bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl">Add a testimonial</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Use real customer words, with their permission. A city and country
          carry more weight than a full name.
        </p>
        <div className="mt-5">
          <TestimonialForm
            csrf={csrf}
            submitLabel="Add testimonial"
            resetOnSuccess
            values={{
              quote: "",
              name: "",
              location: "",
              published: true,
            }}
          />
        </div>
      </section>
    </AdminPage>
  );
}

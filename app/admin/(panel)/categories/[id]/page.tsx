import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { AdminPage } from "@/components/admin/PageShell";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]">,
) {
  await requireAdminPage();
  const { id } = await props.params;

  const [csrf, category] = await Promise.all([
    csrfToken(),
    prisma.category.findUnique({ where: { id } }),
  ]);

  if (!category) notFound();

  return (
    <AdminPage
      title={category.name}
      description={`/category/${category.slug}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <CategoryForm
          csrf={csrf}
          submitLabel="Save changes"
          values={{
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            seoTitle: category.seoTitle ?? "",
            seoDescription: category.seoDescription ?? "",
          }}
        />

        <aside className="h-fit border border-line bg-white p-5">
          <SingleImageUpload
            target="category"
            ownerId={category.id}
            currentUrl={mediaUrl(category.imageKey)}
            csrf={csrf}
            label="Category image"
            hint="Used in the home page collection grid. Landscape works best."
          />
        </aside>
      </div>

      <p className="mt-6 text-xs text-muted">
        <Link
          href={`${ADMIN_BASE}/categories`}
          className="underline underline-offset-4 transition-colors hover:text-ink"
        >
          Back to categories
        </Link>
      </p>
    </AdminPage>
  );
}

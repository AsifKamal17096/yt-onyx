import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, ImageOff } from "lucide-react";
import Image from "next/image";
import {
  deleteCategoryAction,
  moveCategoryAction,
} from "@/app/admin/_actions/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AdminPage } from "@/components/admin/PageShell";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage(
  props: PageProps<"/admin/categories">,
) {
  await requireAdminPage();
  const [csrf, categories, params] = await Promise.all([
    csrfToken(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageKey: true,
        _count: { select: { products: true } },
      },
    }),
    props.searchParams,
  ]);

  const inUseError = params.error === "in-use";

  return (
    <AdminPage
      title="Categories"
      description="The collections shown on the home page, in the footer and in the shop filters. Order here is the order visitors see."
    >
      {inUseError ? (
        <p className="mb-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          That category still has products in it. Move them to another category
          first, then delete it.
        </p>
      ) : null}

      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              <th className="px-4 py-3">Category</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Products</th>
              <th className="px-3 py-3 text-right">Order</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((category, index) => {
              const image = mediaUrl(category.imageKey);
              return (
                <tr key={category.id} className="hover:bg-cream-dim/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden bg-cream-dim">
                        {image ? (
                          <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-muted" strokeWidth={1.4} />
                        )}
                      </div>
                      <Link
                        href={`${ADMIN_BASE}/categories/${category.id}`}
                        className="font-medium text-ink transition-colors hover:text-gold-deep"
                      >
                        {category.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted">{category.slug}</td>
                  <td className="px-3 py-3">{category._count.products}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <form action={moveCategoryAction}>
                        <input type="hidden" name={CSRF_FIELD} value={csrf} />
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label={`Move ${category.name} up`}
                          className="p-1.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </button>
                      </form>
                      <form action={moveCategoryAction}>
                        <input type="hidden" name={CSRF_FIELD} value={csrf} />
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === categories.length - 1}
                          aria-label={`Move ${category.name} down`}
                          className="p-1.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name={CSRF_FIELD} value={csrf} />
                        <input type="hidden" name="id" value={category.id} />
                        <ConfirmButton
                          title={`Delete ${category.name}?`}
                          body="The category is removed from the shop filters, the home page and the footer. Categories that still contain products cannot be deleted."
                        >
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-3xl">
        <CategoryForm
          csrf={csrf}
          submitLabel="Create category"
          values={{
            name: "",
            slug: "",
            description: "",
            seoTitle: "",
            seoDescription: "",
          }}
        />
      </div>
    </AdminPage>
  );
}

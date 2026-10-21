import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/PageShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdminPage();

  const [csrf, categories, stoneTypes, colors, finishes] = await Promise.all([
    csrfToken(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.stoneType.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.color.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.finish.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AdminPage
      title="New product"
      description="Fill in the details, save, then add photographs on the next screen."
    >
      <ProductForm
        csrf={csrf}
        options={{ categories, stoneTypes, colors, finishes }}
        values={{
          name: "",
          slug: "",
          sku: "",
          categoryId: categories[0]?.id ?? "",
          stoneTypeId: "",
          colorId: "",
          finishId: "",
          price: "",
          compareAt: "",
          length: "",
          width: "",
          height: "",
          dimensionUnit: "cm",
          weight: "",
          weightUnit: "kg",
          shortDescription: "",
          description: "",
          careInstructions: "",
          availability: "IN_STOCK",
          featured: false,
          published: false,
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </AdminPage>
  );
}

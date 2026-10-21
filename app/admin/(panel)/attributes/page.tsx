import type { Metadata } from "next";
import { Plus } from "lucide-react";
import {
  createAttributeAction,
  deleteAttributeAction,
  renameAttributeAction,
} from "@/app/admin/_actions/attributes";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AdminPage } from "@/components/admin/PageShell";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Attributes" };

type Row = {
  id: string;
  name: string;
  slug: string;
  hex?: string | null;
  count: number;
};

export default async function AttributesPage() {
  await requireAdminPage();

  const [csrf, stoneTypes, colors, finishes] = await Promise.all([
    csrfToken(),
    prisma.stoneType.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.color.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        hex: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.finish.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
  ]);

  const toRows = (
    rows: { id: string; name: string; slug: string; hex?: string | null; _count: { products: number } }[],
  ): Row[] =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      hex: row.hex,
      count: row._count.products,
    }));

  return (
    <AdminPage
      title="Attributes"
      description="The lists customers filter by in the shop. Renaming is safe; the filter address stays the same so saved links keep working."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <AttributeColumn
          kind="stone"
          title="Stone types"
          rows={toRows(stoneTypes)}
          csrf={csrf}
        />
        <AttributeColumn
          kind="color"
          title="Colours"
          rows={toRows(colors)}
          csrf={csrf}
          withColor
        />
        <AttributeColumn
          kind="finish"
          title="Finishes"
          rows={toRows(finishes)}
          csrf={csrf}
        />
      </div>
    </AdminPage>
  );
}

function AttributeColumn({
  kind,
  title,
  rows,
  csrf,
  withColor = false,
}: {
  kind: "stone" | "color" | "finish";
  title: string;
  rows: Row[];
  csrf: string;
  withColor?: boolean;
}) {
  return (
    <section className="border border-line bg-white p-5">
      <h2 className="font-serif text-xl">{title}</h2>

      <ul className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <li key={row.id} className="py-2.5">
            <form
              action={renameAttributeAction}
              className="flex items-center gap-2"
            >
              <input type="hidden" name={CSRF_FIELD} value={csrf} />
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={row.id} />

              {withColor ? (
                <input
                  type="color"
                  name="hex"
                  defaultValue={row.hex ?? "#cccccc"}
                  aria-label={`Swatch for ${row.name}`}
                  className="h-7 w-7 shrink-0 cursor-pointer border border-line bg-white p-0.5"
                />
              ) : null}

              <input
                name="name"
                defaultValue={row.name}
                aria-label={`Name of ${row.name}`}
                className="min-w-0 flex-1 border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink outline-none transition-colors hover:border-line focus:border-gold focus:bg-white"
              />

              <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
                {row.count}
              </span>

              <button
                type="submit"
                className="shrink-0 px-2 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
              >
                Save
              </button>
            </form>

            <form action={deleteAttributeAction} className="mt-1 flex justify-end">
              <input type="hidden" name={CSRF_FIELD} value={csrf} />
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={row.id} />
              <ConfirmButton
                title={`Delete ${row.name}?`}
                body={
                  row.count > 0
                    ? `${row.count} product${row.count === 1 ? "" : "s"} use this. They will keep working — the field is simply cleared.`
                    : "This attribute is not used by any product."
                }
                className="h-7 px-2 text-[0.58rem]"
              >
                Delete
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>

      <form
        action={createAttributeAction}
        className="mt-5 flex items-center gap-2 border-t border-line pt-4"
      >
        <input type="hidden" name={CSRF_FIELD} value={csrf} />
        <input type="hidden" name="kind" value={kind} />
        {withColor ? (
          <input
            type="color"
            name="hex"
            defaultValue="#cccccc"
            aria-label="Swatch for the new colour"
            className="h-9 w-9 shrink-0 cursor-pointer border border-line bg-white p-0.5"
          />
        ) : null}
        <input
          name="name"
          required
          maxLength={60}
          placeholder="Add new…"
          aria-label={`Add to ${title}`}
          className="min-w-0 flex-1 border border-line px-2.5 py-2 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          aria-label={`Add to ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink text-cream transition-colors hover:bg-ink-soft"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </form>
    </section>
  );
}

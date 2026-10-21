import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Shown when a filter combination returns nothing. */
export function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line px-6 py-24 text-center">
      <PackageSearch className="h-8 w-8 text-muted" strokeWidth={1.2} />
      <h2 className="mt-5 font-serif text-2xl">Nothing matches that yet</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Try removing a filter, or tell us what you are looking for — most of what
        we make never makes it onto the website.
      </p>
      <Button href="/custom-orders" variant="outline" className="mt-7">
        Request a custom piece
      </Button>
    </div>
  );
}

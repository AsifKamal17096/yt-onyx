import { Suspense } from "react";
import { AdminNav, AdminNavFallback } from "@/components/admin/AdminNav";
import { Skeleton } from "@/components/ui/Skeleton";
import { csrfToken } from "@/lib/csrf";

/**
 * Shell for the signed-in admin.
 *
 * Everything below this layout reads cookies (the session), so children are
 * rendered inside a Suspense boundary — that is how Cache Components keeps a
 * static shell while request-time content streams in.
 */
/**
 * Admin pages are private and personal: they always have to verify the session
 * cookie before rendering, so a navigation into them legitimately blocks on
 * server data. Opting out of instant-navigation validation says that is
 * intentional rather than an oversight.
 */
export const instant = false;

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Suspense fallback={<AdminNavFallback />}>
        <NavWithToken />
      </Suspense>

      <main className="min-w-0 flex-1">
        <Suspense fallback={<PanelSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

async function NavWithToken() {
  const token = await csrfToken();
  return <AdminNav csrf={token} />;
}

function PanelSkeleton() {
  return (
    <div className="p-6 sm:p-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="mt-8 h-72 w-full" />
    </div>
  );
}

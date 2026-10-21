import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { BRAND } from "@/lib/brand";
import { csrfToken } from "@/lib/csrf";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <Image
            src={BRAND.logo}
            alt=""
            width={96}
            height={96}
            priority
            className="h-16 w-16 object-contain"
          />
          <h1 className="mt-6 font-serif text-2xl text-cream">Studio</h1>
          <p className="mt-2 text-[0.66rem] uppercase tracking-[0.18em] text-cream/40">
            Authorised access only
          </p>
        </div>

        <div className="mt-9 border border-cream/10 bg-cream p-6">
          <Suspense fallback={<FormSkeleton />}>
            <LoginFormLoader searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/** Reads the CSRF cookie (a runtime API), so it streams inside Suspense. */
async function LoginFormLoader({
  searchParams,
}: Pick<PageProps<"/admin/login">, "searchParams">) {
  const [token, params] = await Promise.all([csrfToken(), searchParams]);
  const next = typeof params.next === "string" ? params.next : "";

  return <LoginForm csrf={token} next={next} />;
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

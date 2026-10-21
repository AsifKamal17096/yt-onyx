import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AdminPage } from "@/components/admin/PageShell";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Password" };

export default async function PasswordPage() {
  const session = await requireAdminPage();

  const [csrf, settings] = await Promise.all([
    csrfToken(),
    prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { adminPasswordHash: true },
    }),
  ]);

  const usingDatabasePassword = Boolean(settings?.adminPasswordHash);

  return (
    <AdminPage
      title="Password"
      description={`The account is ${session.email}. There is only one, and it cannot be changed from here — it comes from ADMIN_EMAIL in your .env file.`}
    >
      <PasswordForm csrf={csrf} />

      <section className="mt-8 max-w-xl border border-line bg-white p-5">
        <h2 className="flex items-center gap-2 font-serif text-xl">
          <KeyRound className="h-4 w-4 text-gold-deep" strokeWidth={1.6} />
          How this works
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-ink">Right now:</strong>{" "}
            {usingDatabasePassword
              ? "your password is the one set here, stored as a bcrypt hash in the database."
              : "your password is the one whose hash is in ADMIN_PASSWORD_HASH in .env."}
          </li>
          <li>
            Changing it here stores a new hash in the database, which from then
            on overrides the environment file.
          </li>
          <li>
            Locked out? On the server run{" "}
            <code className="text-ink">npm run admin:reset-db-password</code> to
            clear the stored hash and fall back to .env, or generate a fresh
            hash with <code className="text-ink">npm run admin:hash</code>.
          </li>
          <li>
            After five wrong attempts from the same address, sign-in is blocked
            for fifteen minutes.
          </li>
        </ul>
      </section>
    </AdminPage>
  );
}

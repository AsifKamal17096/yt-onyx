import "dotenv/config";
import { prisma } from "@/lib/prisma";

/**
 * Clears the password hash stored in the database, so the admin login falls
 * back to ADMIN_PASSWORD_HASH from .env again.
 *
 * This is the recovery path if the in-app password is ever forgotten: run it
 * on the server, then sign in with the password whose hash is in .env.
 *
 * Run with: npm run admin:reset-db-password
 */
async function main() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  if (!settings?.adminPasswordHash) {
    console.log(
      "No password is stored in the database — the .env hash is already in use.",
    );
    return;
  }

  await prisma.siteSettings.update({
    where: { id: 1 },
    data: { adminPasswordHash: null },
  });

  console.log(
    "Database password cleared. Sign in with the password from ADMIN_PASSWORD_HASH in .env.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

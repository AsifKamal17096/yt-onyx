import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { seedCatalogue } from "@/lib/catalog-seed";

/**
 * Command-line entry point: `npm run seed`.
 *
 * The work itself lives in lib/catalog-seed.ts so the admin panel can run the
 * same setup on a host where there is no shell.
 */
seedCatalogue((message) => console.log(`  ${message}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

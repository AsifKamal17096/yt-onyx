import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrl } from "./lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npm run seed` is also what `prisma migrate reset` runs.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Resolved so the CLI and the app always open the same file.
    url: resolveDatabaseUrl(),
  },
});

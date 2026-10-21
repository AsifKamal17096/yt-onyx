import "dotenv/config";
import { defineConfig } from "prisma/config";
import { migrationDatabaseUrl } from "./lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npm run seed` is also what `prisma migrate reset` runs.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The direct, unpooled connection: Prisma Migrate takes a session-level
    // advisory lock, which a transaction-mode pooler cannot hold.
    //
    // Read without throwing, because this file is loaded by every Prisma
    // command — including `prisma generate`, which runs during `npm install`
    // and needs no database at all.
    url: migrationDatabaseUrl(),
  },
});

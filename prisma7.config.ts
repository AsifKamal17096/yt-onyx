import "dotenv/config";
import { defineConfig } from "prisma/config";
import { databaseUrlOrEmpty } from "./lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npm run seed` is also what `prisma migrate reset` runs.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read without throwing: this file is loaded by every Prisma command,
    // including `prisma generate`, which runs during `npm install` and needs
    // no database at all. Commands that do need one fail on their own with a
    // clear message.
    url: databaseUrlOrEmpty(),
  },
});

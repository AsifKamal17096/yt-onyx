/**
 * Prints fresh random values for the secrets in .env.
 *
 * Run with: npm run secret
 */
import crypto from "node:crypto";

const random = (bytes) => crypto.randomBytes(bytes).toString("base64");

console.log("\nPaste these into your .env file:\n");
console.log(`SESSION_SECRET="${random(48)}"`);
console.log(`IP_HASH_SALT="${random(24)}"`);
console.log(
  "\nChanging SESSION_SECRET signs every open admin session out.\n" +
    "Changing IP_HASH_SALT only resets rate-limit counters.\n",
);

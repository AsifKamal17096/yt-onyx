/**
 * Prints fresh random values for the secrets in .env.
 *
 * Run with: npm run secret
 */
import crypto from "node:crypto";

const random = (bytes) => crypto.randomBytes(bytes).toString("base64");

const sessionSecret = random(48);
const ipHashSalt = random(24);

console.log("\nTwo secrets, in the two forms you might need.\n");

console.log("1. HOSTING DASHBOARD (Vercel, Netlify, Railway…)");
console.log("   Add two variables, pasting the value only — no quotes:\n");
console.log(`   SESSION_SECRET   ${sessionSecret}`);
console.log(`   IP_HASH_SALT     ${ipHashSalt}\n`);

console.log("2. A .env FILE on your machine or a server");
console.log("   Paste these two lines as they are:\n");
console.log(`   SESSION_SECRET="${sessionSecret}"`);
console.log(`   IP_HASH_SALT="${ipHashSalt}"\n`);

console.log(
  "Changing SESSION_SECRET signs every open admin session out.\n" +
    "Changing IP_HASH_SALT only resets rate-limit counters.\n",
);

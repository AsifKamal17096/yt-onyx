/**
 * Prompts for a password and prints the bcrypt hash to paste into .env.
 *
 * The password is never echoed, never written to disk and never stored in
 * shell history — only the resulting hash is printed.
 *
 * Run with: npm run admin:hash
 */
import readline from "node:readline";
import bcrypt from "bcryptjs";

const MIN_LENGTH = 10;
const COST = 12;

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // Replace typed characters with nothing so the password stays invisible.
    let muted = false;
    const originalWrite = rl._writeToOutput?.bind(rl);
    rl._writeToOutput = (chunk) => {
      if (muted) return;
      originalWrite?.(chunk);
    };

    rl.question(question, (answer) => {
      muted = false;
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });

    muted = true;
  });
}

async function main() {
  console.log("\nYT Onyx — admin password hash\n");

  const password = await askHidden("New admin password: ");
  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const confirmation = await askHidden("Repeat password:    ");
  if (password !== confirmation) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, COST);

  console.log("Add this line to your .env file (keep the quotes):\n");
  console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
  console.log(
    "Then restart the server. If a password was set from the admin panel\n" +
      "earlier, that one wins — change it there instead, or clear it with:\n" +
      "  npm run admin:reset-db-password\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

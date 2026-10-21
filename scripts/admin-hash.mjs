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

/**
 * Lines piped in when there is no terminal. Read once, in full: opening a
 * second readline interface on the same stream would find it already drained.
 */
let pipedLines = null;

async function readPipedLines() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}

function askHidden(question) {
  // Without a terminal there is nothing to hide, so take the next piped line
  // rather than hanging on a muted prompt.
  if (!process.stdin.isTTY) {
    return (async () => {
      pipedLines ??= await readPipedLines();
      return pipedLines.shift() ?? "";
    })();
  }

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

  // A password given as an argument skips the prompt. Some shells and
  // embedded terminals cannot accept typed input at all, and a prompt that
  // silently reads nothing is worse than no prompt.
  const fromArgument = process.argv.slice(2).join(" ").trim();

  if (fromArgument) {
    if (fromArgument.length < MIN_LENGTH) {
      console.error(`Password must be at least ${MIN_LENGTH} characters.`);
      process.exit(1);
    }
    console.log("Using the password given on the command line.");
    console.log("It is visible in this window — clear it when you are done.\n");
    return printHash(await bcrypt.hash(fromArgument, COST));
  }

  if (!process.stdin.isTTY) {
    console.error(
      "This window cannot accept a typed password.\n\n" +
        "Either pass it as an argument:\n" +
        '  npm run admin:hash -- "your password here"\n\n' +
        "or run the same command in a normal terminal window, where typing\n" +
        "is hidden.\n",
    );
    process.exit(1);
  }

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

  return printHash(await bcrypt.hash(password, COST));
}

function printHash(hash) {
  // A bcrypt hash is full of $ signs, and .env files expand those. The two
  // destinations therefore need different forms of the same hash, which is
  // the single most common way to end up locked out.
  const escaped = hash.replaceAll("$", "\\$");

  console.log("The same hash, in the two forms you might need.\n");

  console.log("1. HOSTING DASHBOARD (Vercel, Netlify, Railway…)");
  console.log("   Paste exactly this, with no quotes:\n");
  console.log(`   ${hash}\n`);

  console.log("2. A .env FILE on your machine or a server");
  console.log("   Paste this line, backslashes included:\n");
  console.log(`   ADMIN_PASSWORD_HASH="${escaped}"\n`);
  console.log(
    "   Without the backslashes .env eats part of the hash and the\n" +
      "   password silently never works.\n",
  );

  console.log(
    "If a password was set from the admin panel earlier, that one wins —\n" +
      "change it there instead, or clear it with:\n" +
      "  npm run admin:reset-db-password\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

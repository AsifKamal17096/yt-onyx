# YT Onyx

A catalogue website for handcrafted onyx and marble, built for a workshop that
sells over WhatsApp. Customers browse pieces with prices in USD and press a
button that opens WhatsApp with the order details already written out. There is
no checkout, no payment processing and no customer accounts — the conversation
is the order.

Everything the owner can change (products, photographs, categories, the
WhatsApp number, the hero text) is edited from a hidden admin panel. Nothing
requires an external service.

---

## Contents

1. [Running it locally](#1-running-it-locally)
2. [Creating your admin password](#2-creating-your-admin-password)
3. [How the WhatsApp ordering works](#3-how-the-whatsapp-ordering-works)
4. [The admin panel](#4-the-admin-panel)
5. [Commands](#5-commands)
6. [Project structure](#6-project-structure)
7. [Deploying to a VPS](#7-deploying-to-a-vps)
8. [Connecting your domain with HTTPS](#8-connecting-your-domain-with-https)
9. [Backups](#9-backups)
10. [Switching to PostgreSQL later](#10-switching-to-postgresql-later)
11. [Moving images to S3 or Cloudinary later](#11-moving-images-to-s3-or-cloudinary-later)
12. [Troubleshooting](#12-troubleshooting)
13. [Security notes](#13-security-notes)

---

## 1. Running it locally

Requirements: **Node.js 20 or newer** (built and tested on 24) and npm. Nothing
else — no database server, no Docker, no accounts.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npx prisma migrate dev      # creates prisma/dev.db and applies the schema
npm run seed                # 8 categories, the attribute lists, 8 demo products
npm run dev                 # http://localhost:3000
```

Then open `.env` and fill in the four blanks: `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH` (next section), `SESSION_SECRET` and `IP_HASH_SALT`
(both from `npm run secret`).

The eight seeded products are **demo data**. They are flagged as such, show a
"Demo" badge in the admin list, and can be filtered and bulk-deleted from
**Products → Status → Demo data** once your own pieces are in.

---

## 2. Creating your admin password

```bash
npm run admin:hash
```

It asks for a password twice (nothing is echoed) and prints a line to paste
into `.env`:

```env
ADMIN_PASSWORD_HASH="\$2b\$12\$kE2v…"
```

> **The backslashes matter.** `.env` files expand `$VAR`, so an unescaped
> bcrypt hash arrives at the application in pieces and the password silently
> never works. `npm run admin:hash` prints it escaped; if you paste a hash from
> somewhere else, escape every `$` as `\$` yourself. The app detects a mangled
> hash and says so in the server log.

Set `ADMIN_EMAIL` to the address you will sign in with. There is exactly one
account — no sign-up page, no user table, no password-reset emails.

Once you are signed in you can change your password from **Studio → Password**,
which stores a new hash in the database that overrides the one in `.env`. If
you are ever locked out, run `npm run admin:reset-db-password` on the server to
fall back to the `.env` hash.

---

## 3. How the WhatsApp ordering works

The WhatsApp number is **not** in the code and **not** in `.env`. It lives in
the database and is edited at **Studio → Site settings**. Every button on the
site reads it from there, and saving a new number updates the whole site
immediately — no rebuild, no deploy.

- **Product page** — "Order on WhatsApp" opens `wa.me/<number>` with the
  message template from Site settings, filled in with the product name, SKU,
  price, chosen quantity and a link back to the page.
- **Inquiry list** — visitors can add several pieces (stored in their browser,
  not on the server), then send one message listing everything with an items
  subtotal. Opening the list refreshes prices from the database, so nobody ever
  quotes you a stale figure.
- **Floating button** — on every page, for general questions.
- **If no number is saved**, every WhatsApp button quietly falls back to the
  Contact page and the dashboard shows a warning. Nothing breaks.

Each click is recorded in the `Inquiry` table — product, quantity, source, and
the visitor's country when the network provides it. Addresses are stored as a
salted hash, never in the clear. **Studio → Inquiries** shows the log;
the dashboard shows which pieces get asked about most.

---

## 4. The admin panel

The panel lives at `/<ADMIN_PATH>` — `/admin` by default. It is never linked
from the public site, never appears in `sitemap.xml` or `robots.txt`, and sends
`noindex` on every response.

**Before going live, change it:**

```env
ADMIN_PATH="studio-7h2k"
```

The panel moves to `/studio-7h2k` and the literal `/admin` path starts
returning an ordinary 404 page.

| Page | What it does |
| --- | --- |
| Dashboard | Counts, most-asked-about pieces, recent additions, warnings |
| Products | Search, filter, bulk publish/unpublish/feature/delete |
| Product editor | All fields, drag-and-drop photographs, reorder, set main image |
| Categories | Add, edit, reorder, category image, delete (blocked while in use) |
| Attributes | Stone types, colours (with swatches) and finishes |
| Testimonials | Add, edit, reorder, publish or hide the customer words on the home page |
| Inquiries | The WhatsApp click log, by source, period and country |
| Site settings | WhatsApp number and template, hero, announcement, contact details, social links, hero image, logo |
| Password | Change your password |
| Backup | Download a zip of the database and every uploaded image |

Uploads are validated (JPEG, PNG, WebP, 15MB each), auto-rotated from EXIF,
stripped of metadata, capped at 2000px and converted to WebP in two sizes plus
a blur placeholder. Originals are not kept — nothing on the site serves them.

---

## 5. Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run check` | Lint, type-check and build — run this before deploying |
| `npm run seed` | Seed categories, attributes and the demo catalogue |
| `npm run db:migrate` | Create and apply a migration after a schema change |
| `npm run db:deploy` | Apply existing migrations (use this on the server) |
| `npm run db:studio` | Prisma Studio, a database browser |
| `npm run admin:hash` | Generate a bcrypt hash for `.env` |
| `npm run admin:reset-db-password` | Fall back to the `.env` password |
| `npm run secret` | Generate `SESSION_SECRET` and `IP_HASH_SALT` |
| `npm run logo:clean` | Rebuild the logo assets from `public/logo.jpeg` |

---

## 6. Project structure

```
app/
  (site)/              public pages — home, shop, category, product, about,
                       custom orders, shipping, FAQ, contact
  admin/               the panel: login + (panel)/ for everything behind auth
    _actions/          server actions (products, categories, attributes,
                       settings, auth) — each re-checks session and CSRF
  api/
    media/[...key]     serves uploaded images with immutable caching
    inquiry            logs WhatsApp clicks (rate-limited)
    inquiry/items      refreshes the inquiry list from the database
    og/[...key]        JPEG renditions for WhatsApp link previews
    admin/upload       image upload (session + CSRF checked)
    admin/backup       zip download of database and uploads
  sitemap.ts robots.ts not-found.tsx error.tsx global-error.tsx
components/
  site/ inquiry/ admin/ ui/ seo/
lib/
  prisma.ts storage.ts images.ts catalog.ts settings.ts whatsapp.ts
  auth.ts session.ts csrf.ts rate-limit.ts revalidate.ts seo.ts …
prisma/
  schema.prisma migrations/ seed.ts dev.db
scripts/              admin-hash, secret, clean-logo, reset-db-password
uploads/              uploaded images (not in git — back this up)
proxy.ts              admin routing, auth gate, CSRF cookie, noindex headers
```

**Caching.** Public pages are statically prerendered and their data is cached
by tag (`products`, `product:<slug>`, `categories`, `settings`…). Admin saves
call `updateTag`, so an edit appears on the live site straight away while
everything else stays cached.

---

## 7. Deploying to a VPS

Any small Linux server will do: 1 vCPU and 1GB of RAM is enough for this site.
The instructions below are for Ubuntu 22.04/24.04 and assume a non-root user
with sudo.

### 7.1 Install Node, PM2 and Nginx

```bash
sudo apt update && sudo apt install -y nginx git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

`build-essential` is needed because `better-sqlite3` and `sharp` compile or
fetch native binaries during install.

### 7.2 Put the code on the server

```bash
sudo mkdir -p /var/www/ytonyx && sudo chown $USER:$USER /var/www/ytonyx
cd /var/www/ytonyx
git clone <your-repository-url> .      # or upload the folder with scp/rsync
npm ci
```

If you copy the project by hand rather than with git, do **not** copy
`node_modules`, `.next`, `.env` or `prisma/dev.db` from your laptop — install
and configure fresh on the server.

### 7.3 Configure

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SITE_URL="https://ytonyx.com"
ADMIN_PATH="studio-7h2k"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD_HASH="\$2b\$12\$…"    # npm run admin:hash
SESSION_SECRET="…"                   # npm run secret
IP_HASH_SALT="…"                     # npm run secret
UPLOADS_DIR="/var/www/ytonyx/uploads"
```

Use **new** secrets on the server — never the ones from your laptop.

### 7.4 Build and start

```bash
npx prisma migrate deploy
npm run seed          # optional: only if you want the demo catalogue
npm run build
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup           # run the command it prints, to survive reboots
```

The app is now on `http://127.0.0.1:3000`.

### 7.5 Nginx in front

```bash
sudo nano /etc/nginx/sites-available/ytonyx
```

```nginx
server {
    listen 80;
    server_name ytonyx.com www.ytonyx.com;

    # Product photographs are large; allow generous uploads in the admin.
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;   # the backup zip can take a moment
    }

    # Immutable build assets, served straight off disk.
    location /_next/static/ {
        alias /var/www/ytonyx/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ytonyx /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`X-Forwarded-For` matters: it is how rate limiting and the country column in
the inquiry log see the real visitor rather than the proxy.

### 7.6 Updating later

```bash
cd /var/www/ytonyx
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload yt-onyx
```

---

## 8. Connecting your domain with HTTPS

1. At your domain registrar, create two **A records** pointing at the server's
   IP address: one for `ytonyx.com`, one for `www`. Wait for them to
   propagate (`ping ytonyx.com` should show your server's IP).
2. Issue a certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ytonyx.com -d www.ytonyx.com
```

Certbot edits the Nginx config, redirects HTTP to HTTPS and installs a renewal
timer. Check renewal works with `sudo certbot renew --dry-run`.

3. Set `NEXT_PUBLIC_SITE_URL="https://ytonyx.com"` in `.env`, then
   `npm run build && pm2 reload yt-onyx`. This value is used for canonical
   URLs, the sitemap, link previews and the product links inside WhatsApp
   messages, so it must match the real address.

HTTPS is also what makes the admin session cookie's `Secure` flag effective.
Do not run the admin over plain HTTP on a public server.

---

## 9. Backups

Two things cannot be rebuilt from the code: **`prisma/dev.db`** and the
**`uploads/`** folder.

**From the admin:** Studio → Backup → *Download backup* gives you a zip with a
consistent database snapshot (taken with SQLite's `VACUUM INTO`, so it is safe
even if someone saves a product mid-backup) plus every image.

**Automatically on the server**, nightly at 03:00:

```bash
mkdir -p /var/backups/ytonyx
crontab -e
```

```cron
0 3 * * * cd /var/www/ytonyx && sqlite3 prisma/dev.db ".backup '/var/backups/ytonyx/db-$(date +\%F).sqlite'" && tar -czf /var/backups/ytonyx/uploads-$(date +\%F).tar.gz uploads && find /var/backups/ytonyx -type f -mtime +30 -delete
```

(`sudo apt install -y sqlite3` for the `.backup` command.) Copy the folder
off the machine regularly — a backup on the same server is not a backup.

**Restoring:** stop the app, put `dev.db` back in `prisma/`, restore the
`uploads/` folder, start the app.

---

## 10. Switching to PostgreSQL later

The schema was written to be portable: money is stored as integer cents, there
are no SQLite-only column types and no raw SQL in the application.

1. `npm install @prisma/adapter-pg pg`
2. In `prisma/schema.prisma`: `provider = "postgresql"`
3. In `lib/prisma.ts`, replace the two `PrismaBetterSqlite3` lines with
   `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
4. Put the connection string in `DATABASE_URL`
5. `npx prisma migrate dev --name init-postgres` against the new database, then
   re-enter your content or import it

One thing to adjust by hand: the product search in `lib/catalog.ts` relies on
SQLite's case-insensitive `LIKE`. On PostgreSQL, add `mode: "insensitive"` to
the `contains` clauses — there is a comment at that spot.

---

## 11. Moving images to S3 or Cloudinary later

Images are referenced everywhere by an opaque *storage key*, never by a path or
a URL. `lib/storage.ts` defines a five-method `StorageAdapter` interface and a
local-disk implementation. Write a second implementation, export it as
`storage`, and the rest of the application is unchanged.

---

## 12. Troubleshooting

**The admin password never works.** The `$` characters in your bcrypt hash were
expanded by `.env`. Escape them as `\$` or re-run `npm run admin:hash`. The
server log says so explicitly when it detects a mangled hash.

**I am locked out.** After five wrong attempts from one address, sign-in is
blocked for fifteen minutes. To reset the password itself, run
`npm run admin:reset-db-password` on the server and sign in with the `.env`
password.

**WhatsApp buttons open the contact page.** No number is saved yet — add it at
Studio → Site settings.

**Images do not appear after a deploy.** `UPLOADS_DIR` is probably pointing
somewhere else, or the folder was not copied across. It is deliberately outside
the build output so that uploads survive deployments.

**Port 3000 is already in use.** Change `PORT` in `ecosystem.config.cjs` and
the `proxy_pass` line in Nginx.

**Clicking an admin link from another site shows the login page.** The session
cookie is `SameSite=Strict`, so it is not sent on cross-site navigations. Open
the panel from a bookmark or by typing the address.

**A deleted product's URL still returns 200.** It serves the "not found" page
with a `noindex` tag. Search engines drop it; the status code stays 200 because
the page shell is streamed before the lookup finishes.

---

## 13. Security notes

- One admin account, defined by `ADMIN_EMAIL` and a bcrypt hash. No sign-up,
  no password-reset-by-email, no user table.
- Sessions are signed JWTs (HS256) in an httpOnly, Secure, SameSite=Strict
  cookie with a neutral name, valid for 7 days. Rotating `SESSION_SECRET`
  signs every session out.
- Login throttling is stored in the database, so it survives a restart.
  Credential checks run bcrypt even for an unknown email, so response times
  reveal nothing.
- Every admin mutation re-checks the session, a double-submit CSRF token and
  the request Origin — a server action is reachable by URL on its own.
- Uploads are type- and size-checked, re-encoded by Sharp (which strips
  metadata, including GPS data from phone photographs) and stored under
  generated names. Storage keys are validated against path traversal.
- Visitor IP addresses are salted and hashed before being stored.
- Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`, HSTS) are set in `next.config.ts`.
- The public site contains no link, hint or comment pointing at the admin, and
  no public page loads any admin JavaScript.

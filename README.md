# MentorCircle — Public Sector Mentorship Platform

A free mentorship service for public sector employees. Mentees register their need for
mentorship, mentors are vetted, mentors scan approved mentee profiles and propose matches —
and the programme owner (you) approves every application and every match.

Full stack in one project:

- **Frontend** — React + TypeScript + Vite + Tailwind + shadcn/ui (`src/`)
- **Backend** — Node.js + Express (`server/`), SQLite database (no separate DB server needed)
- **Auth** — email + password (bcrypt-hashed), signed httpOnly session cookie
- **Email notifications** — via SMTP if configured, otherwise logged to the server console

---

## 1. Running it

Requirements: **Node.js 20+** (22+ recommended). Then:

```bash
npm install          # once
npm run dev          # dev mode with hot reload, serves app + API on one port
```

Open `http://localhost:3000`. To listen on a specific port/host:

```bash
npm run dev -- --port 8080 --host 0.0.0.0
```

## 2. Owner (admin) sign-in

On **first start** an owner account is created and the credentials are printed to the console:

```
Owner (admin) sign in: owner@mentorcircle.local  password: xxxxxxxxxxxx
```

Save that password. To control the credentials yourself, set environment variables before the
first start:

```bash
ADMIN_EMAIL=you@youragency.gov ADMIN_PASSWORD='a-strong-password' npm run dev
```

To **change a password later** (any account, including the owner):

```bash
npm run reset-password -- owner@mentorcircle.local 'new-strong-password'
```

## 3. Piloting with ~10 people

**Quickest option — your own computer on the office network.** Start with `--host 0.0.0.0`
and share `http://<your-computer-IP>:3000` (e.g. `http://192.168.1.20:3000`) with the pilot
group. Works as long as your computer stays on.

**Always-available option — any cheap VPS or PaaS** (Railway, Render, DigitalOcean, a small
VM…):

```bash
npm install
npm run build
npm start            # production mode, serves the built app + API on port 3000
```

Put it behind HTTPS (Caddy, nginx, or the PaaS's built-in TLS) so passwords and sessions are
encrypted in transit — session cookies automatically switch to `Secure` behind HTTPS.
Set `MC_BASE_URL=https://your-domain.gov` so notification emails link correctly.

**With real emails.** Notifications (application received/approved, match proposed/approved)
are logged to the console by default. To send real email, set an SMTP connection string:

```bash
SMTP_URL=smtp://user:password@smtp.yourprovider.com:587 npm start
```

(Gmail, Outlook 365, Mailgun, Brevo, Amazon SES… all work via SMTP.)

**Try it with demo data first** (optional):

```bash
DEMO_SEED=1 npm run dev
```

creates demo accounts you can explore with — `ama@demo.gov`, `kofi@demo.gov`,
`ebo@demo.gov`, `akosua@demo.gov`, all with password `demo1234`.

## 4. How the pilot flows

1. Each participant **creates a free account** (`Apply now`) and applies as a mentee, a mentor, or both.
2. You sign in as owner → **Approvals**: review and approve/reject every application.
3. Approved mentors open **Find Mentees**, scan mentee profiles and **propose a match**.
4. You approve the match; both sides are notified and the mentee sees the mentor's contact details.

## 5. Data & maintenance

- Database: `server/data/mentorcircle.db` (SQLite, created automatically). Back it up by
  copying the file. **To start completely fresh, stop the server and delete `server/data/`.**
- Session signing key: `server/data/secret.key` (generated automatically; keep it private).
- Useful env vars: `PORT`, `HOST`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SMTP_URL`,
  `SMTP_FROM`, `MC_BASE_URL`, `MC_SECRET`, `MC_DATA_DIR`, `DEMO_SEED=1`.

# Deploy the Student Course Portal for **free** (with permanent data)

This app needs to *run code* (Node.js) and *keep data* (logins, courses, files).
GitHub Pages can't do that — it only serves static files. So we use three free
services that work together, none of which need a credit card:

| Piece            | Free service                  | What it stores            |
| ---------------- | ----------------------------- | ------------------------- |
| The app (server) | **Render** (free web service) | runs the Node.js code     |
| Database         | **Turso** (free)              | users, courses, file list |
| Uploaded files   | **Supabase Storage** (free)   | the actual PDFs / docs    |

> ⚠️ Free Render apps **sleep after ~15 min of inactivity** and take a few
> seconds to wake on the next visit. Your data is **not** lost — it lives in
> Turso and Supabase, which persist permanently.

Do the three steps below in order. Total time: ~15 minutes.

---

## Step 1 — Database on Turso (free)

1. Go to <https://turso.tech> and sign up (you can use your GitHub account).
2. Create a database (any name, e.g. `course-portal`).
3. Open the database and copy its **URL** — it looks like
   `libsql://course-portal-yourname.turso.io`.
4. Create a **database token** (auth token) and copy it.

Keep both values — they become `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
(The app creates its tables automatically on first start.)

---

## Step 2 — File storage on Supabase (free)

1. Go to <https://supabase.com> and sign up (GitHub login works).
2. Create a new **project** (pick any name and a region near you).
3. In the left sidebar open **Storage → New bucket**:
   - Name: **`course-files`**
   - Keep it **Private** (the app serves downloads through its own login).
4. In **Project Settings → API**, copy:
   - **Project URL** → becomes `SUPABASE_URL`
   - the **`service_role`** secret key → becomes `SUPABASE_SERVICE_KEY`
     (use the service role key, *not* the anon key — the server needs full access).

---

## Step 3 — Host the app on Render (free)

You can use the one-click Blueprint (recommended) or set it up manually.

### Option A — Blueprint (uses `render.yaml`)

1. Push this repo to GitHub (already done).
2. Go to <https://dashboard.render.com> → **New → Blueprint**.
3. Pick the **`Am1neDev/Website`** repo. Render reads `render.yaml`.
4. When prompted, paste in the values you collected:

   | Variable               | Value                                   |
   | ---------------------- | --------------------------------------- |
   | `ADMIN_EMAIL`          | the email you want for the admin login  |
   | `ADMIN_PASSWORD`       | a strong admin password                 |
   | `TURSO_DATABASE_URL`   | from Step 1                             |
   | `TURSO_AUTH_TOKEN`     | from Step 1                             |
   | `SUPABASE_URL`         | from Step 2                             |
   | `SUPABASE_SERVICE_KEY` | from Step 2 (`service_role` key)        |

   (`JWT_SECRET` is generated automatically; `SUPABASE_BUCKET` defaults to
   `course-files`.)
5. Click **Apply**. Render installs, builds and starts the app, then gives you a
   public URL like `https://student-course-portal.onrender.com`.

### Option B — Manual

1. Render → **New → Web Service** → connect the repo.
2. Build command `npm install`, start command `npm start`,
   health check path `/api/auth/me`.
3. Add every environment variable from the table above (plus `JWT_SECRET` set to
   any long random string, and `SUPABASE_BUCKET=course-files`).
4. **Create Web Service.** Every future `git push` auto-deploys.

---

## After it's live

- Open the Render URL and log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
  That account can add courses and upload files.
- Students click **Sign up** to make their own (student) accounts and download
  files.
- To add sample courses once, you can run `npm run seed` locally **with the
  Turso env vars set**, or just add courses through the UI.

## Running locally (no accounts needed)

Leave the Turso/Supabase variables blank and the app automatically uses a local
SQLite file (`data/`) and local disk (`uploads/`):

```bash
npm install
npm start          # http://localhost:3000
```

## Swapping providers

The same code works with any host that runs Node (Railway, Fly.io, Koyeb).
Turso can be replaced by any libSQL/SQLite-compatible URL, and Supabase Storage
by any S3-style store with small changes in `src/storage.js`.

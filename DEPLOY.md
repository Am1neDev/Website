# Deploying the Student Course Portal to Render

This app has a **Node.js backend + SQLite database + file uploads**, so it can't
run on GitHub Pages (which only serves static files). Instead we host the code
on **GitHub** and run it on **[Render](https://render.com)**.

There are two ways to deploy. The Blueprint way (A) is the simplest.

---

## A. One-click Blueprint (uses `render.yaml`)

1. Push this repo to GitHub (already done).
2. Go to <https://dashboard.render.com> → **New → Blueprint**.
3. Connect your GitHub account and pick the **`Am1neDev/Website`** repo.
4. Render reads [`render.yaml`](./render.yaml) and shows the service to create.
5. Fill in the two secrets it asks for:
   - `ADMIN_EMAIL` — the email for your admin login
   - `ADMIN_PASSWORD` — a strong password for that admin
   (`JWT_SECRET` is generated automatically.)
6. Click **Apply**. Render installs deps, starts the server, and gives you a
   public URL like `https://student-course-portal.onrender.com`.

> The Blueprint requests a **persistent disk** (mounted at `/var/data`) so your
> database and uploaded files survive restarts. Disks require a paid instance
> (Starter, ~$7/mo). For a free throwaway demo, change `plan: starter` to
> `plan: free` and delete the `disk:` block in `render.yaml` — but note data
> will reset on each deploy.

---

## B. Manual setup (no Blueprint)

1. Render dashboard → **New → Web Service** → connect the repo.
2. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/auth/me`
3. Add environment variables (Environment tab):

   | Key              | Value                                  |
   | ---------------- | -------------------------------------- |
   | `JWT_SECRET`     | a long random string                   |
   | `ADMIN_EMAIL`    | your admin email                       |
   | `ADMIN_PASSWORD` | your admin password                    |
   | `MAX_UPLOAD_MB`  | `50`                                   |
   | `DATA_DIR`       | `/var/data/db` (only if you add a disk)|
   | `UPLOAD_DIR`     | `/var/data/uploads` (only with a disk) |

4. (Recommended) **Disks** tab → add a disk, mount path `/var/data`, size 1 GB,
   then set `DATA_DIR` / `UPLOAD_DIR` as above so data persists.
5. **Create Web Service.** Render builds and deploys; every future
   `git push` to the connected branch auto-deploys.

---

## After it's live

- Open the Render URL and log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  you set — that account can add courses and upload files.
- Students click **Sign up** to create their own (student) accounts.
- Don't commit real secrets to the repo; set them in Render's dashboard.

## Other hosts

The same setup works on **Railway** and **Fly.io** — they also run Node and
offer persistent volumes. The only host-specific part is mounting a volume and
pointing `DATA_DIR` / `UPLOAD_DIR` at it.

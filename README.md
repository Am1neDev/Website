# 📚 Student Course Portal

A web application where **students search for their classes and download all the
files they need** (Courses, TD, TP, exams) and **only admins can add courses and
upload files**.

## Features

- 🔎 **Search** courses by code, title, teacher, department or level.
- 📂 **Browse a course** and download its files, grouped by category
  (Course / TD / TP / Exam / Other).
- 👨‍🎓 **Students** can self-register and log in to download files.
- 🔐 **Admins** (and only admins) can create, edit and delete courses, and
  upload or remove files.
- 💾 Self-contained: SQLite database + local file storage. No external services.

## Tech stack

- **Backend:** Node.js + Express
- **Database:** SQLite via libSQL (`@libsql/client`) — a local file in dev,
  free hosted [Turso](https://turso.tech) in production
- **File storage:** local disk in dev, free [Supabase Storage](https://supabase.com)
  in production
- **Auth:** JWT in an httpOnly cookie, passwords hashed with bcrypt
- **Uploads:** Multer (in-memory) handed to the storage layer
- **Frontend:** Vanilla HTML/CSS/JS single-page app (no build step)

The database and storage backends switch automatically based on environment
variables, so the same code runs with zero config locally and on free cloud
services in production. See **[DEPLOY.md](./DEPLOY.md)** for the free hosting guide.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (optional) configure environment
cp .env.example .env      # then edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Start the server
npm start

# 4. (optional) add a few sample courses
npm run seed
```

Then open <http://localhost:3000>.

### Default admin account

On first run an admin account is created automatically from the environment
variables (defaults shown):

| Field    | Value               |
| -------- | ------------------- |
| Email    | `admin@example.com` |
| Password | `admin123`          |

> **Change these** via `.env` (or the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
> environment variables) before deploying anywhere real.

## How roles work

- **Anyone** can search and browse courses.
- **Logged-in students** can download files.
- **Admins only** can add/edit/delete courses and upload/delete files.
  Self-registration always creates a *student* — admin accounts are provisioned
  through the environment variables above (or by promoting a user directly in
  the database).

## API overview

| Method   | Route                       | Access  | Purpose                  |
| -------- | --------------------------- | ------- | ------------------------ |
| `POST`   | `/api/auth/register`        | public  | Create a student account |
| `POST`   | `/api/auth/login`           | public  | Log in                   |
| `POST`   | `/api/auth/logout`          | public  | Log out                  |
| `GET`    | `/api/auth/me`              | public  | Current user             |
| `GET`    | `/api/courses?q=`           | public  | Search / list courses    |
| `GET`    | `/api/courses/:id`          | public  | Course + its files       |
| `POST`   | `/api/courses`              | admin   | Create a course          |
| `PUT`    | `/api/courses/:id`          | admin   | Update a course          |
| `DELETE` | `/api/courses/:id`          | admin   | Delete a course          |
| `POST`   | `/api/courses/:id/files`    | admin   | Upload a file            |
| `GET`    | `/api/files/:id/download`   | student | Download a file          |
| `DELETE` | `/api/files/:id`            | admin   | Delete a file            |

## Project structure

```
.
├── src/
│   ├── server.js   # Express app, routes, bootstrap
│   ├── db.js       # libSQL (local file or Turso) connection + schema
│   ├── storage.js  # File storage (local disk or Supabase Storage)
│   ├── auth.js     # JWT + bcrypt helpers and route guards
│   └── seed.js     # Sample data
├── public/         # Frontend (index.html, styles.css, app.js)
├── uploads/        # Uploaded files in local dev (gitignored)
├── data/           # SQLite database in local dev (gitignored)
├── render.yaml     # Render deployment blueprint
└── DEPLOY.md       # Free hosting guide (Render + Turso + Supabase)
```

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
- **Database:** SQLite (`better-sqlite3`)
- **Auth:** JWT in an httpOnly cookie, passwords hashed with bcrypt
- **Uploads:** Multer (stored under `uploads/`)
- **Frontend:** Vanilla HTML/CSS/JS single-page app (no build step)

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
│   ├── db.js       # SQLite connection + schema
│   ├── auth.js     # JWT + bcrypt helpers and route guards
│   └── seed.js     # Sample data
├── public/         # Frontend (index.html, styles.css, app.js)
├── uploads/        # Uploaded files (gitignored)
└── data/           # SQLite database (gitignored)
```

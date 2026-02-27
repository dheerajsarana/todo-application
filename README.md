# Todo Application

A full-stack todo app with user authentication, priorities, categories, and due dates.

**Stack:** Node.js + Express · SQLite · HTML/CSS/JavaScript · Bootstrap 5

---

## Prerequisites

- [Node.js](https://nodejs.org) (v18 or higher recommended)

Check your version:
```bash
node -v
npm -v
```

---

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Create a `.env` file** in the project root:
```
PORT=8080
JWT_SECRET=change-this-to-a-long-random-secret
```

> Change `JWT_SECRET` to any long random string before using in production.

---

## Running the App

**Development** (auto-restarts on file changes):
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Then open your browser at **http://localhost:8080**

---

## Project Structure

```
todo-application/
├── server/
│   ├── index.js          # Express app entry point
│   ├── db.js             # SQLite database setup
│   ├── middleware/
│   │   └── auth.js       # JWT authentication middleware
│   └── routes/
│       ├── auth.js       # POST /api/auth/register & /api/auth/login
│       └── todos.js      # GET/POST/PUT/DELETE /api/todos
├── public/
│   ├── index.html        # Login / Sign up page
│   ├── app.html          # Main todo app
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       └── app.js
├── .env                  # Environment variables (create this yourself)
├── package.json
└── todo-app.db           # SQLite database file (auto-created on first run)
```

---

## Features

- Register and log in with email + password
- Add, edit, delete, and complete todos
- Set due dates, priority levels (High / Medium / Low), and categories
- Filter by status, category, and priority
- Sort by due date, creation date, or priority

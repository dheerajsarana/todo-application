 Generate a professionally formatted Word document (.docx) for a software engineering project report with the
   following details:
  
  ---
  Project Title: TodoApp — A Full-Stack Task Management Web Application

  ---
  Abstract:
  Write a 150–200 word abstract describing a web-based todo application built using Node.js, Express, SQLite, 
  and Bootstrap 5. The application allows users to register, log in securely using JWT authentication, and    
  manage personal tasks with priorities, categories, and due dates. It includes 7 modules: User
  Authentication, Task Management, Categories, Tags, Comments/Notes, Dashboard/Analytics, Profile Management, 
  and Reminders & Notifications. The system uses browser-based notifications to alert users of due reminders. 
  The goal is to provide a simple, responsive, and secure productivity tool accessible from any browser       
  without installation.

  ---
  Existing System:
  Write 3–4 paragraphs describing the limitations of existing todo/task management tools such as:
  - Most tools are overly complex or require paid subscriptions
  - Lack of integration between tasks, reminders, notes, and analytics in a single lightweight app
  - Privacy concerns with cloud-based tools that store data on external servers
  - No easy way for developers/students to self-host a personal task manager
  - Limited customisation of categories and tags in free-tier tools

  ---
  Proposed System:
  Write 3–4 paragraphs describing the proposed TodoApp that addresses the above limitations:
  - A self-hosted, open-source full-stack web application
  - Secure JWT-based user authentication with bcrypt password hashing
  - All data stored locally in a SQLite database file — no external cloud dependency
  - Modular architecture with 8 independent feature modules
  - Responsive UI built with Bootstrap 5, accessible on desktop and mobile
  - Real-time browser notifications for reminders using the Web Notifications API
  - Simple setup: just Node.js required, runs with npm start

  ---
  Modules — write a clear description (100–150 words each) for every module below:

  1. User Authentication Module
    - Register with email and password (bcrypt hashed)
    - Login returns a JWT token valid for 7 days
    - All protected routes require Bearer token
    - Routes: POST /api/auth/register, POST /api/auth/login
  2. Task Management Module
    - Full CRUD for todos (create, read, update, delete)
    - Each task has: text, priority (high/medium/low), category, due date, completion status
    - Filter by status/category/priority; sort by date or priority
    - Inline editing and double-click to edit on the UI
    - Routes: GET/POST/PUT/DELETE /api/todos
  3. Categories Module
    - Users can create, rename, and delete custom categories beyond built-in defaults
    - Built-in defaults: General, Work, Personal, Shopping, Health
    - Custom categories are per-user and stored in the database
    - Routes: GET/POST/PUT/DELETE /api/categories
  4. Tags Module
    - Users can create freeform tags and attach/detach them to any task
    - Many-to-many relationship between tags and todos via a join table
    - Tags page shows all tags as chips with delete option
    - Routes: GET/POST/DELETE /api/tags, POST/DELETE /api/tags/:id/todos/:todoId
  5. Comments / Notes Module
    - Users can add multiple text notes to any individual task
    - Notes can be edited inline or deleted
    - Accessible via a chat icon on each task card, opens a Bootstrap modal
    - Routes: GET/POST/PUT/DELETE /api/comments
  6. Dashboard / Analytics Module
    - Displays: total tasks, pending, completed, overdue, due today
    - Completion rate shown as a percentage progress bar
    - Breakdown of tasks by priority and by category with mini progress bars
    - Recent 5 tasks listed with priority colour indicators
    - Route: GET /api/dashboard
  7. Profile Management Module
    - View account email and registration date
    - Update display name
    - Change password (requires current password verification)
    - Delete account with all associated data (requires password confirmation)
    - Routes: GET/PUT /api/profile, PUT /api/profile/password, DELETE /api/profile
  8. Reminders & Notifications Module
    - Create reminders with a title, date/time, and optional link to a task
    - Upcoming and past/dismissed reminders shown separately
    - Backend polls for due reminders; frontend polls every 60 seconds
    - Fires native browser OS notifications (Web Notifications API) when a reminder is due
    - In-page dark toast notification as fallback on all pages
    - Dismissed automatically after notification is shown
    - Routes: GET/POST/PUT/DELETE /api/reminders, GET /api/reminders/due, PUT /api/reminders/:id/dismiss      

  ---
  Formatting requirements:
  - Use Heading 1 for main section titles (Abstract, Existing System, etc.)
  - Use Heading 2 for module names
  - Use a professional font: Times New Roman 12pt for body, 14pt bold for headings
  - Add a title page with the project name, subject "Web Application Development", and date
  - Add a Table of Contents after the title page
  - Use justified text alignment throughout
  - Number all pages in the footer
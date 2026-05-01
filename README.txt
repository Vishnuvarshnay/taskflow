================================================================================
  TASKFLOW — Team Task Manager
  Full-Stack Web Application
================================================================================

LIVE URL: https://taskflow-frontend.vercel.app  (update after deployment)
BACKEND:  https://taskflow-backend.railway.app  (update after deployment)
GITHUB:   https://github.com/yourusername/taskflow

--------------------------------------------------------------------------------
  PROJECT OVERVIEW
--------------------------------------------------------------------------------

TaskFlow is a full-stack team task management application where users can
create projects, manage teams, assign tasks, and track progress with
role-based access control (Admin/Member).

--------------------------------------------------------------------------------
  TECH STACK
--------------------------------------------------------------------------------

Backend:
  - Runtime:     Node.js 20+
  - Framework:   Express.js 4.x
  - ORM:         Prisma 5.x
  - Database:    PostgreSQL (hosted on Railway)
  - Auth:        JWT (jsonwebtoken) + bcryptjs
  - Validation:  express-validator

Frontend:
  - Framework:   React 18 + Vite 5
  - Styling:     Tailwind CSS 3
  - Routing:     React Router v6
  - HTTP Client: Axios
  - Notifications: react-hot-toast
  - Dates:       date-fns

Deployment:
  - Backend:     Railway (with PostgreSQL add-on)
  - Frontend:    Vercel

--------------------------------------------------------------------------------
  FEATURES
--------------------------------------------------------------------------------

AUTHENTICATION
  ✓ Signup with name, email, password (hashed with bcrypt)
  ✓ Login with JWT token (7-day expiry)
  ✓ Protected routes — auto-redirect on token expiry
  ✓ Persistent auth via localStorage

PROJECTS
  ✓ Create, read, update, delete projects
  ✓ Creator automatically becomes Admin
  ✓ Invite members by email
  ✓ Remove members
  ✓ View member count, role badges

TASKS
  ✓ Create tasks inside a project
  ✓ Set title, description, priority, status, due date, assignee
  ✓ Filter tasks by status
  ✓ Inline status change from project view
  ✓ Full edit on task detail page
  ✓ Delete task (Admin or creator only)

ROLE-BASED ACCESS CONTROL
  ADMIN role:
    - Create/update/delete the project
    - Add/remove members
    - Change member roles
    - Delete any task

  MEMBER role:
    - View project and tasks
    - Create tasks
    - Update any task status
    - Delete only own tasks

DASHBOARD
  ✓ Summary cards: total projects, my tasks, completed, overdue
  ✓ Task status breakdown (TODO / IN_PROGRESS / IN_REVIEW / DONE)
  ✓ My assigned tasks (sorted by due date)
  ✓ Overdue tasks with count badge
  ✓ Recent activity feed (last 10 updated tasks)

--------------------------------------------------------------------------------
  DATABASE SCHEMA
--------------------------------------------------------------------------------

User
  - id, name, email, password, createdAt, updatedAt

Project
  - id, name, description, ownerId, createdAt, updatedAt

ProjectMember
  - id, userId, projectId, role (ADMIN|MEMBER), joinedAt
  - Unique constraint on (userId, projectId)

Task
  - id, title, description, status, priority, dueDate
  - projectId, assigneeId, creatorId, createdAt, updatedAt

Enums:
  Role:       ADMIN, MEMBER
  TaskStatus: TODO, IN_PROGRESS, IN_REVIEW, DONE
  Priority:   LOW, MEDIUM, HIGH, URGENT

--------------------------------------------------------------------------------
  REST API ENDPOINTS
--------------------------------------------------------------------------------

AUTH
  POST   /api/auth/signup       Create account
  POST   /api/auth/login        Login, returns JWT
  GET    /api/auth/me           Get current user (auth required)

PROJECTS
  GET    /api/projects                        List user's projects
  POST   /api/projects                        Create project
  GET    /api/projects/:id                    Get project + tasks + members
  PUT    /api/projects/:id                    Update project (admin)
  DELETE /api/projects/:id                    Delete project (admin)
  POST   /api/projects/:id/members            Add member by email (admin)
  PUT    /api/projects/:id/members/:userId    Change member role (admin)
  DELETE /api/projects/:id/members/:userId    Remove member (admin)

TASKS
  GET    /api/tasks?projectId=xxx             List tasks (with filters)
  POST   /api/tasks                           Create task
  GET    /api/tasks/:id                       Get single task
  PUT    /api/tasks/:id                       Update task
  DELETE /api/tasks/:id                       Delete task

DASHBOARD
  GET    /api/dashboard                       Aggregated stats for user

--------------------------------------------------------------------------------
  LOCAL DEVELOPMENT SETUP
--------------------------------------------------------------------------------

Prerequisites:
  - Node.js 20+
  - PostgreSQL running locally
  - npm or yarn

BACKEND SETUP:
  1. cd backend
  2. npm install
  3. Copy .env.example to .env and fill in:
       DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
       JWT_SECRET="any-long-random-string"
       PORT=5000
       FRONTEND_URL="http://localhost:5173"
  4. npx prisma db push        (creates tables)
  5. npx prisma generate       (generates client)
  6. npm run dev               (starts on :5000)

FRONTEND SETUP:
  1. cd frontend
  2. npm install
  3. Copy .env.example to .env.local:
       VITE_API_URL=            (leave empty for local proxy)
  4. npm run dev               (starts on :5173)

  Note: vite.config.js proxies /api → http://localhost:5000

--------------------------------------------------------------------------------
  DEPLOYMENT GUIDE (Railway + Vercel)
--------------------------------------------------------------------------------

BACKEND ON RAILWAY:
  1. Go to railway.app → New Project → Deploy from GitHub
  2. Select the /backend folder (or set Root Directory to "backend")
  3. Add a PostgreSQL plugin from Railway dashboard
  4. Set environment variables:
       DATABASE_URL   → auto-set by Railway PostgreSQL plugin
       JWT_SECRET     → generate a random string (use: openssl rand -hex 32)
       FRONTEND_URL   → your Vercel URL (after frontend is deployed)
       PORT           → Railway sets this automatically
  5. Railway uses railway.toml for start command:
       npx prisma migrate deploy && node src/index.js
  6. Note your Railway backend URL (e.g. https://xyz.railway.app)

FRONTEND ON VERCEL:
  1. Go to vercel.com → New Project → Import from GitHub
  2. Set Root Directory to "frontend"
  3. Set environment variables:
       VITE_API_URL → your Railway backend URL (e.g. https://xyz.railway.app)
  4. Deploy!

AFTER BOTH ARE DEPLOYED:
  - Update FRONTEND_URL in Railway backend env to your Vercel URL
  - Redeploy backend (Railway usually triggers auto on env change)

--------------------------------------------------------------------------------
  PROJECT STRUCTURE
--------------------------------------------------------------------------------

taskmanager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          Database schema
│   ├── src/
│   │   ├── index.js               Express app entry
│   │   ├── prisma/
│   │   │   └── client.js          Prisma singleton
│   │   ├── middleware/
│   │   │   └── auth.js            JWT + RBAC middleware
│   │   └── routes/
│   │       ├── auth.js            Auth routes
│   │       ├── projects.js        Project + member routes
│   │       ├── tasks.js           Task CRUD routes
│   │       └── dashboard.js       Dashboard aggregation
│   ├── package.json
│   ├── railway.toml               Railway deployment config
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js           Axios instance + interceptors
    │   ├── context/
    │   │   └── AuthContext.jsx    Global auth state
    │   ├── components/
    │   │   ├── Layout.jsx         Sidebar + main layout
    │   │   ├── Modal.jsx          Reusable modal
    │   │   ├── StatusBadge.jsx    Status color badge
    │   │   └── PriorityBadge.jsx  Priority color badge
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx      Stats + overview
    │   │   ├── Projects.jsx       Project list
    │   │   ├── ProjectDetail.jsx  Tasks + members
    │   │   └── TaskDetail.jsx     Full task view/edit
    │   ├── App.jsx                Routes + providers
    │   ├── main.jsx
    │   └── index.css              Tailwind + custom classes
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example

--------------------------------------------------------------------------------
  SECURITY NOTES
--------------------------------------------------------------------------------

  - Passwords hashed with bcrypt (cost factor 12)
  - JWT tokens expire after 7 days
  - All protected endpoints verify JWT via middleware
  - Role-based access enforced server-side (not just UI)
  - Input validated with express-validator before DB operations
  - Cascade deletes: removing a project deletes all its tasks
  - Users can only interact with projects they are members of

--------------------------------------------------------------------------------
  TIME TAKEN
--------------------------------------------------------------------------------

  Planning & Architecture:  ~1 hour
  Backend (API + DB):       ~4 hours
  Frontend (UI + UX):       ~4 hours
  Deployment:               ~1 hour
  Total:                    ~10 hours

================================================================================

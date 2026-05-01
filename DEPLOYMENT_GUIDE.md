# TaskFlow Deployment Guide

## Project Status: ✅ Ready for Deployment

The TaskFlow project is fully completed and ready to deploy. All code is implemented, dependencies are installed, and the project is committed to git.

---

## Deployment Steps

### Step 1: Push to GitHub

1. Create a new repository on GitHub (https://github.com/new)
2. Run the following commands in the `taskmanager` directory:

```bash
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

### Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub"
3. Select your `taskflow` repository
4. **Important**: Set Root Directory to `backend`
5. Click "Add PostgreSQL" from the project dashboard (this adds the database)
6. Set environment variables in Railway:
   - `JWT_SECRET`: Generate a random string using: `openssl rand -hex 32` (or use any long random string)
   - `FRONTEND_URL`: Leave empty for now (will set after frontend deployment)
   - `PORT`: Railway sets this automatically
   - `DATABASE_URL`: Auto-set by Railway PostgreSQL plugin
7. Click "Deploy"
8. Wait for deployment to complete (Railway will automatically run `npx prisma migrate deploy` as configured in `railway.toml`)
9. Note your Railway backend URL (e.g., `https://taskflow-backend-production.up.railway.app`)

---

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project" → "Import from GitHub"
3. Select your `taskflow` repository
4. **Important**: Set Root Directory to `frontend`
5. Set environment variable:
   - `VITE_API_URL`: Your Railway backend URL (e.g., `https://taskflow-backend-production.up.railway.app`)
6. Click "Deploy"
7. Wait for deployment to complete
8. Note your Vercel frontend URL (e.g., `https://taskflow-frontend.vercel.app`)

---

### Step 4: Update Backend Environment

1. Go back to your Railway project
2. Update the `FRONTEND_URL` environment variable to your Vercel URL
3. Railway will automatically redeploy with the new setting

---

### Step 5: Test the Application

1. Open your Vercel frontend URL in a browser
2. Click "Sign up" to create an account
3. Create a project and add tasks
4. Test all features:
   - Dashboard stats
   - Project creation and management
   - Task creation, editing, and status changes
   - Member invitations
   - Role-based access control

---

## Troubleshooting

### Backend Deployment Issues
- If Prisma migration fails, check the Railway logs
- Ensure PostgreSQL plugin is added before deploying
- Verify `DATABASE_URL` is set automatically by Railway

### Frontend Deployment Issues
- Ensure `VITE_API_URL` is set correctly (must include https://)
- Check Vercel deployment logs for errors
- Verify CORS is configured correctly in backend (it is by default)

### Database Connection Issues
- Railway PostgreSQL may take a few minutes to initialize
- Check Railway logs for connection errors
- Verify the database schema was created (check Prisma migrations)

---

## Local Development (Optional)

If you want to run locally:

1. Install PostgreSQL locally
2. Update `backend/.env` with your local PostgreSQL URL
3. Run `npx prisma db push` in the backend directory
4. Run `npm run dev` in backend (runs on port 5000)
5. Run `npm run dev` in frontend (runs on port 5173)
6. Open http://localhost:5173

---

## Project Structure

```
taskmanager/
├── backend/           # Express.js API with Prisma
│   ├── prisma/       # Database schema
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   └── middleware/ # Auth & RBAC
│   └── railway.toml  # Railway deployment config
└── frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── pages/    # React pages
    │   ├── components/ # UI components
    │   └── context/  # Auth context
    └── vite.config.js # Vite config with proxy
```

---

## Features Implemented

✅ User authentication (signup/login with JWT)
✅ Project management (CRUD operations)
✅ Task management with status, priority, due dates
✅ Role-based access control (Admin/Member)
✅ Dashboard with statistics
✅ Team member management
✅ Responsive UI with Tailwind CSS
✅ Real-time status updates
✅ Overdue task tracking

---

## Support

For issues:
- Check Railway logs for backend errors
- Check Vercel logs for frontend errors
- Review the README.txt for detailed documentation

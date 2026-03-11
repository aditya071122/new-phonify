# Deployment Guide (Free Tier)

This project can be deployed for free using:

- Database: Supabase (PostgreSQL free tier)
- Backend (Django/DRF): Render free web service
- Frontend (Vite): Vercel free plan

---

## 1) Prerequisites

- GitHub account
- Render account
- Vercel account
- Supabase account
- Project pushed to GitHub

---

## 2) Prepare Project Before Deploy

### 2.1 Backend requirements

Make sure `backend/requirements.txt` includes:

```txt
Django>=5.1,<6.0
djangorestframework>=3.15,<4.0
psycopg[binary]>=3.2,<4.0
python-dotenv>=1.0,<2.0
gunicorn>=22,<23
```

### 2.2 Commit and push latest code

```bash
git add .
git commit -m "prepare deployment"
git push origin main
```

---

## 3) Create Production Database (Supabase)

1. Create a new Supabase project.
2. Go to `Project Settings > Database`.
3. Copy these values:
   - Host
   - Port (`5432`)
   - Database name
   - User
   - Password
4. Keep SSL enabled (`sslmode=require`).

---

## 4) Deploy Backend on Render

1. Render Dashboard -> `New` -> `Web Service`.
2. Connect your GitHub repo.
3. Configure:
   - Name: your choice
   - Root Directory: `backend`
   - Build Command:
     ```bash
     pip install -r requirements.txt
     ```
   - Start Command:
     ```bash
     python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
     ```

### 4.1 Add environment variables on Render

Add all of these:

- `DJANGO_SECRET_KEY` = strong random secret
- `DJANGO_DEBUG` = `0`
- `DJANGO_ALLOWED_HOSTS` = `your-service-name.onrender.com`
- `POSTGRES_DB` = Supabase DB name
- `POSTGRES_USER` = Supabase DB user
- `POSTGRES_PASSWORD` = Supabase DB password
- `POSTGRES_HOST` = Supabase DB host
- `POSTGRES_PORT` = `5432`

4. Click `Create Web Service` and wait for deploy.
5. Note backend base URL:
   - `https://your-service-name.onrender.com`

---

## 5) Create Admin User (Without Paid Render Shell)

If Render shell is not available in free plan:

1. Put production DB env vars in your local `backend/.env`.
2. Run from local machine:

```bash
cd backend
python manage.py createsuperuser
```

This creates admin directly in the production Supabase DB.

---

## 6) Deploy Frontend on Vercel

1. Vercel Dashboard -> `Add New...` -> `Project`.
2. Import same GitHub repository.
3. Configure:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variable in Vercel:
   - `VITE_API_BASE_URL=https://your-service-name.onrender.com/api`
5. Deploy.

---

## 7) Post-Deployment Checks

1. Open frontend Vercel URL.
2. Login with admin credentials.
3. Check APIs work:
   - Customers
   - Inventory
   - POS
   - Employees
   - Financial dashboard and report download
4. Verify backend health endpoint:
   - `https://your-service-name.onrender.com/api/health/`

---

## 8) Common Issues and Fixes

### 8.1 Frontend shows API errors / CORS

- Confirm `VITE_API_BASE_URL` is correct in Vercel.
- Confirm backend is up on Render.
- If needed, add CORS configuration in Django for your Vercel domain.

### 8.2 Database connection error

- Recheck Supabase credentials.
- Ensure host/port/user/password are exact.
- Ensure SSL is enabled (`sslmode=require`).

### 8.3 401 Unauthorized

- Login again to refresh auth token.
- Ensure backend and frontend are both on latest deployed version.

---

## 9) Optional: Recommended Production Hardening

- Restrict `DJANGO_ALLOWED_HOSTS` to exact domains only.
- Add CORS whitelist for Vercel domain.
- Rotate `DJANGO_SECRET_KEY` if exposed.
- Add periodic database backups.

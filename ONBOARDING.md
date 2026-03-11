# Onboarding Guide

## Overview

This project is a store-based mobile retail management system with:

- Frontend: `React + Vite + TypeScript`
- Backend: `Django + Django REST Framework`
- Database: `PostgreSQL`
- Auth: `DRF Token Authentication`

The application supports:

- POS sales
- sales records
- buybacks
- repairs
- inventory
- customers
- employees
- expenses
- payments
- downloadable reports

## Project Structure

- Frontend root:
  - `App.tsx`
  - `components/`
  - `views/`
  - `services/api.ts`
- Backend:
  - `backend/backend/`
  - `backend/api/`
  - `backend/manage.py`

## Roles and Access

### Admin

- Django `superuser`
- full access

### Manager

- employee account with:
  - linked auth user
  - employee role set to `Manager`
- same access level as `Admin` in app behavior

### Staff

- normal employee login
- operational access only

## Current Navigation Access

### Admin / Manager

- `Dashboard`
- `Reports`
- `POS Terminal`
- `Expenses`
- `Payments`
- `Customers`
- `Inventory`
- `Employees`

### Staff

- `POS Terminal`
- `Sales`
- `Buyback`
- `Repairs`
- `Customers`

## Local Setup

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Required Backend Environment Variables

Set these in `backend/.env`:

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Notes:

- Backend currently forces PostgreSQL SSL mode to `require` in settings.
- For production, use exact allowed hosts and exact CORS origins.

## Authentication Flow

Login endpoint:

- `POST /api/auth/login/`

Body:

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

Response includes:

- token
- user object
- role (`Admin`, `Manager`, or `Staff`)

Authenticated requests use:

```http
Authorization: Token <token>
```

Logout endpoint:

- `POST /api/auth/logout/`

## Admin Creation

Create the single admin account with:

```bash
cd backend
python manage.py createsuperuser
```

Admin panel:

- `http://127.0.0.1:8000/admin/`

## Employee Credential Management

Employee credentials are managed through the employee module.

### Create employee login

When creating employee:

- `username` optional
- `password` optional
- if one is provided, both are required

### Edit employee login

When editing employee:

- username can be changed
- password can be reset
- if employee has no login yet, both username and password are required to create one
- if employee already has a login, password can be left blank to keep the current password

## API Summary

Main endpoints:

- `GET /api/health/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET|POST /api/stores/`
- `GET|POST /api/customers/`
- `GET|POST /api/employees/`
- `GET|POST /api/products/`
- `GET|POST /api/store-inventory/`
- `GET|POST /api/sales/`
- `GET|POST /api/buybacks/`
- `GET|POST /api/repairs/`
- `GET|POST /api/expenses/`
- `GET|POST /api/payments/`
- `GET /api/reports/brief/download/`

Detail routes also exist for all viewsets:

- `/api/<resource>/<id>/`

## Store Filtering

Store-aware filtering is used across:

- customers
- employees
- products
- store inventory
- sales
- buybacks
- repairs
- expenses
- payments
- reports

Filtering pattern:

```text
?store=<store_id>
```

## POS Behavior

POS now saves real sale metadata:

- `store_ref`
- `job_no`
- `ic_number`
- `cash_amount`
- `online_amount`
- `exchange_amount`
- `exchange_model`
- `got_amount`
- `gift`
- `salesperson_name`

POS also:

- validates stock
- validates payment split
- updates stock after successful sale

## Reports

Report download endpoint:

- `GET /api/reports/brief/download/`

Supported query params:

- `month=YYYY-MM`
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`
- `store=<store_id>`
- `section=<section_name>`

Supported sections:

- `overall`
- `sales`
- `accessories`
- `buybacks`
- `repairs`
- `expenses`
- `payments`
- `inventory`
- `customers`

Important:

- report download is currently CSV-based
- exact screenshot-style print layout is not yet implemented as PDF/sheet rendering

## Current UX Notes

- Top header search has been removed
- Top header notification button has been removed
- Theme toggle remains in header
- Main CRUD modules show success popup confirmation after add/edit/delete

## Important Migration

Make sure this migration is applied:

- `backend/api/migrations/0010_buyback_cash_amount_buyback_exchange_amount_and_more.py`

Run:

```bash
cd backend
python manage.py migrate
```

## Deployment Stack

Current recommended free deployment:

- Database: `Supabase`
- Backend: `Render`
- Frontend: `Vercel`

See:

- [DEPLOYMENT.md](/c:/testtest/DEPLOYMENT.md)

## Key Docs

- Change log:
  - [DOCS_CHANGES.md](/c:/testtest/DOCS_CHANGES.md)
- Backend reference:
  - [backend/README.md](/c:/testtest/backend/README.md)
- Deployment:
  - [DEPLOYMENT.md](/c:/testtest/DEPLOYMENT.md)

## Validation Commands

Backend:

```bash
cd backend
python manage.py check
```

Frontend:

```bash
npm run build
```

## Known Gaps

- overall report screenshot layout is not yet rendered as an exact printable sheet
- some legacy edit flows still use prompt-based UI in a few operational modules
- frontend bundle is large and Vite warns about chunk size during build

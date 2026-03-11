# DRF Backend

## Setup

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example`, then run:

```bash
python manage.py migrate
python manage.py runserver
```

## Required Environment Variables

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_SSLMODE`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`

## Main API Endpoints

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

Standard detail routes also exist for all viewsets:

- `GET|PUT|PATCH|DELETE /api/stores/<id>/`
- `GET|PUT|PATCH|DELETE /api/customers/<id>/`
- `GET|PUT|PATCH|DELETE /api/employees/<id>/`
- `GET|PUT|PATCH|DELETE /api/products/<id>/`
- `GET|PUT|PATCH|DELETE /api/store-inventory/<id>/`
- `GET|PUT|PATCH|DELETE /api/sales/<id>/`
- `GET|PUT|PATCH|DELETE /api/buybacks/<id>/`
- `GET|PUT|PATCH|DELETE /api/repairs/<id>/`
- `GET|PUT|PATCH|DELETE /api/expenses/<id>/`
- `GET|PUT|PATCH|DELETE /api/payments/<id>/`

## Store Filtering

These endpoints support store filtering using `?store=<store_id>`:

- `/api/customers/`
- `/api/employees/`
- `/api/products/`
- `/api/store-inventory/`
- `/api/sales/`
- `/api/buybacks/`
- `/api/repairs/`
- `/api/expenses/`
- `/api/payments/`

## Authentication

This backend uses DRF token authentication.

Login body:

- `username`
- `password`

Authenticated requests use:

- `Authorization: Token <token>`

### Role Rule

- Django superuser logs in as `Admin`
- employee-created login users log in as `Staff`

## Admin Access

Create your single admin credential:

```bash
python manage.py createsuperuser
```

Admin panel:

- `http://127.0.0.1:8000/admin/`

## Employee Credential Creation

`POST /api/employees/` supports optional employee login creation with:

- `username`
- `password`

If both are provided:

- a Django auth user is created
- linked to `Employee.auth_user`
- returned as `login_username`
- authenticated as `Staff`, not `Admin`

Only admin can create, update, or delete employee credentials.

## Report-Oriented Data Support

The backend now stores sheet/report fields for:

- `Sale`
  - `job_no`
  - `ic_number`
  - `cash_amount`
  - `online_amount`
  - `exchange_amount`
  - `exchange_model`
  - `got_amount`
  - `gift`
  - `salesperson_name`

- `Buyback`
  - `job_no`
  - `ic_number`
  - `cash_amount`
  - `online_amount`
  - `exchange_amount`
  - `exchange_model`

- `RepairTicket`
  - `problem`
  - `parts_charge`
  - `got_amount`
  - `in_cash`
  - `in_online`
  - `out_cash`
  - `out_online`

- `Expense`
  - `reason`
  - `out_cash`
  - `out_online`
  - `expense_date`

- `PaymentEntry`
  - `entry_type`
  - `dealer_name`
  - `cash_amount`
  - `online_amount`
  - `entry_date`

## Report Download

Admin report download endpoint:

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

## Latest Migration

Run this migration on your database:

- `backend/api/migrations/0010_buyback_cash_amount_buyback_exchange_amount_and_more.py`

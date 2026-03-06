# Project Change Log (DRF Backend + Frontend Integration)

## Latest Update: Admin + Employee Credentials

### Backend-side changes

- Added `Employee.auth_user` relation to Django auth user:
  - `backend/api/models.py`
  - migration: `backend/api/migrations/0008_employee_auth_user.py`
- Updated employee serializer to support credential-based employee creation:
  - accepts optional `username` and `password` on `POST /api/employees/`
  - creates linked Django auth user when both are provided
  - returns `login_username` in employee response
  - file: `backend/api/serializers.py`
- Enforced role/auth rules:
  - only Django superuser is treated as `Admin` at login
  - employee-created credentials are always non-admin (`Staff`)
  - only admin can create/update/delete employee records/credentials
  - file: `backend/api/views.py`
- Removed seeded `admin` auth user through migration:
  - `backend/api/migrations/0009_remove_seeded_admin_user.py`
  - use your own single backend-created superuser for admin login
- Added backend docs for:
  - creating admin (`python manage.py createsuperuser`)
  - admin panel URL (`/admin/`)
  - employee credential payload behavior
  - file: `backend/README.md`
- Added admin-only brief report download API:
  - `GET /api/reports/brief/download/`
  - supports `month=YYYY-MM` or `from=YYYY-MM-DD&to=YYYY-MM-DD`
  - returns CSV summary report
  - file: `backend/api/views.py`, `backend/api/urls.py`

### Frontend-side changes

- Updated employee API types:
  - `CreateEmployeePayload` now supports optional `username`, `password`
  - `ApiEmployee` now includes optional `login_username`
  - file: `services/api.ts`
- Updated Employee Management UI:
  - Add Employee now has a dedicated credentials section with `username` and `password` fields
  - only Admin sees the credential creation form
  - Employee table now shows `Login` column from backend (`login_username`)
  - file: `views/Employees.tsx`
- Updated Login screen:
  - removed manual role selector (Admin/Staff)
  - authentication is based on username/password only, role comes from backend
  - file: `views/Login.tsx`
- Updated Customer Management:
  - added dedicated Add Customer section (form-based, admin-only)
  - removed prompt-based add flow
  - file: `views/Customers.tsx`
- Updated Inventory Management:
  - added dedicated Add Inventory Item section (form-based, admin-only)
  - connected form to backend `POST /api/products/`
  - file: `views/Inventory.tsx`
- API service updates:
  - added `createProduct()` and `CreateProductPayload`
  - file: `services/api.ts`
- Reports UI updates:
  - Financial Dashboard now includes admin-only “Brief Report Download” section
  - supports month-based or day-range filter and CSV download
  - file: `views/FinancialDashboard.tsx`

## Quick Split: What Changed Where

### Backend-side changes

- Created a new Django REST Framework project inside `backend/`.
- Added API app with models, serializers, viewsets, and URL routing.
- Added health endpoint and CRUD APIs for customers, products, and sales.
- Switched database configuration to PostgreSQL (env variable driven).
- Added backend dependency updates and backend setup documentation.

### Frontend-side changes

- Added a centralized API layer in `services/api.ts`.
- Connected `Customers` page to backend APIs (list + create customer, sales-based stats).
- Connected `POS` page to backend APIs (products/customers load + create sale checkout).
- Connected `Dashboard` page to backend APIs (KPI values + recent sales).
- Added Vite dev proxy for `/api` to backend server.

## 1) Backend Created

The following Django REST Framework backend was added under `backend/`:

- `backend/manage.py`
- `backend/backend/settings.py`
- `backend/backend/urls.py`
- `backend/backend/asgi.py`
- `backend/backend/wsgi.py`
- `backend/backend/__init__.py`
- `backend/api/apps.py`
- `backend/api/models.py`
- `backend/api/serializers.py`
- `backend/api/views.py`
- `backend/api/urls.py`
- `backend/api/admin.py`
- `backend/api/migrations/__init__.py`
- `backend/api/__init__.py`
- `backend/requirements.txt`
- `backend/README.md`
- `backend/.env.example`

## 2) Backend Features Added

- DRF app `api` registered in Django settings.
- Models added:
  - `Customer`
  - `Product`
  - `Sale`
  - `SaleItem`
- Serializers added for all models.
- CRUD ViewSets added:
  - `CustomerViewSet`
  - `ProductViewSet`
  - `SaleViewSet`
- Health endpoint added:
  - `GET /api/health/`
- Router endpoints added:
  - `GET|POST /api/customers/`
  - `GET|PUT|PATCH|DELETE /api/customers/<id>/`
  - `GET|POST /api/products/`
  - `GET|PUT|PATCH|DELETE /api/products/<id>/`
  - `GET|POST /api/sales/`
  - `GET|PUT|PATCH|DELETE /api/sales/<id>/`

## 3) Database Migration to PostgreSQL

`backend/backend/settings.py` was updated from SQLite to PostgreSQL using environment variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`

Dependency added:

- `psycopg[binary]>=3.2,<4.0`

## 4) Frontend Connected to Backend

### New API service file

- `services/api.ts`

This file centralizes all API calls:

- `listCustomers()`
- `createCustomer()`
- `listProducts()`
- `listSales()`
- `createSale()`

### Updated frontend screens

- `views/Customers.tsx`
  - Replaced static customer list with backend data.
  - Loads customers + sales from API and derives:
    - total spent
    - purchases count
    - last visit
  - Add Customer button now creates customer via API.

- `views/POS.tsx`
  - Replaced mock products with products from backend API.
  - Loads customers for lookup/reuse.
  - Checkout now sends sale to backend using `POST /api/sales/`.
  - If typed customer does not exist, creates customer first.

- `views/Dashboard.tsx`
  - Loads sales/customers/products from backend.
  - KPIs now use live API-derived values:
    - today revenue
    - monthly revenue
    - total orders
    - low stock items
    - total customers
    - average order value
  - Recent sales table now populated from backend sales.

### Dev proxy update

- `vite.config.ts` updated to proxy `/api` requests to backend:
  - default: `http://127.0.0.1:8000`
  - override with `VITE_BACKEND_URL`

## 5) Current Status / Remaining Manual Steps

To run successfully on your machine, these still need to be done locally:

1. Install backend dependencies:
   - `pip install -r backend/requirements.txt`
2. Create PostgreSQL DB/user and set env variables.
3. Run backend migrations:
   - `python manage.py makemigrations`
   - `python manage.py migrate`
4. Run backend:
   - `python manage.py runserver`
5. Install frontend dependencies:
   - `npm install`
6. Run frontend:
   - `npm run dev`

## 6) Notes

- Frontend build was not executed successfully yet because `node_modules` is not installed (`vite` missing).
- Migration files for Django models are not generated yet until `makemigrations` is run.

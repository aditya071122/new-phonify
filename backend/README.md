# DRF Backend

## Setup (PostgreSQL)

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` values and set your PostgreSQL credentials.

Then run:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

## Environment Variables

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`

## API Endpoints

- `GET /api/health/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET|POST /api/customers/`
- `GET|POST /api/employees/`
- `GET|POST /api/stores/`
- `GET|POST /api/products/`
- `GET|POST /api/store-inventory/`
- `GET|POST /api/sales/`
- `GET|POST /api/buybacks/`
- `GET|POST /api/repairs/`

The viewsets also support standard detail routes:
- `GET|PUT|PATCH|DELETE /api/customers/<id>/`
- `GET|PUT|PATCH|DELETE /api/employees/<id>/`
- `GET|PUT|PATCH|DELETE /api/stores/<id>/`
- `GET|PUT|PATCH|DELETE /api/products/<id>/`
- `GET|PUT|PATCH|DELETE /api/store-inventory/<id>/`
- `GET|PUT|PATCH|DELETE /api/sales/<id>/`
- `GET|PUT|PATCH|DELETE /api/buybacks/<id>/`
- `GET|PUT|PATCH|DELETE /api/repairs/<id>/`

### Store Filtering

The following list endpoints support `?store=<store_id>` filtering:

- `/api/customers/`
- `/api/employees/`
- `/api/products/`
- `/api/store-inventory/`
- `/api/sales/`
- `/api/buybacks/`
- `/api/repairs/`

## Authentication

This backend uses DRF token authentication.

- Login request body:
  - `username`
  - `password`
- Use returned token in header:
  - `Authorization: Token <token>`

## Admin Access

- Create your own admin:
  - `python manage.py createsuperuser`
- Login to Django admin panel:
  - `http://127.0.0.1:8000/admin/`

## Employee Credential Creation

`POST /api/employees/` can now also create a login user for that employee.

- Optional fields in request body:
  - `username`
  - `password`

If both are provided:
- a Django auth user is created,
- linked to `Employee.auth_user`,
- and returned as `login_username` in employee API response.
- that employee login is always treated as `Staff` in app auth (not `Admin`).

### Permission Rule

- Only `Admin` (Django superuser) can create/update/delete employees and employee credentials.
- Staff users can view employee list but cannot manage credentials.
- Employee logins created from Employee Management are always `Staff` users.

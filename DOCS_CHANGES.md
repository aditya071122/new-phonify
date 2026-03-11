# Project Change Log

## Current Status

- Frontend and backend are connected.
- PostgreSQL is used through the Django backend configuration.
- Role-based access is implemented.
- `Manager` now has the same access level as `Admin` across frontend and backend.
- Store-based filtering is implemented across the main modules and report downloads.
- Admin and Manager have `Dashboard`, `Reports`, and `POS`.
- Staff is operation-focused.
- POS now writes required sale fields to backend and validates stock and payment split.
- Employee edit now supports updating login username and password.
- Add/edit/delete actions now show success popup confirmation in the main CRUD modules.
- Header search and notification buttons have been removed.
- Latest backend migration required:
  - `backend/api/migrations/0010_buyback_cash_amount_buyback_exchange_amount_and_more.py`

## Frontend Changes

### Navigation and role flow

- `Admin` and `Manager` land on `Dashboard`.
- `Staff` lands on `POS Terminal`.
- Sidebar access is now:
  - `Admin` / `Manager`: `Dashboard`, `Reports`, `POS Terminal`, `Expenses`, `Payments`, `Customers`, `Inventory`, `Employees`
  - `Staff`: `POS Terminal`, `Sales`, `Buyback`, `Repairs`, `Customers`
- Top header `search` and `notification` controls were removed.

Files:

- `App.tsx`
- `components/Sidebar.tsx`
- `components/Header.tsx`
- `components/Header.css`
- `types.ts`

### Operational modules

The following modules use backend data and support add/edit/delete behavior in the UI where applicable:

- `Sales`
- `Buyback`
- `Repairs`
- `Inventory`
- `Customers`
- `Employees`
- `Expenses`
- `Payments`

Success popups were added after completed add/edit/delete actions in the main CRUD modules.

Files:

- `views/Sales.tsx`
- `views/Buyback.tsx`
- `views/Repairs.tsx`
- `views/Inventory.tsx`
- `views/Customers.tsx`
- `views/Employees.tsx`
- `views/Expenses.tsx`
- `views/Payments.tsx`

### POS updates

- POS store selector now uses real stores.
- POS saves:
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
- POS validates stock before checkout.
- POS reduces payable total by exchange credit.
- POS updates product stock in UI after successful checkout.

Files:

- `views/POS.tsx`
- `views/POS.css`

### Reports UI

- Admin and Manager have a dedicated report center.
- Report downloads are available section-wise.
- CSV download buttons exist for:
  - `overall`
  - `sales`
  - `accessories`
  - `buybacks`
  - `repairs`
  - `expenses`
  - `payments`
  - `inventory`
  - `customers`
- Report download respects selected date range/month and selected store filter.

File:

- `views/FinancialDashboard.tsx`

### API client updates

- `services/api.ts` includes CRUD helpers for:
  - stores
  - customers
  - employees
  - products
  - sales
  - buybacks
  - repairs
  - expenses
  - payments
- Added report download helper.
- Auth user type now supports `Admin`, `Manager`, and `Staff`.

File:

- `services/api.ts`

## Backend Changes

### Auth and role rules

- Django `superuser` logs in as `Admin`.
- Employee login linked to an employee record with role `Manager` logs in as `Manager`.
- Other employee-created login users log in as `Staff`.
- Backend privileged actions now allow both `Admin` and `Manager`.

Files:

- `backend/api/views.py`
- `backend/api/serializers.py`

### Employee credential support

- `POST /api/employees/` supports optional employee login creation with:
  - `username`
  - `password`
- `PATCH /api/employees/<id>/` now supports:
  - updating `username`
  - updating `password`
  - creating login credentials for an employee who did not already have them
- Employee API response includes `login_username`.

Files:

- `backend/api/serializers.py`

### Store and relationship support

- `Store` relationships are used across:
  - customers
  - employees
  - products
  - sales
  - buybacks
  - repairs
  - expenses
  - payment entries

Main file:

- `backend/api/models.py`

### Sale/report-oriented backend fields

To support sheet/report format, fields exist on:

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
  - `store_ref`

- `PaymentEntry`
  - `entry_type`
  - `dealer_name`
  - `cash_amount`
  - `online_amount`
  - `entry_date`
  - `store_ref`

Files:

- `backend/api/models.py`
- `backend/api/serializers.py`

### Inventory and sale processing

- Sale serializer now exposes the newer sale fields.
- Sale create/update validates stock.
- Sale create/update deducts and restores product stock correctly for non-service items.

File:

- `backend/api/serializers.py`

### API endpoints

Main endpoints:

- `/api/health/`
- `/api/auth/login/`
- `/api/auth/logout/`
- `/api/stores/`
- `/api/customers/`
- `/api/employees/`
- `/api/products/`
- `/api/store-inventory/`
- `/api/sales/`
- `/api/buybacks/`
- `/api/repairs/`
- `/api/expenses/`
- `/api/payments/`
- `/api/reports/brief/download/`

Files:

- `backend/api/urls.py`
- `backend/api/views.py`

### Report export behavior

Privileged CSV exports support these sections:

- `overall`
- `sales`
- `accessories`
- `buybacks`
- `repairs`
- `expenses`
- `payments`
- `inventory`
- `customers`

Exports support:

- store filtering
- day range filtering
- month filtering

## Migrations

Important migration sequence:

- `0008_employee_auth_user.py`
- `0009_remove_seeded_admin_user.py`
- `0010_buyback_cash_amount_buyback_exchange_amount_and_more.py`

## What You Need To Run

### Backend

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
npm run dev
```

## Validation Already Performed

- `python manage.py check` passed
- `npm run build` passed

## Important Note

- Report output currently supports module-wise CSV export.
- If you want the exact screenshot layout as a print-ready sheet or PDF, that is still a separate formatting/export task.

# GitHub Actions CI/CD Setup

This repo now has a starter CI workflow at:

- `.github/workflows/ci.yml`

## What The CI Workflow Does

It runs on:

- every pull request
- pushes to `main`
- pushes to `master`

It has 2 jobs.

### 1. Frontend Build

Runs in the repo root and does:

- `npm ci`
- `npm run build`

This catches:

- broken TypeScript/Vite builds
- import errors
- frontend compile issues

### 2. Backend Checks

Runs in `backend/` and starts a temporary PostgreSQL container inside GitHub Actions.

It then runs:

- `python manage.py makemigrations --check --dry-run`
- `python manage.py migrate --noinput`
- `python manage.py check`
- `python manage.py test`

This catches:

- model changes without migrations
- migration failures
- Django config issues
- backend test failures

## Important Change Made For CI

File changed:

- `backend/backend/settings.py`

Change:

- `POSTGRES_SSLMODE` is now read from env instead of always forcing `require`

Why:

- production Render/Supabase can still use `POSTGRES_SSLMODE=require`
- GitHub Actions local Postgres service needs `POSTGRES_SSLMODE=disable`

## How To Use It

1. Push this repo to GitHub.
2. Open the repository on GitHub.
3. Go to the `Actions` tab.
4. The `CI` workflow will run automatically on PRs and pushes.

## What You Should Add Next

Right now CI is useful, but your project still needs real tests to get full bug-catching value.

Best next additions:

- Django API tests for login, sales, products, customers, reports
- frontend component or integration tests for POS, inventory, login
- smoke tests for critical flows

## Recommended Test Roadmap

### Backend

Add tests for:

- auth login/logout
- product CRUD
- customer CRUD
- sale creation and stock reduction
- report download endpoint
- role-based permissions

Suggested location:

- `backend/api/tests/`

### Frontend

Add tests for:

- login flow
- POS cart flow
- inventory add/edit/delete
- customer create/edit
- route protection by role

Suggested tools:

- `vitest`
- `@testing-library/react`

## How To Turn This Into CD

You have 2 clean options.

### Option 1. Keep deployment outside GitHub Actions

This is the simplest option for your stack.

- Render auto-deploys backend from GitHub
- Vercel auto-deploys frontend from GitHub

Recommended flow:

1. Open PR
2. GitHub Actions CI passes
3. Merge to `main`
4. Render and Vercel deploy automatically

This is the easiest and most reliable setup for now.

### Option 2. Trigger deployment from GitHub Actions

Use this if you want GitHub Actions to control deployment.

You would add another workflow that:

- runs only after CI passes on `main`
- calls Render deploy hook
- triggers Vercel deploy using token/project settings

You will need GitHub secrets for that.

Typical secrets:

- `RENDER_DEPLOY_HOOK_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Recommended Branch Strategy

- protect `main`
- require PR review
- require the `CI` workflow to pass before merge

That gives you a safe bug-fixing loop:

1. create branch
2. make changes
3. open PR
4. CI runs
5. fix failures
6. merge only when green

## Good Next Improvements

- add backend test files so `python manage.py test` covers real business logic
- add frontend test runner and test scripts
- add a deploy workflow only after CI is stable
- add coverage reporting later

## Summary

Current result:

- CI is set up
- frontend build is checked
- backend migrations/config are checked
- backend can run in GitHub Actions with temporary Postgres

## Added Testing Workflow

There is now also a separate workflow at:

- `.github/workflows/testing.yml`

This is more testing-focused than the base CI workflow.

It runs:

- on push
- on pull request
- on manual trigger
- every day on a schedule

It currently does:

- backend smoke tests
- frontend build smoke check
- uploads test/build logs as artifacts

Starter backend tests added:

- `backend/api/tests/test_smoke.py`

These currently verify:

- health endpoint works
- login rejects bad credentials
- login returns a token for valid credentials
- protected API endpoints require authentication

## About "Automatically Fix Bugs"

This is the important reality:

- GitHub Actions can automatically run tests
- GitHub Actions can automatically report failures
- GitHub Actions cannot safely auto-fix arbitrary application bugs by itself

Why:

- most failures need code understanding
- an automatic "fix bot" can easily create bad or dangerous changes
- production/business logic bugs should still go through review

What is realistic to automate safely:

- run tests automatically
- save logs/artifacts automatically
- fail PRs automatically when checks break
- later: auto-fix formatting/lint issues only

So the current setup gives you:

- automatic testing
- automatic failure reporting through GitHub Actions logs and artifacts
- a strong base for adding more real tests

What is still missing for "test fully":

- real automated backend tests
- real automated frontend tests
- optional deployment workflow

# SmileBook - Setup Guide

Dental clinic appointment system (React + Laravel).

## Folder layout
- `smilebook-api/` = the Laravel backend (API)
- `frontend/` = the React (Vite) app

## 1. Backend (Laravel)
```bash
cd smilebook-api
composer install
cp .env.example .env            # skip if you already have a .env
php artisan key:generate
```

Edit `.env`:
```
APP_TIMEZONE=Asia/Manila

# Database: Supabase (PostgreSQL) - see the Supabase section below
DB_CONNECTION=pgsql

# Email (Gmail SMTP for the forgot password OTP; use MAIL_MAILER=log for testing)
MAIL_MAILER=smtp

# SMS (Semaphore - semaphore.co). Leave blank = SMS is written to storage/logs/laravel.log
SMS_API_KEY=
SMS_SENDER=SEMAPHORE
```

Then:
```bash
php artisan migrate --seed
php artisan serve               # http://localhost:8000
```
Demo accounts: admin@smilebook.test / admin123, patient@smilebook.test / patient123

### Supabase database
1. Make a project at supabase.com, then click **Connect** and copy the **Session pooler** details.
2. Put them in `smilebook-api/.env` (see `.env.example`):
```
DB_CONNECTION=pgsql
DB_HOST=aws-0-<region>.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<your database password>
DB_SSLMODE=require
```
3. Turn on `pdo_pgsql` in `php.ini` (remove the `;` before `extension=pdo_pgsql`) and restart Apache.
4. Run `php artisan config:clear` then `php artisan migrate --seed`.

Use the Session pooler (port 5432), not port 6543.

## 2. Frontend (React)
```bash
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev                     # http://localhost:5173
```

## 3. Deploy
- React -> Vercel (set env var `VITE_API_URL=https://your-api-url/api`)
- Laravel -> Render (use a Dockerfile; set the same .env values + a PostgreSQL database)

## Update notes (booking safety + notifications)

- After pulling these changes, run `php artisan migrate` in `smilebook-api`. It adds a database rule so
  the same dentist/date/time can't be booked twice (cancelled appointments don't count).
  If it refuses, two active appointments already share a slot; cancel one and run it again.
  (SQLite and PostgreSQL only. On MySQL/XAMPP the app-level check still applies.)
- Email and SMS are now sent right after the response (`app/Jobs/SendAppointmentNotification.php`),
  so booking no longer waits for Gmail/Semaphore. No queue worker is needed.
- SMS failures (bad API key, no credits, timeout) are now written to `storage/logs/laravel.log`.
- Run the tests with `php artisan test` in `smilebook-api`.

## Update notes (security)

- Run `php artisan migrate` again (adds an `attempts` column for password-reset codes).
- Login: after 5 wrong passwords for the same email, the user must wait 1 minute.
- Password reset: a code allows 5 wrong guesses, then a new code must be requested.
  The new password follows the same rules as sign-up (uppercase, lowercase, number, special character).
- Deploying (e.g. Vercel + hosted API): in the API's `.env` set `APP_ENV=production`, `APP_DEBUG=false`
  and `CORS_ALLOWED_ORIGINS=https://your-frontend-url` (comma-separated if more than one).
  On localhost nothing needs to be set.

## Update notes (Gmail-only + email case + MySQL slot rule)

- Sign-up and Forgot password now accept only a complete Gmail address (example: `juan@gmail.com`).
  The demo accounts (`@smilebook.test`) can still log in, but they can't use Forgot password.
- Emails are saved and compared in lowercase, so `Juan@Gmail.com` and `juan@gmail.com` are the same account.
- `/register` now allows 10 tries per minute per IP.
- Run `php artisan migrate` again. On MySQL/XAMPP it now adds the same no-double-booking rule
  (a small `active_slot_key` column + unique index). On SQLite/PostgreSQL it does nothing new.

## Which .env should I use?

- Supabase (PostgreSQL): copy `smilebook-api/.env.example` to `.env` and fill in the Supabase details.
- Local SQLite (simple demo): copy `smilebook-api/.env.sqlite.example` to `.env`, then run `php artisan migrate --seed`.
- Before sending or submitting the project, run `.\make-submission-zip.ps1` in PowerShell.
  It makes `SmileBook_clean.zip` without `.env`, `.env.backup`, the database file, `.git`, `vendor`, and `node_modules`.
- Never put `.env` or `.env.backup` in a zip or on GitHub. If that already happened, make a new Gmail app password and a new Semaphore API key.

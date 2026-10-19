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

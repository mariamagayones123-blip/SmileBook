# SmileBook

Online dental clinic appointment system. React (Vite) frontend + Laravel API backend.

**Patients** can sign up (or use Google/Facebook), pick a service and dentist, book an open time slot, pay a down payment, then reschedule or cancel from *My Appointments*. They can also leave reviews and send the clinic a message.
**Admins** get a dashboard, can approve, cancel, reschedule or mark appointments as done, and can manage services and dentist schedules.

Good to know:
- **Down payment is a demo.** The page shows a fake QR code and takes no real money (`payment.demo` in `frontend/src/clinicInfo.js`).
- **Notifications are by email only.** SMS (Semaphore) is coded but turned off, because it needs an approved sender name. See "Turning SMS on" below.
- Booking rules: at least 2 days ahead, no double-booking of the same dentist, date and time.

```
backend/    Laravel API
frontend/   React app
```

## Requirements
- PHP 8.2 or newer (with the `pdo_sqlite` extension, or `pdo_pgsql` for Supabase) and [Composer](https://getcomposer.org)
- Node.js 18 or newer (includes npm)

## Quick start (local, Windows PowerShell)

**Terminal 1: backend**
```powershell
cd backend
composer install
copy .env.sqlite.example .env
php artisan key:generate
if (!(Test-Path database\database.sqlite)) { New-Item database\database.sqlite -ItemType File }
php artisan migrate --seed
php artisan serve
```
The API runs at http://localhost:8000.

**Terminal 2: frontend**
```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open http://localhost:5173.

(On Mac/Linux use `cp` instead of `copy`, and `touch database/database.sqlite` to create the database file.)

**Local test accounts** (created because `.env.sqlite.example` has `SEED_DEMO_ACCOUNTS=true`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@smilebook.test | admin123 |
| Patient | patient@smilebook.test | patient123 |

These are for local testing only. To make your own admin instead, set `SEED_DEMO_ACCOUNTS=false`, fill in `ADMIN_EMAIL` and `ADMIN_PASSWORD` (8+ characters) in `backend/.env`, then run `php artisan migrate:fresh --seed`.

To start over with a clean database at any time: `php artisan migrate:fresh --seed`.

## Tests
```powershell
cd backend
php artisan test
```
Check the frontend builds with `npm run build` in `frontend`.

## Email
- Default (`MAIL_MAILER=log`): emails are written to `backend/storage/logs/laravel.log`. This includes the 6-digit code for "Forgot password", so you can test without Gmail.
- Real emails with Gmail: turn on 2-Step Verification, create a 16-character **App Password**, then in `backend/.env` set:
  ```
  MAIL_MAILER=smtp
  MAIL_HOST=smtp.gmail.com
  MAIL_PORT=587
  MAIL_USERNAME=yourclinic@gmail.com
  MAIL_PASSWORD=<the 16-character app password>
  MAIL_FROM_ADDRESS=yourclinic@gmail.com
  ```
  Then run `php artisan config:clear`.
- **Deployed site (Render):** Render's free tier blocks SMTP, so Gmail SMTP will not work there. Use the Gmail mail relay instead (see "Email on Render" below).
- Sign-up and Forgot password accept Gmail addresses only (for example `juan@gmail.com`).
- The "Contact us" form saves the message and emails it to `CONTACT_RECEIVER_EMAIL` (default `smilebook4dental@gmail.com`).

## Supabase (PostgreSQL) instead of SQLite
1. Create a project at supabase.com, click **Connect**, and copy the **Session pooler** details (port 5432, not 6543).
2. Start from `backend/.env.example` (`copy .env.example .env`), then fill in:
   ```
   DB_CONNECTION=pgsql
   DB_HOST=aws-0-<region>.pooler.supabase.com
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.<project-ref>
   DB_PASSWORD=<your database password>
   DB_SSLMODE=require
   ADMIN_EMAIL=you@gmail.com
   ADMIN_PASSWORD=<8+ characters>
   ```
3. Turn on `pdo_pgsql` in `php.ini` (remove the `;` before `extension=pdo_pgsql`) and restart the server.
4. Run `php artisan key:generate`, `php artisan config:clear`, then `php artisan migrate --seed`.

## Deploy
**Frontend (Vercel)**
1. Import the repository and set the **Root Directory** to `frontend`.
2. Add the environment variable `VITE_API_URL=https://<your-backend-url>/api`. Vite reads it at build time, so **redeploy after changing it**.
3. `frontend/vercel.json` already makes page refreshes and direct links (like `/privacy`) work.

**Backend (Render, using the included `backend/Dockerfile`)**
1. On Render: **New > Web Service**, connect the GitHub repository, set **Language** to `Docker` and **Root Directory** to `backend`.
2. Add these environment variables (Environment tab):
```
APP_ENV=production
APP_DEBUG=false
APP_KEY=<output of: php artisan key:generate --show>
APP_URL=https://<your-backend-url>
CORS_ALLOWED_ORIGINS=https://<your-frontend-url>     # comma-separated if more than one
DB_CONNECTION=pgsql
DB_HOST=aws-0-<region>.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<your Supabase database password>
DB_SSLMODE=require
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<a strong password, 8+ characters>
MAILRELAY_URL=<the Google Apps Script web app URL, see "Email on Render" below>
MAILRELAY_SECRET=<the secret you set inside the script>
CONTACT_RECEIVER_EMAIL=<the clinic Gmail that receives Contact us messages>
SMS_ENABLED=false
```
Copy the `DB_*` values from Supabase: **Connect > Session pooler** (port `5432`, not `6543`).
3. Deploy. Every time the container starts it runs `php artisan migrate --force` (creates the tables) and `php artisan db:seed --force` (creates your admin, dentists and services the first time only), so you do not need a shell. Check the **Logs** tab: you should see the migrations run and no `WARNING` lines.
4. Open `https://<your-backend-url>/up`. If the page loads, the API is running. Then put `https://<your-backend-url>/api` in Vercel as `VITE_API_URL`.

Demo accounts are never created when `APP_ENV=production`.
Render's free service goes to sleep when nobody uses it, so the first request after a while can take about a minute. Open the site once before a demo.

## Email on Render
Render's free tier blocks SMTP (ports 25, 465 and 587), so Gmail SMTP cannot be used there. SmileBook sends email through a small Google Apps Script web app (a "mail relay") over HTTPS when `MAILRELAY_URL` is set. The script sends the email from the clinic's Gmail account, so no domain setup is needed.
1. Deploy your Apps Script as a web app and put a secret value inside the script.
2. In Render, set `MAILRELAY_URL` to the web app URL and `MAILRELAY_SECRET` to the same secret.
3. Test on the live site: use **Forgot password** with a Gmail that has an account, and check that the 6-digit code arrives. If not, read the Render logs for a line starting with `Email to ... was NOT sent via relay`.

When `MAILRELAY_URL` is empty (your own computer, the tests), the normal `MAIL_MAILER` setting is used instead.

If you change the frontend URL later, update `CORS_ALLOWED_ORIGINS` too, or login and every API call will be blocked by the browser.

## Google and Facebook sign-in (optional)
The buttons only work after you make free developer apps. If the keys are empty, the buttons simply tell the user that sign-in is unavailable.

**Google**
1. At console.cloud.google.com, create a project, set up the **OAuth consent screen** (External) and add your Gmail under **Test users**.
2. **Credentials > Create credentials > OAuth client ID > Web application**. Under **Authorized JavaScript origins** add `http://localhost:5173` and your deployed frontend URL.
3. Put the Client ID in `backend/.env` as `GOOGLE_CLIENT_ID=` and in `frontend/.env` as `VITE_GOOGLE_CLIENT_ID=`.

**Facebook**
1. At developers.facebook.com, create an app and add **Facebook Login**.
2. In **App settings > Basic**, copy the App ID and App Secret. Also set the **Privacy policy URL** to `https://<your-frontend-url>/privacy` and the data deletion URL to `https://<your-frontend-url>/data-deletion`.
3. `backend/.env`: `FACEBOOK_APP_ID=` and `FACEBOOK_APP_SECRET=`. `frontend/.env`: `VITE_FACEBOOK_APP_ID=` (App ID only; never put the secret in the frontend).
4. In Development mode only people added as testers can log in. Going Live needs the Privacy policy URL from step 2.

Restart `npm run dev` after editing `frontend/.env`. Admin accounts can only log in with email and password.

## Turning SMS on
SMS is off because Semaphore needs an approved sender name. When you have one:
1. `backend/.env`: set `SMS_ENABLED=true`, `SMS_API_KEY=<your Semaphore key>` and `SMS_SENDER=<approved sender name>`.
2. `frontend/src/clinicInfo.js`: set `smsEnabled: true`. The booking form then asks Google/Facebook users for a mobile number, and the Privacy and Terms pages mention SMS again.

With `SMS_ENABLED=true` and an empty `SMS_API_KEY`, messages are only written to `backend/storage/logs/laravel.log`.

## Keeping secrets safe
- Never commit or zip `backend/.env`. `backend/.gitignore` already ignores `.env` and `.env.*`; only the `.env.example` and `.env.sqlite.example` files are shared.
- Also leave out `backend/database/database.sqlite`, `vendor`, and `node_modules` when sending the project.
- If a password or key was ever shared by accident, make a new one (Gmail app password, Facebook App Secret, Supabase database password).

## Troubleshooting
| Problem | Fix |
| --- | --- |
| `Set ADMIN_EMAIL and ADMIN_PASSWORD ... before seeding` | Use `.env.sqlite.example` (demo accounts), or fill in `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. |
| `could not find driver` | Enable `pdo_sqlite` (or `pdo_pgsql`) in `php.ini`, then restart. |
| `Database file ... does not exist` | Create the empty file `backend/database/database.sqlite` (see Quick start). |
| `No application encryption key has been specified` | Run `php artisan key:generate`. |
| Seeding says "already has data" | That is fine. For a clean start run `php artisan migrate:fresh --seed`. |
| Forgot password says "We could not send the email" on the deployed site | Check `MAILRELAY_URL` and `MAILRELAY_SECRET` in Render, and that the Apps Script web app is still deployed. |
| Render says `exec ./docker-entrypoint.sh: no such file` | The file got Windows line endings. The Dockerfile already fixes this; make sure you deployed the latest commit. |
| Login or booking fails on the deployed site | Check `CORS_ALLOWED_ORIGINS` (backend) and `VITE_API_URL` (Vercel, then redeploy). |
| `.env` changes do nothing | Run `php artisan config:clear`. For the frontend, restart `npm run dev`. |

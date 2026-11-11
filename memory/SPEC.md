# RiBa & Fatture — SPEC

App personale (italiano) per registrare le RiBa caricate in banca e ricordare di emettere la fattura a fine mese.

## Auth
- Single-user PIN (env `APP_PIN` in backend/.env, default `1234`). POST /api/auth/login {pin} sets httpOnly cookie `riba_session` (sessions collection). GET /api/auth/me → 401 if not logged. POST /api/auth/logout.
- Frontend: `/login` PIN page; `/` dashboard redirects to /login on 401.

## Data model (collection `riba`)
id, cliente, importo (float >0), data_scadenza (YYYY-MM-DD), data_caricamento (YYYY-MM-DD), note, fatturata (bool), numero_fattura?, data_fattura?, created_at.

## API (all require cookie)
- GET/POST /api/riba, PUT/DELETE /api/riba/{id}
- PATCH /api/riba/{id}/fattura {fatturata, numero_fattura?, data_fattura?} (unmark clears fields; data_fattura defaults to today)
- GET /api/riba/reminder → {today, is_last_day, active, pending_count, pending_total, overdue_count, items}

## Reminder logic (server-side, APP_TZ=Europe/Rome)
- Last day of month: items = all non-invoiced RiBa loaded up to this month (amber banner).
- Other days: items = non-invoiced RiBa loaded in previous months (red "overdue" banner).
- Banner shown only when items non-empty. In-app only (no email).

## Seed
No seed data; create RiBa via UI.

# Temple Inventory Management System

Full-stack web app to manage temple vastra inventory (Pattu Sarees and Pattu Panchas), monthly Kalyanam distributions, reporting, and PDF exports.

## Stack

- Frontend: React + Vite + Tailwind + Framer Motion + Recharts
- Backend: Node.js + Express + MongoDB + JWT
- PDF: jsPDF + html2canvas

## Project Structure

```txt
backend/
frontend/
```

## Quick Start

1. Backend setup:

```bash
cd backend
npm install
cp .env.example .env
```

Set environment variables in `.env`.

Required backend env keys:

- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID` (for Google Sign-In)
- `ADMIN_EMAILS` (comma-separated admin emails)

2. Frontend setup:

```bash
cd ../frontend
npm install
cp .env.example .env
```

3. Run backend:

```bash
cd ../backend
npm run dev
```

4. Run frontend:

```bash
cd ../frontend
npm run dev
```

Default URL: `http://localhost:5173`

## Admin Access Control

- Both `user` and `admin` can sign in using:
  - local email/password
  - Google sign-in
- Role assignment is automatic:
  - emails in `ADMIN_EMAILS` get role `admin`
  - all other emails get role `user`
- Only `admin` can add/distribute/reset/clear inventory.
- Google passwords are managed by Google and are not stored in this app.

## Inventory Safety Actions

- `Reset Stock`: set exact saree/pancha values after physical verification.
- `Clear Stock`: set both values to zero with confirmation.
- Both actions are logged as `ADJUSTMENT` transactions for audit trail.
- History maintenance (admin only):
  - edit a specific log
  - delete a specific log
  - clear all logs (with explicit confirmation)

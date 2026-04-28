# HealthPro

A full-stack doctor appointment platform: patients can browse hospitals, pick a doctor, book and pay for slots; doctors manage their schedules, consultations, and patient history; an AI chatbot helps patients pick the right specialist.

## Tech Stack

**Frontend** — Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Axios.
**Backend** — Spring Boot 3.4, Java 17, Spring Security, Spring Data MongoDB, WebSocket, Spring Mail.
**Database** — MongoDB (Atlas).
**Auth** — JWT (jjwt) + BCrypt.
**Payments** — Razorpay (test mode).
**Email** — Mailtrap SMTP sandbox (signup verification, password reset).
**AI Chatbot** — Google Gemini (`generativelanguage.googleapis.com`) via Spring WebFlux WebClient.

## Repository Layout

```
HealthPro/
└── doctorappointment-new/
    ├── client/             # Next.js frontend (port 3001)
    ├── server-springboot/  # Spring Boot backend (port 8081)
    └── seed.js             # MongoDB seed script for hospitals/doctors
```

## Features

- Patient signup with email verification, login, password reset.
- Hospital and doctor browse, filter by specialization and city.
- Slot picker with real-time availability; auto-expiry of unconfirmed slots.
- Razorpay checkout for paid appointments.
- Doctor dashboard: pending bookings, schedule manager, consultation notes, patient history, reviews.
- AI chatbot to suggest specialists from symptoms.
- Role-based routes (patient / doctor) protected by JWT.

## Prerequisites

- Node.js 18+ and npm
- Java 17 and Maven 3.9+
- A MongoDB Atlas cluster (or local MongoDB)
- Mailtrap account (for SMTP sandbox)
- Razorpay test account (optional, for payments)
- Google Gemini API key (optional, for chatbot)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Devanshadlakha/HealthPro.git
cd HealthPro/doctorappointment-new
```

### 2. Backend — Spring Boot

```bash
cd server-springboot
cp .env.example .env
# Edit .env and fill in real values (see below)
mvn clean package -DskipTests
./run.sh
```

The backend reads `.env` and starts on `http://localhost:8081`.

**Required env vars** (`server-springboot/.env`):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | 64+ char random hex used to sign JWTs |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Mailtrap SMTP credentials |
| `FRONTEND_URL` | Frontend origin (default `http://localhost:3001`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay test keys |
| `RAZORPAY_WEBHOOK_SECRET` | Only if webhooks configured |
| `CHATBOT_API_KEY` | Google Gemini API key |
| `UPLOAD_DIR` | Directory for profile photo uploads (default `uploads`) |

### 3. Frontend — Next.js

```bash
cd ../client
npm install
npm run dev
```

The app runs on `http://localhost:3001`.

### 4. Seed the database (optional)

```bash
cd ..
npm install mongodb
MONGODB_URI="your_connection_string" node seed.js
```

This loads sample hospitals, doctors, and time slots.

## Security Notes

- **Never commit `.env`** — secrets stay out of git via `.gitignore`. Only `.env.example` (with placeholders) belongs in the repo.
- `seed.js` reads `MONGODB_URI` from the environment — do not hardcode credentials.
- Passwords are hashed with BCrypt before persistence.
- Email verification and password-reset tokens are time-bound, single-use.
- Configure `CORS_ALLOWED_ORIGINS` strictly in production.
- Rotate `JWT_SECRET` and database credentials if they are ever exposed.

## API Surface (high level)

- `POST /api/patient/auth/signup`, `/login`, `/verify`, `/forgot-password`, `/reset-password`
- `POST /api/doctor/auth/signup`, `/login`
- `GET /api/hospitals`, `/api/hospitals/{id}/doctors`
- `GET /api/doctors/{id}/slots`, `POST /api/appointments`
- `POST /api/payments/order`, `/verify`
- `GET /api/doctor/appointments`, `POST /api/doctor/consultation/{id}/notes`
- `POST /api/chatbot/suggest`

See controllers under `server-springboot/src/main/java/com/healthpro/doctorappointment/controller/` for the full list.

## License

Personal project. All rights reserved.

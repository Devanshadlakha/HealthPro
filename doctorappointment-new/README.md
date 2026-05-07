# HealthPro — Doctor Appointment Platform

Full-stack appointment + telemedicine app: hospital browsing, slot-based bookings, payments, AI doctor assistant, e-prescriptions, attachments, video consults, reviews, calendar, scheduled email reminders.

## Live Demo

**App:** https://health-pro-smoky.vercel.app

Try it without signing up — pre-seeded accounts:

| Role    | Email                       | Password    |
|---------|-----------------------------|-------------|
| Patient | rahul.verma@gmail.com       | Patient@123 |
| Doctor  | aparna.jaswal@fortis.com    | Doctor@123  |

> First load may take ~30 seconds — the backend wakes from Render free-tier sleep.

## Tech stack
- **Frontend** — Next.js 14 (App Router, TypeScript), Tailwind, Axios
- **Backend** — Spring Boot 3.4, Java 21+, Spring Security, MongoDB Atlas
- **Auth** — JWT in `httpOnly` cookies, BCrypt, login rate limiter
- **Payments** — Razorpay (test or live), plus a "Pay on Visit" path that needs no gateway
- **Email** — Spring Mail (Mailtrap in dev, any SMTP in prod) + scheduled appointment reminders
- **AI** — Pluggable LLM via `CHATBOT_API_URL` (Gemini by default), grounded in DB doctor/hospital data
- **Video calls** — Jitsi Meet rooms (`https://meet.jit.si/healthpro-{appointmentId}`), no API key needed

## Local development

### Prerequisites
- Node.js 18+
- Java 21+
- Maven 3.9+
- A MongoDB Atlas cluster (free tier is fine)

### Backend
```bash
cd server-springboot
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET (64+ random hex chars), MAIL_*, RAZORPAY_*
mvn -DskipTests package
bash run.sh   # loads .env and starts on :8081
```

### Frontend
```bash
cd client
npm install
npm run dev   # :3001
```

Browse to `http://localhost:3001` and create a patient or doctor account.

### Seeding demo data
Set `SEED_TOKEN` in `.env` to any string, then:
```bash
curl -X POST http://localhost:8081/seed/all -H "X-Seed-Token: <your-token>"
```
This creates hospitals, doctors (`Doctor@123`), patients (`Patient@123`), and three days of slots. **Leave `SEED_TOKEN` blank in production** to disable the endpoint.

## Deployment

### Environment variables — required on the backend host
| Variable | Notes |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://...` from Atlas |
| `JWT_SECRET` | Generate with `openssl rand -hex 32` (must be ≥ 32 bytes) |
| `CORS_ALLOWED_ORIGINS` | Exact frontend URL (e.g. `https://your-app.vercel.app`) — comma-separated for multiple. **No wildcards** when cookies are involved. |
| `FRONTEND_URL` | Same value, used for password-reset email links |
| `COOKIE_SECURE` | `true` in production (issues cookies with `Secure` + `SameSite=None`) |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Test keys are fine for portfolio demos |
| `RAZORPAY_WEBHOOK_SECRET` | Only if you wire up the webhook URL on the Razorpay dashboard |
| `CHATBOT_API_KEY` | Optional — chatbot is a no-op if blank |
| `UPLOAD_DIR` | Where uploads live on disk — see "Uploads on free hosts" below |
| `SEED_TOKEN` | Leave blank in prod |

### Environment variables — required on the frontend host
| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | Your deployed backend URL (e.g. `https://healthpro-api.fly.dev`) |

### Auth model — what's safe and what's not
- The JWT lives in an `httpOnly` cookie (`hp_token`) that JavaScript cannot read. This means an XSS does not leak credentials.
- The frontend stores only a non-sensitive `role` flag (`patient` | `doctor`) and a display name in `localStorage`. Neither is treated as proof of authentication; the cookie is.
- Logout calls `POST /patient-auth/logout` or `POST /doctor-auth/logout`, which clears the cookie server-side.
- For cross-origin frontends (Vercel + Render/Fly), set `COOKIE_SECURE=true` so cookies are sent with `SameSite=None; Secure`. Without HTTPS this won't work — make sure both hosts serve HTTPS, which all major free tiers do by default.

### Uploads on free hosts
Patient reports and doctor photos are written to disk under `${UPLOAD_DIR}` and served via `/uploads/**`. **Free hosts handle disk persistence very differently:**

- **Render free tier** — disk is *ephemeral*. Every restart wipes uploads. Free instances also sleep after 15 min of inactivity and rebuild on next request. Acceptable only for a click-through demo where files don't need to outlast a session.
- **Fly.io free tier** — supports a 3 GB persistent volume for free. Best fit. Mount it at `/data/uploads` and set `UPLOAD_DIR=/data/uploads`. See `fly.toml` snippet below.
- **Railway free trial** — has volumes but consumes the $5/mo trial credit.
- **Heroku, Vercel** — backend runs in read-only-ish slug filesystems; do not write user files there.

If you want truly durable uploads on a free host without persistent disk, integrate Cloudinary's free tier (25 GB storage / 25 GB egress per month). That's a code change — happy to add it on request.

#### Fly.io setup snippet
```toml
# fly.toml
[mounts]
  source = "uploads"
  destination = "/data/uploads"

[env]
  UPLOAD_DIR = "/data/uploads"
  COOKIE_SECURE = "true"
  # ... other env vars
```
```bash
fly volumes create uploads --size 3 --region <your-region>
fly deploy
```

### Frontend on Vercel
1. Import the `client/` directory as a project.
2. Set `NEXT_PUBLIC_BACKEND_URL` to your backend URL.
3. Deploy. Vercel handles HTTPS automatically.

### Backend on Fly.io
1. `fly launch` from `server-springboot/`. The included `Dockerfile` is detected.
2. Set secrets:
   ```bash
   fly secrets set MONGODB_URI=... JWT_SECRET=... CORS_ALLOWED_ORIGINS=https://your-app.vercel.app COOKIE_SECURE=true MAIL_HOST=... MAIL_USERNAME=... MAIL_PASSWORD=... RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... CHATBOT_API_KEY=...
   ```
3. Create the volume (above) and deploy.

### Backend on Render
1. New Web Service from `server-springboot/`.
2. Add the env vars from the table above.
3. Set `COOKIE_SECURE=true`. Be aware uploads will reset on every restart — only use this host if that's acceptable for your demo.

## What's intentionally NOT yet production-grade
- Tests + CI (none yet)
- WebSocket/SSE for real-time updates (currently 30s polling)
- Audit logs and structured logging
- HIPAA-style compliance (T&C, privacy, data export, encryption-at-rest config)
- Free-tier object storage integration (Cloudinary/S3) — uploads are disk-bound

For a portfolio demo, the current state is solid. For real patients, the items above must be added.

## Project structure
```
client/                    Next.js frontend
  app/                       App Router pages
    auth/                    Login / signup
    patient/(dashboard)/     Patient app (appointments, prescriptions, attachments)
    patient/(browse)/        Hospital + doctor browsing, AI assistant
    doctor/                  Doctor dashboard, calendar, consultations, bookings
  components/                Cross-page UI (PasswordField, PrescriptionCard)
  lib/axiosConfig.ts         Axios instances with withCredentials

server-springboot/         Spring Boot backend
  src/main/java/com/healthpro/doctorappointment/
    config/                  Security, CORS, MVC, multipart
    controller/              REST endpoints
    service/                 Business logic
    repository/              Mongo repositories
    model/                   Documents
    security/                JWT util, auth filter, cookie factory, rate limiter
    scheduler/               Reminder + slot expiry jobs
  src/main/resources/application.properties
  Dockerfile                 Multi-stage build for Fly.io / Render / etc.
```

## Key endpoints (cookie-authenticated)
- `POST /patient-auth/login` / `/logout` · `POST /doctor-auth/login` / `/logout`
- `GET /hospitals` · `GET /hospitals/{id}/doctors` · `GET /doctors/{id}/profile`
- `POST /slots/book` (patient) · `POST /slots/approve` / `/reject` / `/approve-change` / `/reject-change` (doctor)
- `POST /payment/create-order` / `/verify` / `/pay-on-visit` · `POST /payment/webhook` (signature-verified)
- `POST /patient-appointment/cancel-appointment` / `/request-reschedule` / `/request-video-call` / `/upload-attachment`
- `POST /doctor-appointment/save-notes` / `/save-prescription` / `/mark-consulted`
- `GET /doctor-appointment/calendar?fromDate=&toDate=` · `/upcoming` · `/todays-appointments` · `/patient-history/{id}`
- `POST /chatbot/message`

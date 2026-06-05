# Afterglow Register Backend

Backend API for **Afterglow Register** using:

- Node.js
- Express
- MongoDB Atlas / Mongoose
- JWT authentication
- User and staff roles
- Event assignment permissions
- Public participant registration
- QR code email confirmation
- QR check-in
- Excel report export
- Render deployment ready

## 1. Install

```bash
npm install
```

## 2. Create `.env`

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Important values:

```env
PORT=5000
FRONTEND_URL=http://localhost:5180
API_PUBLIC_URL=http://localhost:5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/afterglow_register?retryWrites=true&w=majority
JWT_SECRET=put_a_long_secret_here
DEFAULT_ADMIN_USERNAME=Afterglow
DEFAULT_ADMIN_PASSWORD=After26
ENABLE_EMAIL=false
```

## 3. Seed default admin

```bash
npm run seed
```

Default login:

```text
Username: Afterglow
Password: After26
```

## 4. Run backend locally

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## 5. Main API endpoints

### Auth

```http
POST /api/auth/login
GET  /api/auth/me
```

Login body:

```json
{
  "username": "Afterglow",
  "password": "After26"
}
```

### Events

```http
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
```

### Public participant registration

```http
POST /api/public/events/:eventId/register
```

Body:

```json
{
  "fullName": "Jean Habimana",
  "email": "jean@example.com",
  "phone": "+250780000000",
  "organization": "MOPAS Ltd",
  "jobTitle": "Manager",
  "country": "Rwanda",
  "category": "Delegate",
  "photoUrl": "https://example.com/photo.jpg"
}
```

### Delegates

```http
GET    /api/events/:eventId/delegates
POST   /api/events/:eventId/delegates
GET    /api/delegates/:id
PUT    /api/delegates/:id
DELETE /api/delegates/:id
POST   /api/delegates/:id/checkin
POST   /api/delegates/:id/resend-email
```

### QR check-in

```http
POST /api/checkin/qr
```

Body can be:

```json
{
  "qrToken": "QR-token-from-email"
}
```

or:

```json
{
  "delegateId": "DEL12345678",
  "eventId": "mongodbEventId"
}
```

or if your QR scanner returns the full JSON payload:

```json
{
  "qrPayload": "{\"eventId\":\"...\",\"delegateId\":\"...\",\"qrToken\":\"...\"}"
}
```

### Users / staff management

```http
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

Create staff body:

```json
{
  "fullName": "Check-in Staff",
  "username": "checkin1",
  "password": "password123",
  "role": "checkin_staff",
  "assignedEvents": ["eventMongoId"],
  "active": true
}
```

Roles:

- `super_admin`
- `event_admin`
- `registration_staff`
- `checkin_staff`
- `badge_staff`

### Reports

```http
GET /api/events/:eventId/reports/summary
GET /api/events/:eventId/reports/export?type=all
GET /api/events/:eventId/reports/export?type=checked
GET /api/events/:eventId/reports/export?type=pending
GET /api/events/:eventId/reports/export?type=category&category=VIP
```

### Settings

```http
GET /api/settings
PUT /api/settings
```

### Uploads

```http
POST /api/uploads
```

Form-data:

```text
file: image_or_pdf
```

For Render production, local uploads are not permanent. For serious production, connect Cloudinary, S3, or Supabase Storage.

## 6. Email delivery

By default:

```env
ENABLE_EMAIL=false
```

This saves email simulation logs in MongoDB.

For real SMTP email delivery, set:

```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Afterglow Register <your_email@gmail.com>"
```

For Gmail, use an app password, not your normal Gmail password.

## 7. Deploy backend to Render

1. Push this backend folder to GitHub.
2. Create a new Web Service on Render.
3. Connect the GitHub repository.
4. Build command:

```bash
npm install && npm run seed
```

5. Start command:

```bash
npm start
```

6. Add environment variables:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_secret
FRONTEND_URL=https://your-frontend-url.onrender.com
API_PUBLIC_URL=https://your-backend-url.onrender.com
ENABLE_EMAIL=false
```

After backend is deployed, update the frontend API base URL to the Render backend URL.

## 8. Frontend integration idea

Create a frontend API helper:

```js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api(path, options = {}) {
  const token = localStorage.getItem("afterglow_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "API error");
  return data;
}
```

Use this backend to replace the current frontend `localStorage` database step by step.

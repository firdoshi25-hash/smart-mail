# Smart Mail

Smart Mail is a responsive email app for registered users, with JWT authentication, inbox and sent mail, live Socket.IO notifications, and optional browser voice announcements.

## Requirements

- Node.js 20.19+ and npm
- MongoDB running locally or a MongoDB Atlas connection string

## Run locally

1. Configure the backend environment. From the project root, copy `.env.example` to `server/.env`, then set `MONGODB_URI` and a private `JWT_SECRET` of at least 32 characters. Keep `server/.env` private; it is ignored by git.
2. Install and start the backend:

   ```sh
   cd server
   npm install
   npm run dev
   ```

3. In a second terminal, install and start the frontend:

   ```sh
   cd client
   npm install
   npm run dev
   ```

4. Open the Vite URL (normally `http://localhost:5173`) and sign in with the address configured in `SMTP_USER`.

The browser connects to the API at `http://localhost:9000/api` and Socket.IO at `http://localhost:9000` by default, matching the backend's `PORT=9000` configuration. If you choose a different backend port, update `PORT` in `server/.env` and set `VITE_API_URL` and `VITE_SOCKET_URL` in `client/.env` to the same port. Set `CLIENT_ORIGIN` in `server/.env` to the frontend origin; comma-separated origins are supported.

## Send real email

Real external email is sent by the server through the authenticated SMTP account. For Gmail, enable 2-step verification and create a Google App Password; use that app password as `SMTP_PASSWORD` (never your normal Gmail password). Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, and `SMTP_USER` to your Gmail address in `server/.env`, then restart the backend. Keep the `.env` file private and never put SMTP credentials in client code or share them in chat.

The Smart Mail account you sign in with must have the same email address as `SMTP_USER`; this prevents spoofing another sender. Once configured, compose can send to any valid email address, whether or not its owner has a Smart Mail account. Messages sent to another Smart Mail user are also saved to their in-app inbox and delivered as live notifications. The Sent folder keeps a copy of external messages too. A successful SMTP submission means the provider accepted the message, not that it is guaranteed to reach the recipient's inbox. This single SMTP-account setup sends as that configured account; supporting multiple users' separate sender addresses requires per-user OAuth/provider authorization.

## Features

- Registration and sign-in with bcrypt password hashing, seven-day JWTs, protected routes, and automatic logout for expired sessions.
- Email inbox, sent mail, unread counts, detail view, read state, and delete action.
- Live, recipient-specific notifications over JWT-authenticated Socket.IO rooms.
- Browser speech synthesis for optional new-mail announcements and reading email content, with play, pause, resume, and stop controls.
- Responsive interface with loading, empty, and error states.

Nodemailer handles external delivery; Socket.IO only provides in-app real-time notifications and is not used to infer SMTP delivery.

## Production notes

Use a unique, randomly generated JWT secret and a restricted MongoDB user. Set `CLIENT_ORIGIN` to the deployed frontend origin, and configure HTTPS and secure hosting for both services. The mail read and delete APIs only operate on messages belonging to the authenticated user.

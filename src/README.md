# INTIMA∞ Backend Server

The powerhouse of the INTIMA∞ ecosystem. A robust Node.js/Express server providing REST APIs, authentication, and intelligent logic.

## 🧠 Core Systems

- **Auth (`auth.ts`)**: Passport-based Google OAuth implementation with session management.
- **AI Engine (`ai.ts`)**: The "IntimaBrain" core handling flirtation generation and relationship analysis.
- **Games (`games.ts`)**: Logic for interactive intimacy games.
- **Storage (`storage.ts`)**: Abstracted data access layer using Drizzle ORM.
- **Routes (`routes.ts`)**: Centralized API definitions for profiles, couples, health logs, and payments.

---

## 🚀 Getting Started

### Environment
The server requires several environment variables defined in the root `.env` file (see root README).

### Run Locally
```bash
npm run dev
```

---

## 🛠 Tech Stack
- [Express](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [MySQL](https://www.mysql.com/)
- [Passport.js](http://www.passportjs.org/)
- [Zod](https://zod.dev/) (Validation)

---

## 📁 Key Files
- `index.ts`: Entry point and server initialization.
- `db.ts`: Connection setup for MySQL.
- `admin.ts`: Administrative routes and oversight.
- `migrate_community.ts`: Utility for migrating community-related data.

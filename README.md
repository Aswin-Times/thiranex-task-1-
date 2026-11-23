# Taskflow

A complete, responsive task management application built for the Thiranex internship task. Taskflow gives every user a private workspace to capture, organise, update, and complete tasks, with live updates across open sessions.

## Features

- Secure account creation and sign-in with hashed passwords and JWT sessions
- User-authorised task data: users can only access their own tasks
- Complete task CRUD: create, read, edit, update status, and delete
- Priority, status, notes, and optional due dates
- Search and status filters
- Progress overview and completion insights
- WebSocket-powered real-time synchronization with automatic reconnection
- Responsive desktop, tablet, and mobile layouts
- Persistent local JSON datastore with atomic writes
- API and component test coverage

## Technology

- Frontend: React, TypeScript, Vite, Lucide icons, date-fns
- Backend: Node.js, Express, Zod, bcrypt, JSON Web Tokens
- Real time: WebSockets (`ws`)
- Testing: Vitest, Testing Library, Supertest

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/Aswin-Times/thiranex-task-1-.git
cd thiranex-task-1-
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The frontend dev server proxies API and WebSocket requests to the backend at `http://localhost:4000`.

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | HTTP and WebSocket server port |
| `JWT_SECRET` | Production | Local development value | Secret used to sign sessions |
| `CLIENT_ORIGIN` | No | Any origin | Allowed frontend origin |
| `DATABASE_FILE` | No | `server/data/db.json` | Persistent datastore path |

Always provide a long, random `JWT_SECRET` in production. Runtime data is intentionally excluded from Git.

## Production

Build the frontend and start the unified server:

```bash
npm ci
npm run build
npm start
```

With `NODE_ENV=production`, Express serves the built React application from `dist` along with the REST API and WebSocket endpoint on one port.

For platforms with an ephemeral filesystem, mount persistent storage and set `DATABASE_FILE` to a path on that volume.

## Validation

```bash
npm run typecheck
npm test
npm run build
npm audit
```

## API overview

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Read the active profile |
| `GET` | `/api/tasks` | List the user's tasks |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/health` | Health check |

All task routes require `Authorization: Bearer <token>`. The WebSocket endpoint is `/ws?token=<token>`.

## Project structure

```text
server/              Express API, authorization, persistence, WebSockets
src/components/      Authentication, dashboard, task UI, and tests
src/App.tsx           Client session and data orchestration
src/api.ts            Typed API client
src/styles.css        Responsive visual system
```


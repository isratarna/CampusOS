# CampusOS — Smart Classroom & AI Timetable Scheduler

A MERN application for running an academic department: a catalogue of **courses**,
a directory of **faculty** with their availability, an inventory of **rooms**, and
an **AI timetable generator** that fits them together without clashes. A Gemini-backed
assistant answers scheduling questions in context, and an alerts inbox surfaces
anything that needs a look.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Data models](#data-models)
- [How timetable generation works](#how-timetable-generation-works)
- [Frontend notes](#frontend-notes)
- [Changelog](#changelog)

---

## Features

**Courses** — catalogue with code, department, credits, semester/year, prerequisites,
course type (`lecture` / `lab` / `seminar`) and weekly hours. Everything a timetable
is built from.

**Faculty** — directory with department, specializations, a per-weekday availability
grid, a weekly hour cap, and preferred / avoided time slots.

**Rooms** — every teachable space: building, floor, capacity, type
(`lecture_hall` / `lab` / `seminar_room` / `auditorium`), equipment, and per-weekday
availability.

**Timetables** — draft, generate, and publish a semester. Each timetable stores its
schedule entries, a `draft` / `published` / `archived` status, a list of detected
conflicts, and metadata (total hours, utilisation rate, conflict count).

**AI timetable generation** — `POST /api/timetables/generate` builds a clash-free
schedule across a fixed weekly slot grid, respecting faculty availability, hour caps
and room fit, and writes a notification when it finishes.

**AI assistant** — `POST /api/ai/chat` passes the user's message plus the current
app context to `gemini-2.5-flash` and returns a scheduling answer. Reachable from
the in-app assistant dock.

**Alerts** — notifications with `info` / `warning` / `error` / `success` types and a
read/unread state.

**Landing page** — a marketing page with a scroll-scrubbed 29-frame teardown of the
dashboard (`frontend/public/sequence/`), painted to a canvas and driven imperatively
so the scrub never waits on a React re-render.

---

## Tech stack

| Layer | What's used |
| --- | --- |
| Frontend | React 19, Vite (rolldown-vite), React Router 7, Tailwind CSS 4, Radix UI primitives, lucide-react, axios, react-markdown |
| Backend | Node.js, Express 5 (ESM), Mongoose 8, CORS, dotenv |
| Database | MongoDB |
| AI | Google Gemini (`@google/genai`), model `gemini-2.5-flash` |

---

## Project structure

```
Smart-Classroom-main/
├── backend/
│   ├── models/
│   │   ├── course.js             # Course schema
│   │   ├── Faculty.js            # Faculty + availability / preferences
│   │   ├── Room.js               # Room + availability
│   │   ├── Timetable.js          # Schedule entries, conflicts, metadata
│   │   └── Notification.js       # Alerts
│   ├── routes/
│   │   ├── coursesRoute.js       # /api/courses
│   │   ├── facultyRoute.js       # /api/faculty
│   │   ├── roomsRoute.js         # /api/rooms
│   │   ├── timetableRoute.js     # /api/timetables (+ /generate)
│   │   ├── aiRoute.js            # /api/ai/chat
│   │   └── notificationsRoute.js # /api/notifications
│   ├── utils/
│   │   ├── dbConnect.js          # Mongoose connection
│   │   └── timetableGenerator.js # Slot grid + Gemini-assisted scheduling
│   └── server.js                 # Express app, CORS, router mounting
│
└── frontend/
    ├── public/sequence/          # PNG frames for the landing teardown
    └── src/
        ├── App.jsx               # Routes: / (landing) + workspace shell
        ├── pages/                # Landing, Dashboard, Courses, Faculty,
        │                         # Rooms, Timetable, Notifications
        ├── components/
        │   ├── app/              # AppShell, Sidebar, Topbar, DataGrid, Form,
        │   │                     # Modal, Toast, StatCard, AssistantDock,
        │   │                     # CampusProvider, nav.js
        │   ├── landing/          # Deconstruct (canvas scrub), hooks, primitives
        │   └── ui/               # shadcn-style primitives
        ├── lib/
        │   ├── api.js            # Single axios instance + error normaliser
        │   ├── domain.js         # Domain helpers
        │   └── utils.js
        └── styles/               # app.css, landing.css
```

---

## Getting started

**Prerequisites:** Node.js 18+, a MongoDB connection string, and a Google AI API key.

**1. Backend**

```bash
cd backend
npm install
# create .env — see below
npm run dev            # nodemon server.js
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev            # Vite dev server on http://localhost:5173
```

The frontend talks to `http://localhost:5000/api` by default. Open the landing page
at `/` and the workspace at `/dashboard`.

**Frontend scripts:** `npm run dev` · `npm run build` · `npm run preview` · `npm run lint`

---

## Environment variables

`backend/.env`:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
GOOGLE_API_KEY=your_google_ai_api_key
```

> `server.js` listens on `process.env.PORT` directly, so `PORT` must be set.

`frontend/.env` (optional — only needed to point at a deployed API):

```
VITE_API_URL=https://your-api-host/api
```

---

## API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/courses` | List courses |
| GET | `/courses/:id` | One course |
| POST | `/courses` | Create a course |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete a course |
| GET | `/faculty` · `/faculty/:id` | List all / one faculty member |
| POST · PUT · DELETE | `/faculty` · `/faculty/:id` | Create / update / delete |
| GET | `/rooms` · `/rooms/:id` | List all / one room |
| POST · PUT · DELETE | `/rooms` · `/rooms/:id` | Create / update / delete |
| GET | `/timetables` · `/timetables/:id` | List all / one timetable |
| POST · PUT · DELETE | `/timetables` · `/timetables/:id` | Create / update / delete |
| POST | `/timetables/generate` | Generate a schedule |
| GET | `/notifications` | List alerts |
| POST | `/notifications` | Create an alert |
| PUT | `/notifications/:id/read` | Mark an alert read |
| DELETE | `/notifications/:id` | Delete an alert |
| POST | `/ai/chat` | `{ message, context }` → `{ response }` |

---

## Data models

**Course** — `name`, `code` (unique), `department`, `credits`, `semester`, `year`,
`description`, `duration` (weeks, default 13), `prerequisites[]`,
`type` (`lecture` / `lab` / `seminar`), `hoursPerWeek` (default 3).

**Faculty** — `name`, `email` (unique), `department`, `specialization[]`,
`availability` (per weekday, arrays of `{ start, end }`), `maxHoursPerWeek`,
`preferences.preferredTimeSlots[]` / `avoidTimeSlots[]`.

**Room** — `name`, `building`, `floor`, `capacity`,
`type` (`lecture_hall` / `lab` / `seminar_room` / `auditorium`), `equipment[]`,
`availability` (per weekday).

**Timetable** — `name`, `semester`, `year`, `department`,
`schedule[]` of `{ courseId, facultyId, roomId, day, startTime, endTime }`,
`status` (`draft` / `published` / `archived`), `conflicts[]`,
`metadata { totalHours, utilizationRate, conflictCount }`.

**Notification** — `title`, `message`, `type` (`info` / `warning` / `error` /
`success`), `isRead`, `createdAt`.

---

## How timetable generation works

`backend/utils/timetableGenerator.js` works against a fixed weekly grid:

- **Days:** Monday–Friday
- **Slots:** 09:00–10:00, 10:00–11:00, 11:15–12:15, 14:15–15:15, 15:15–16:15, 16:30–17:30
- **Break:** 12:15–13:15, never scheduled
- **Term length:** 13 weeks — a course's weekly session count is
  `ceil(totalHours / 13)`, falling back to `hoursPerWeek` (default 3)

Courses, faculty and rooms are pulled from MongoDB, Gemini proposes assignments,
the response is parsed and validated against faculty availability, hour caps and
room fit, and the result is saved as a `Timetable` with any conflicts recorded.
A `Notification` is written when generation completes.

---

## Frontend notes

- **One shared cache.** `CampusProvider` holds all five collections (courses,
  faculty, rooms, timetables, notifications). Pages render from it instantly on
  navigation and call `refresh(key)` after a mutation, so the sidebar badge, the
  dashboard totals and each page's list can never disagree.
- **One nav model.** `components/app/nav.js` is the single source of truth for the
  sidebar, the topbar breadcrumb and each page's sub-menu. Sub-views double as deep
  links via `?view=<id>`.
- **One axios instance.** `lib/api.js` sets the base URL (overridable with
  `VITE_API_URL`), and `apiError()` turns any failure into a readable message.
- **Landing teardown.** `components/landing/Deconstruct.jsx` scrubs the PNG frame
  sequence on a canvas as you scroll, cross-fading between frames and interpolating
  the page background from each frame's own edge colours so there is no visible
  canvas box.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the running log of changes to this project.

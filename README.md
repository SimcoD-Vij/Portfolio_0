# Developer Portfolio System

A full-stack developer portfolio with admin panel, case study blogs, domain theming, and a chatbot. One command to run everything.

## Quick Start

```bash
# 1. Clone / download this folder
cd portfolio

# 2. Start everything (builds Docker images, installs dependencies, seeds sample data)
docker-compose up --build

# 3. Open in browser
# Portfolio:  http://localhost:3000
# Admin:      http://localhost:3000/admin/login.html
# API:        http://localhost:4000/api/health
```

**Default admin credentials:** `admin` / `admin123`  
Change these in `docker-compose.yml` before deploying publicly.

---

## What's included

| Feature | Details |
|---|---|
| Public portfolio | Homepage with domain filter + animated theme |
| Project cards | Title, domain badge, tech stack, CTA buttons |
| Case study blogs | 7 structured sections + unlimited custom sections |
| Admin dashboard | Full CRUD, publish/draft toggle |
| Project editor | All fields editable including custom blog sections |
| JWT auth | Secure admin login, 24h token expiry |
| Chatbot | Keyword-matching, answers questions from published projects |
| Sample data | 3 sample projects seeded on first run |
| Docker | One-command setup, SQLite data persisted in a volume |

---

## Changing admin credentials

Edit `docker-compose.yml`:

```yaml
environment:
  - ADMIN_USERNAME=yourname
  - ADMIN_PASSWORD=yourpassword
  - JWT_SECRET=some_long_random_string_here
```

Then restart:
```bash
docker-compose down && docker-compose up --build
```

---

## Project structure

```
portfolio/
├── backend/               # Node.js + Express API
│   ├── server.js          # Main entry point
│   ├── db.js              # SQLite schema + seeding
│   ├── routes/
│   │   ├── auth.js        # Login + token verify
│   │   ├── projects.js    # Public project routes
│   │   ├── blogs.js       # Public blog routes
│   │   ├── chatbot.js     # Chatbot endpoint
│   │   └── admin.js       # All admin CRUD (JWT protected)
│   └── middleware/auth.js # JWT verification
│
├── frontend/              # Static HTML + Tailwind CSS
│   ├── index.html         # Homepage + domain filter
│   ├── projects.html      # Projects listing
│   ├── blog.html          # Case study reader
│   ├── admin/
│   │   ├── login.html     # Admin login
│   │   ├── dashboard.html # Project management
│   │   └── editor.html    # Project + blog editor
│   └── js/
│       ├── api.js         # Fetch wrapper + auth helpers
│       ├── themes.js      # Domain color themes
│       └── chatbot.js     # Floating chatbot widget
│
└── docker-compose.yml     # Orchestrates frontend + backend
```

---

## API Reference

### Public (no auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | All published projects |
| GET | `/api/projects/domains` | Distinct published domains |
| GET | `/api/projects/:slug` | Single published project |
| GET | `/api/blog/:slug` | Published case study |
| POST | `/api/chatbot` | `{query}` → `{reply}` |

### Admin (Bearer token required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | `{username, password}` → `{token}` |
| GET | `/api/admin/projects` | All projects (including drafts) |
| POST | `/api/admin/projects` | Create project |
| PUT | `/api/admin/projects/:id` | Update project |
| DELETE | `/api/admin/projects/:id` | Delete project |
| PUT | `/api/admin/projects/:id/publish` | Toggle draft ↔ published |
| PUT | `/api/admin/blog/:id` | Update blog content |
| POST | `/api/admin/sections` | Add custom section |
| PUT | `/api/admin/sections/:id` | Update custom section |
| DELETE | `/api/admin/sections/:id` | Delete custom section |
| GET | `/api/admin/stats` | Dashboard stats |

---

## Deploying to production

### Backend → Render.com (free)
1. Push `backend/` folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Set environment variables: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
4. Build command: `npm install`, Start command: `node server.js`

### Frontend → Vercel (free)
1. Update `API_BASE` in `frontend/js/api.js` to your Render URL
2. Push `frontend/` to GitHub
3. Import into Vercel — deploy as static site

---

## Upgrading the chatbot to use an LLM

In `backend/routes/chatbot.js`, replace the scoring block with:

```js
const { OpenAI } = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const context = projects.map(p => `Project: ${p.title}\nDomain: ${p.domain}\n${p.short_desc}\nTech: ${JSON.parse(p.tech_stack).join(', ')}`).join('\n\n');

const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: `You are a helpful assistant for a developer portfolio. Here are the projects:\n\n${context}\n\nOnly answer based on this data.` },
    { role: 'user', content: query }
  ]
});
return res.json({ reply: completion.choices[0].message.content });
```

---

## Upgrading SQLite → PostgreSQL

1. `npm install pg` in backend
2. Replace `better-sqlite3` calls with `pg` pool queries  
3. The schema SQL is identical — just change `AUTOINCREMENT` to `SERIAL`

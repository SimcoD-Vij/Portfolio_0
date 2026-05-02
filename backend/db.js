const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'portfolio.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    domain      TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    short_desc  TEXT,
    tech_stack  TEXT DEFAULT '[]',
    demo_link   TEXT,
    github_link TEXT,
    status      TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    problem     TEXT DEFAULT '',
    approach    TEXT DEFAULT '',
    tech_detail TEXT DEFAULT '',
    challenges  TEXT DEFAULT '',
    mistakes    TEXT DEFAULT '',
    result      TEXT DEFAULT '',
    learnings   TEXT DEFAULT '',
    is_public   INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id     INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    content     TEXT DEFAULT '',
    position    INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Seed admin user ──────────────────────────────────────────────────────────
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(adminUsername);
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run(adminUsername, hash);
  console.log(`✅ Admin user created: ${adminUsername}`);
}

// ── Seed sample projects ─────────────────────────────────────────────────────
const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
if (projectCount === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (title, domain, slug, short_desc, tech_stack, demo_link, github_link, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertBlog = db.prepare(`
    INSERT INTO blogs (project_id, problem, approach, tech_detail, challenges, mistakes, result, learnings, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const samples = [
    {
      title: 'AI Image Classifier',
      domain: 'AI',
      slug: 'ai-image-classifier',
      short_desc: 'A convolutional neural network that classifies images into 10 categories with 94% accuracy using transfer learning on ResNet50.',
      tech_stack: JSON.stringify(['Python', 'PyTorch', 'FastAPI', 'React', 'Docker']),
      demo_link: 'https://demo.example.com',
      github_link: 'https://github.com/example',
      status: 'published',
      blog: {
        problem: 'Building an accurate image classifier that could run in real-time on a web browser without expensive GPU infrastructure.',
        approach: 'Used transfer learning on a pre-trained ResNet50 model, fine-tuned on a custom dataset of 50,000 images. Served via FastAPI with async endpoints.',
        tech_detail: 'PyTorch for model training, FastAPI for the REST API, React frontend with drag-and-drop upload, Docker for containerization.',
        challenges: 'The main challenge was reducing inference latency. Initial model took 800ms per image. Switched to ONNX runtime and brought it to 120ms.',
        mistakes: 'Initially trained from scratch — poor results. Lesson: always start with transfer learning. Also forgot to normalize input images, causing weird predictions.',
        result: '94.2% top-1 accuracy on test set. Average inference time 120ms. Deployed and handling ~500 requests/day.',
        learnings: 'Transfer learning is almost always the right starting point. ONNX is underrated for production inference. Preprocessing bugs are the most common source of accuracy drops.',
      }
    },
    {
      title: 'Smart Home Dashboard',
      domain: 'IoT',
      slug: 'smart-home-dashboard',
      short_desc: 'Real-time IoT dashboard that monitors and controls 12 home devices using MQTT protocol with live sensor data visualization.',
      tech_stack: JSON.stringify(['Node.js', 'MQTT', 'InfluxDB', 'Grafana', 'Raspberry Pi']),
      demo_link: '',
      github_link: 'https://github.com/example',
      status: 'published',
      blog: {
        problem: 'Existing smart home apps were either too expensive or didn\'t support older non-WiFi devices. Needed a unified dashboard for mixed device types.',
        approach: 'Used MQTT as the universal protocol, wrote adapters for each device type, and stored time-series data in InfluxDB for historical analysis.',
        tech_detail: 'Raspberry Pi 4 as the central hub, Mosquitto MQTT broker, custom Node.js device adapters, InfluxDB + Grafana for visualization.',
        challenges: 'Handling unreliable network connections from IoT devices. Implemented a retry queue and last-known-value cache so the UI never shows stale data without warning.',
        mistakes: 'First version polled devices every second — killed the RPi. Switched to event-driven MQTT subscriptions. CPU usage dropped from 80% to 4%.',
        result: '12 devices connected, sub-100ms update latency, 99.7% uptime over 6 months. Saves ~15 min/day on manual checks.',
        learnings: 'Event-driven beats polling every time for IoT. InfluxDB is perfect for sensor data — don\'t use a relational DB for time series.',
      }
    },
    {
      title: 'Dev Portfolio CMS',
      domain: 'Web',
      slug: 'dev-portfolio-cms',
      short_desc: 'This very portfolio system — a full-stack CMS with admin panel, blog engine, JWT auth, and dynamic domain-based theming.',
      tech_stack: JSON.stringify(['Node.js', 'Express', 'SQLite', 'Tailwind CSS', 'Docker']),
      demo_link: '',
      github_link: 'https://github.com/example',
      status: 'published',
      blog: {
        problem: 'Static portfolio sites are hard to update and don\'t scale. Wanted a real CMS with draft/publish workflow, case study blogs, and easy content management.',
        approach: 'Built a 3-layer system: public portfolio, private admin panel, and REST API backend. Used SQLite for simplicity with a path to PostgreSQL.',
        tech_detail: 'Express REST API, better-sqlite3, JWT authentication, vanilla JS frontend with Tailwind CSS, Docker for one-command deployment.',
        challenges: 'Keeping the admin panel completely decoupled from the public site while sharing the same database. Solved with API-level filtering based on JWT presence.',
        mistakes: 'Tried to build an SPA first — too complex. Went back to multi-page HTML with a clean JS fetch layer. Simpler and more maintainable.',
        result: 'Fully functional CMS deployed in Docker. Admin panel, publish workflow, case study blogs, domain theming, and chatbot all working.',
        learnings: 'Simplicity wins. SQLite is underused in production — it handles hundreds of concurrent reads fine. Multi-page apps are often better than SPAs for content sites.',
      }
    }
  ];

  for (const s of samples) {
    const { lastInsertRowid } = insertProject.run(s.title, s.domain, s.slug, s.short_desc, s.tech_stack, s.demo_link, s.github_link, s.status);
    insertBlog.run(lastInsertRowid, s.blog.problem, s.blog.approach, s.blog.tech_detail, s.blog.challenges, s.blog.mistakes, s.blog.result, s.blog.learnings, s.status === 'published' ? 1 : 0);
  }
  console.log('✅ Sample projects seeded');
}

module.exports = db;

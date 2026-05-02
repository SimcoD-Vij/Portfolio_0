const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const db = require('../db');
const auth = require('../middleware/auth');

// All admin routes require valid JWT
router.use(auth);

// ── Projects ─────────────────────────────────────────────────────────────────

// GET /api/admin/projects — all (including drafts)
router.get('/projects', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, b.id as blog_id, b.is_public
    FROM projects p
    LEFT JOIN blogs b ON b.project_id = p.id
    ORDER BY p.created_at DESC
  `).all();
  projects.forEach(p => { p.tech_stack = JSON.parse(p.tech_stack || '[]'); });
  res.json(projects);
});

// GET /api/admin/projects/:id — single with full blog
router.get('/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  project.tech_stack = JSON.parse(project.tech_stack || '[]');

  const blog = db.prepare('SELECT * FROM blogs WHERE project_id = ?').get(project.id);
  if (blog) {
    blog.sections = db.prepare('SELECT * FROM sections WHERE blog_id = ? ORDER BY position ASC, id ASC').all(blog.id);
    project.blog = blog;
  }
  res.json(project);
});

// POST /api/admin/projects — create
router.post('/projects', (req, res) => {
  const { title, domain, short_desc, tech_stack, demo_link, github_link } = req.body;
  if (!title || !domain) return res.status(400).json({ error: 'Title and domain required' });

  let slug = slugify(title, { lower: true, strict: true });
  // Ensure unique slug
  let suffix = 0;
  while (db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug + (suffix ? `-${suffix}` : ''))) {
    suffix++;
  }
  if (suffix) slug = `${slug}-${suffix}`;

  const stackStr = JSON.stringify(Array.isArray(tech_stack) ? tech_stack : []);
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO projects (title, domain, slug, short_desc, tech_stack, demo_link, github_link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, domain, slug, short_desc || '', stackStr, demo_link || '', github_link || '');

  // Auto-create empty blog
  db.prepare('INSERT INTO blogs (project_id) VALUES (?)').run(lastInsertRowid);

  res.status(201).json({ id: lastInsertRowid, slug });
});

// PUT /api/admin/projects/:id — update
router.put('/projects/:id', (req, res) => {
  const { title, domain, short_desc, tech_stack, demo_link, github_link } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const stackStr = tech_stack !== undefined
    ? JSON.stringify(Array.isArray(tech_stack) ? tech_stack : [])
    : project.tech_stack;

  db.prepare(`
    UPDATE projects SET
      title = ?, domain = ?, short_desc = ?, tech_stack = ?,
      demo_link = ?, github_link = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title ?? project.title,
    domain ?? project.domain,
    short_desc ?? project.short_desc,
    stackStr,
    demo_link ?? project.demo_link,
    github_link ?? project.github_link,
    req.params.id
  );
  res.json({ success: true });
});

// DELETE /api/admin/projects/:id
router.delete('/projects/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// PUT /api/admin/projects/:id/publish — toggle draft ↔ published
router.put('/projects/:id/publish', (req, res) => {
  const project = db.prepare('SELECT status FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const newStatus = project.status === 'published' ? 'draft' : 'published';
  const isPublic = newStatus === 'published' ? 1 : 0;

  db.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, req.params.id);
  db.prepare('UPDATE blogs SET is_public = ? WHERE project_id = ?')
    .run(isPublic, req.params.id);

  res.json({ status: newStatus, is_public: isPublic });
});

// ── Blogs ─────────────────────────────────────────────────────────────────────

// PUT /api/admin/blog/:id — update blog content
router.put('/blog/:id', (req, res) => {
  const { problem, approach, tech_detail, challenges, mistakes, result, learnings } = req.body;
  const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  db.prepare(`
    UPDATE blogs SET
      problem = ?, approach = ?, tech_detail = ?,
      challenges = ?, mistakes = ?, result = ?, learnings = ?
    WHERE id = ?
  `).run(
    problem ?? blog.problem,
    approach ?? blog.approach,
    tech_detail ?? blog.tech_detail,
    challenges ?? blog.challenges,
    mistakes ?? blog.mistakes,
    result ?? blog.result,
    learnings ?? blog.learnings,
    req.params.id
  );
  res.json({ success: true });
});

// ── Sections ──────────────────────────────────────────────────────────────────

// POST /api/admin/sections — add custom section
router.post('/sections', (req, res) => {
  const { blog_id, label, content, position } = req.body;
  if (!blog_id || !label) return res.status(400).json({ error: 'blog_id and label required' });

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO sections (blog_id, label, content, position) VALUES (?, ?, ?, ?)'
  ).run(blog_id, label, content || '', position || 0);

  res.status(201).json({ id: lastInsertRowid });
});

// PUT /api/admin/sections/:id
router.put('/sections/:id', (req, res) => {
  const { label, content, position } = req.body;
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  if (!section) return res.status(404).json({ error: 'Section not found' });

  db.prepare('UPDATE sections SET label = ?, content = ?, position = ? WHERE id = ?')
    .run(label ?? section.label, content ?? section.content, position ?? section.position, req.params.id);
  res.json({ success: true });
});

// DELETE /api/admin/sections/:id
router.delete('/sections/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
  const published = db.prepare("SELECT COUNT(*) as c FROM projects WHERE status='published'").get().c;
  const drafts = total - published;
  const domains = db.prepare('SELECT DISTINCT domain FROM projects').all().map(r => r.domain);
  res.json({ total, published, drafts, domains });
});

module.exports = router;

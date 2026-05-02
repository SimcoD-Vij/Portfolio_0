const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects — all published projects (with optional domain filter)
router.get('/', (req, res) => {
  const { domain } = req.query;
  let query = `SELECT id, title, domain, slug, short_desc, tech_stack, demo_link, github_link, created_at
               FROM projects WHERE status = 'published'`;
  const params = [];
  if (domain && domain !== 'All') {
    query += ' AND domain = ?';
    params.push(domain);
  }
  query += ' ORDER BY created_at DESC';
  const projects = db.prepare(query).all(...params);
  projects.forEach(p => { p.tech_stack = JSON.parse(p.tech_stack || '[]'); });
  res.json(projects);
});

// GET /api/projects/domains — distinct published domains
router.get('/domains', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT domain FROM projects WHERE status = 'published' ORDER BY domain`).all();
  res.json(['All', ...rows.map(r => r.domain)]);
});

// GET /api/projects/:slug — single published project
router.get('/:slug', (req, res) => {
  const project = db.prepare(`
    SELECT p.*, b.id as blog_id, b.problem, b.approach, b.tech_detail, b.challenges,
           b.mistakes, b.result, b.learnings, b.is_public
    FROM projects p
    LEFT JOIN blogs b ON b.project_id = p.id
    WHERE p.slug = ? AND p.status = 'published'
  `).get(req.params.slug);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.tech_stack = JSON.parse(project.tech_stack || '[]');

  if (project.blog_id && project.is_public) {
    project.sections = db.prepare(
      'SELECT * FROM sections WHERE blog_id = ? ORDER BY position ASC, id ASC'
    ).all(project.blog_id);
  }

  res.json(project);
});

module.exports = router;

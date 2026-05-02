const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/blog/:slug — public case study
router.get('/:slug', (req, res) => {
  const row = db.prepare(`
    SELECT p.title, p.domain, p.slug, p.tech_stack, p.demo_link, p.github_link,
           b.id as blog_id, b.problem, b.approach, b.tech_detail, b.challenges,
           b.mistakes, b.result, b.learnings
    FROM projects p
    JOIN blogs b ON b.project_id = p.id
    WHERE p.slug = ? AND p.status = 'published' AND b.is_public = 1
  `).get(req.params.slug);

  if (!row) return res.status(404).json({ error: 'Blog not found or not published' });

  row.tech_stack = JSON.parse(row.tech_stack || '[]');
  row.sections = db.prepare(
    'SELECT label, content, position FROM sections WHERE blog_id = ? ORDER BY position ASC, id ASC'
  ).all(row.blog_id);

  res.json(row);
});

module.exports = router;

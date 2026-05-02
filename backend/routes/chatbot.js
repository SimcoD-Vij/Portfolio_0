const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/chatbot — lightweight keyword-matching chatbot
// Replace the scoring logic below with an LLM API call when ready
router.post('/', (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length === 0) {
    return res.json({ reply: "Ask me anything about the projects in this portfolio!" });
  }

  const q = query.toLowerCase().trim();

  // Fetch all published project data
  const projects = db.prepare(`
    SELECT p.title, p.domain, p.slug, p.short_desc, p.tech_stack, p.demo_link,
           b.problem, b.result, b.learnings
    FROM projects p
    LEFT JOIN blogs b ON b.project_id = p.id AND b.is_public = 1
    WHERE p.status = 'published'
  `).all();

  if (projects.length === 0) {
    return res.json({ reply: "No projects published yet. Check back soon!" });
  }

  // ── Greeting ──────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|sup|what'?s up)/i.test(q)) {
    return res.json({
      reply: `Hey! 👋 I can tell you about ${projects.length} projects in this portfolio. Try asking about a specific project, technology, or domain like "Tell me about AI projects" or "What did you build with Python?"`
    });
  }

  // ── Help / list ───────────────────────────────────────────────────────────
  if (/what (can|do) you|list|all projects|show projects/i.test(q)) {
    const list = projects.map(p => `• **${p.title}** (${p.domain})`).join('\n');
    return res.json({ reply: `Here are all the projects:\n\n${list}\n\nAsk me about any of them!` });
  }

  // ── Score projects by keyword match ──────────────────────────────────────
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const scored = projects.map(p => {
    const tech = JSON.parse(p.tech_stack || '[]').join(' ').toLowerCase();
    const corpus = [
      p.title, p.domain, p.short_desc, tech,
      p.problem || '', p.result || '', p.learnings || ''
    ].join(' ').toLowerCase();

    let score = 0;
    for (const word of words) {
      if (p.title.toLowerCase().includes(word)) score += 3;
      else if (p.domain.toLowerCase().includes(word)) score += 2;
      else if (tech.includes(word)) score += 2;
      else if (corpus.includes(word)) score += 1;
    }
    return { ...p, score };
  }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    const domains = [...new Set(projects.map(p => p.domain))].join(', ');
    return res.json({
      reply: `I couldn't find a specific match for "${query}". I can tell you about projects in these domains: ${domains}. Try asking about one!`
    });
  }

  // ── Build reply ───────────────────────────────────────────────────────────
  const top = scored[0];
  const tech = JSON.parse(top.tech_stack || '[]').join(', ');
  let reply = `**${top.title}** (${top.domain})\n\n${top.short_desc}`;
  if (tech) reply += `\n\n🛠 Tech: ${tech}`;
  if (top.result) reply += `\n\n✅ Result: ${top.result}`;
  if (top.demo_link) reply += `\n\n🔗 [Live Demo](${top.demo_link})`;
  reply += `\n\n📖 [Read the full case study](/blog.html?slug=${top.slug})`;

  if (scored.length > 1) {
    reply += `\n\n_Also related: ${scored.slice(1, 3).map(p => p.title).join(', ')}_`;
  }

  res.json({ reply });
});

module.exports = router;

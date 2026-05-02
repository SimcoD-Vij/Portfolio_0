// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : '/api';

// ── API fetch wrapper ─────────────────────────────────────────────────────────
async function api(endpoint, options = {}) {
  const token = localStorage.getItem('portfolio_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('portfolio_token');
    if (window.location.pathname.includes('/admin/')) {
      window.location.href = '/admin/login.html';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('portfolio_token'); }
function setToken(t) { localStorage.setItem('portfolio_token', t); }
function clearToken() { localStorage.removeItem('portfolio_token'); }
function isLoggedIn() { return !!getToken(); }

async function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/admin/login.html';
    return false;
  }
  try {
    await api('/auth/verify');
    return true;
  } catch {
    window.location.href = '/admin/login.html';
    return false;
  }
}

// ── Misc helpers ──────────────────────────────────────────────────────────────
function qs(selector, root = document) { return root.querySelector(selector); }
function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }

function urlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Render markdown-lite: **bold**, bullet lines, line breaks
function renderMarkdown(text) {
  if (!text) return '';
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((https?:\/\/.+?)\)/g, '<a href="$1" target="_blank" class="text-indigo-400 hover:underline">$2</a>')
    .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br>');
}

// Show toast notification
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all
    ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2800);
}

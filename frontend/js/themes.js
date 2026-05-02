// Domain visual themes
const THEMES = {
  'All':         { primary: '#6366f1', secondary: '#a855f7' },
  'AI':          { primary: '#8b5cf6', secondary: '#d946ef' },
  'Web':         { primary: '#06b6d4', secondary: '#3b82f6' },
  'IoT':         { primary: '#10b981', secondary: '#34d399' },
  'Automation':  { primary: '#f59e0b', secondary: '#fbbf24' },
};

function applyTheme(domain) {
  const theme = THEMES[domain] || THEMES['All'];
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function domainBadge(domain) {
  // We use the new pill style from modern.css
  return `<span class="tech-pill" style="background: var(--primary); color: white; border: none; font-size: 0.7rem; padding: 0.2rem 0.5rem;">${escHtml(domain)}</span>`;
}

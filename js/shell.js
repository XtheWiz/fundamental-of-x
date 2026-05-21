// Shared shell: injects the sidebar (driven by a topic's manifest) and
// wires up the mobile menu toggle. Imported as an ES module by every
// lesson/topic page so the React/Vite migration later is just a port.

// Side-effect import: mascot.js auto-mounts X-sensei into well-known slots.
import './mascot.js';

export function mountSidebar({ manifest, currentSlug, mountSelector = '#sidebar' }) {
  const root = document.querySelector(mountSelector);
  if (!root) return;
  const lessons = manifest.lessons;
  const list = lessons
    .map((l) => {
      const active = l.slug === currentSlug ? ' class="active"' : '';
      const href = relativeHref(l.slug, currentSlug);
      return `<li><a href="${href}"${active}>${escapeHtml(l.title)}</a></li>`;
    })
    .join('');
  root.innerHTML = `
    <h4>${escapeHtml(manifest.title)}</h4>
    <ol>${list}</ol>
  `;
}

export function mountBreadcrumb({ manifest, currentTitle, mountSelector = '#breadcrumb' }) {
  const root = document.querySelector(mountSelector);
  if (!root) return;
  // depth-aware paths: from /topics/<x>/lessons/* back to root.
  root.innerHTML = `
    <a href="../../../index.html">Fundamental of X</a>
    <span class="sep">›</span>
    <a href="../index.html">${escapeHtml(manifest.title)}</a>
    <span class="sep">›</span>
    <span class="current">${escapeHtml(currentTitle)}</span>
  `;
}

export function mountLessonNav({ manifest, currentSlug, mountSelector = '#lesson-nav' }) {
  const root = document.querySelector(mountSelector);
  if (!root) return;
  const lessons = manifest.lessons;
  const idx = lessons.findIndex((l) => l.slug === currentSlug);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const prevHtml = prev
    ? `<a class="prev" href="${prev.slug}.html">
         <div class="dir">← prev</div>
         <div class="title">${escapeHtml(prev.title)}</div>
       </a>`
    : `<a class="prev disabled"><div class="dir">← prev</div><div class="title">—</div></a>`;
  const nextHtml = next
    ? `<a class="next" href="${next.slug}.html">
         <div class="dir">next →</div>
         <div class="title">${escapeHtml(next.title)}</div>
       </a>`
    : `<a class="next disabled"><div class="dir">next →</div><div class="title">—</div></a>`;
  root.innerHTML = prevHtml + nextHtml;
}

export function mountMenuToggle({ toggleSelector = '#menu-toggle', sidebarSelector = '#sidebar' } = {}) {
  const btn = document.querySelector(toggleSelector);
  const sidebar = document.querySelector(sidebarSelector);
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

function relativeHref(targetSlug, currentSlug) {
  // Lesson pages live in the same dir; just swap the filename.
  if (currentSlug) return `${targetSlug}.html`;
  // From topic hub, lessons are in lessons/
  return `lessons/${targetSlug}.html`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

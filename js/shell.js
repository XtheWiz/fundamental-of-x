// Shared shell: injects the sidebar (driven by a topic's manifest) and
// wires up the mobile menu toggle. Imported as an ES module by every
// lesson/topic page so the React/Vite migration later is just a port.

// Side-effect import: mascot.js auto-mounts X-sensei into well-known slots.
import './mascot.js';
import { t } from './i18n.js';

// Translate a manifest entry's display title/blurb if a key is provided.
// New convention: { slug, titleKey, blurbKey } takes precedence over { title, blurb }.
function tLessonTitle(l) {
  if (l.titleKey) return t(l.titleKey);
  return l.title;
}
function tLessonBlurb(l) {
  if (l.blurbKey) return t(l.blurbKey);
  return l.blurb;
}
function tTopicTitle(manifest) {
  if (manifest.titleKey) return t(manifest.titleKey);
  return manifest.title;
}

// Hold mount params so we can re-render on language change.
const mounted = { sidebar: null, breadcrumb: null, lessonNav: null };

export function mountSidebar({ manifest, currentSlug, mountSelector = '#sidebar' }) {
  mounted.sidebar = { manifest, currentSlug, mountSelector };
  renderSidebar();
}
function renderSidebar() {
  const p = mounted.sidebar; if (!p) return;
  const root = document.querySelector(p.mountSelector);
  if (!root) return;
  const list = p.manifest.lessons
    .map((l) => {
      const active = l.slug === p.currentSlug ? ' class="active"' : '';
      const href = relativeHref(l.slug, p.currentSlug);
      return `<li><a href="${href}"${active}>${escapeHtml(tLessonTitle(l))}</a></li>`;
    })
    .join('');
  root.innerHTML = `
    <h4>${escapeHtml(tTopicTitle(p.manifest))}</h4>
    <ol>${list}</ol>
  `;
}

export function mountBreadcrumb({ manifest, currentSlug, currentTitle, mountSelector = '#breadcrumb' }) {
  mounted.breadcrumb = { manifest, currentSlug, currentTitle, mountSelector };
  renderBreadcrumb();
}
function renderBreadcrumb() {
  const p = mounted.breadcrumb; if (!p) return;
  const root = document.querySelector(p.mountSelector);
  if (!root) return;
  // Look up translated lesson title from manifest if slug given.
  let leaf = p.currentTitle;
  if (p.currentSlug) {
    const l = p.manifest.lessons.find((x) => x.slug === p.currentSlug);
    if (l) leaf = tLessonTitle(l);
  }
  root.innerHTML = `
    <a href="../../../index.html">${escapeHtml(t('compilers.title') === 'compilers.title' ? 'Fundamental of X' : 'Fundamental of X')}</a>
    <span class="sep">›</span>
    <a href="../index.html">${escapeHtml(tTopicTitle(p.manifest))}</a>
    <span class="sep">›</span>
    <span class="current">${escapeHtml(leaf)}</span>
  `;
}

export function mountLessonNav({ manifest, currentSlug, mountSelector = '#lesson-nav' }) {
  mounted.lessonNav = { manifest, currentSlug, mountSelector };
  renderLessonNav();
}
function renderLessonNav() {
  const p = mounted.lessonNav; if (!p) return;
  const root = document.querySelector(p.mountSelector);
  if (!root) return;
  const lessons = p.manifest.lessons;
  const idx = lessons.findIndex((l) => l.slug === p.currentSlug);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const prevLbl = t('shared.prev');
  const nextLbl = t('shared.next');
  const prevHtml = prev
    ? `<a class="prev" href="${prev.slug}.html">
         <div class="dir">${escapeHtml(prevLbl)}</div>
         <div class="title">${escapeHtml(tLessonTitle(prev))}</div>
       </a>`
    : `<a class="prev disabled"><div class="dir">${escapeHtml(prevLbl)}</div><div class="title">—</div></a>`;
  const nextHtml = next
    ? `<a class="next" href="${next.slug}.html">
         <div class="dir">${escapeHtml(nextLbl)}</div>
         <div class="title">${escapeHtml(tLessonTitle(next))}</div>
       </a>`
    : `<a class="next disabled"><div class="dir">${escapeHtml(nextLbl)}</div><div class="title">—</div></a>`;
  root.innerHTML = prevHtml + nextHtml;
}

// Re-render on language change.
if (typeof window !== 'undefined') {
  window.addEventListener('i18n:changed', () => {
    renderSidebar();
    renderBreadcrumb();
    renderLessonNav();
  });
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

// Tiny i18n helper. Designed to be i18next-compatible so the JSON
// dictionaries port verbatim to react-i18next when the site moves to React.
//
// Conventions intentionally chosen to match i18next:
//   - dotted key paths:           t('home.hero.title')
//   - {{var}} interpolation:      t('foo.bar', { name: 'Ada' })
//   - fallback chain:             current → en → key itself
//
// DOM hooks:
//   <h1 data-i18n="some.key">English fallback</h1>
//   <p  data-i18n-html="rich.key">English fallback with <em>HTML</em></p>
//   <input data-i18n-attr="placeholder:input.placeholder">
//
// Listen for the 'i18n:changed' window event to re-render JS-driven UI.

const SUPPORTED = [
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'ja', label: 'Japanese', native: '日本語'    },
  { code: 'ko', label: 'Korean',   native: '한국어'    },
  { code: 'zh', label: 'Chinese',  native: '中文'      },
  { code: 'th', label: 'Thai',     native: 'ไทย'       },
];

const STORAGE_KEY = 'fox-lang';
const DEFAULT_LANG = 'en';

let dict = {};
let fallbackDict = {};
let currentLang = DEFAULT_LANG;
let i18nRoot = '';  // relative path prefix (e.g., '../../' from a lesson page)

function detectLang() {
  const url = new URLSearchParams(location.search).get('lang');
  if (url && SUPPORTED.some((l) => l.code === url)) return url;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.some((l) => l.code === stored)) return stored;
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED.some((l) => l.code === nav)) return nav;
  return DEFAULT_LANG;
}

// Walk a dotted key into a nested object. Returns undefined if missing.
function lookup(obj, key) {
  if (!obj) return undefined;
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(s, vars) {
  if (typeof s !== 'string' || !vars) return s;
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (k in vars ? String(vars[k]) : `{{${k}}}`));
}

export function t(key, vars) {
  const found = lookup(dict, key);
  if (typeof found === 'string') return interpolate(found, vars);
  const fb = lookup(fallbackDict, key);
  if (typeof fb === 'string') return interpolate(fb, vars);
  return key; // last resort: show the key so missing strings are obvious.
}

export function getLang() { return currentLang; }
export function getSupported() { return SUPPORTED.slice(); }

// Resolve a URL to /i18n/<code>.json from any page depth.
// Pages call setI18nRoot('../../') from a lesson page, etc.
export function setI18nRoot(rel) { i18nRoot = rel; }

async function fetchDict(code) {
  const url = `${i18nRoot}i18n/${code}.json`;
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`i18n ${code}: ${r.status}`);
  return r.json();
}

export async function setLang(code, { persist = true } = {}) {
  if (!SUPPORTED.some((l) => l.code === code)) code = DEFAULT_LANG;
  currentLang = code;
  if (persist) localStorage.setItem(STORAGE_KEY, code);
  document.documentElement.lang = code;
  if (code === DEFAULT_LANG) {
    dict = fallbackDict;
  } else {
    try { dict = await fetchDict(code); }
    catch (e) { console.warn('i18n load failed', e); dict = {}; }
  }
  applyI18n(document);
  window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: code } }));
}

// Replace text on every element with [data-i18n*] under the given root.
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val !== key) el.textContent = val;
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const val = t(key);
    if (val !== key) el.innerHTML = val;
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const val = t(key);
      if (attr && key && val !== key) el.setAttribute(attr, val);
    });
  });
}

// Drop a language switcher into a container. Renders as a small globe
// icon that opens a popover menu on click — keeps the header uncluttered
// since most visitors won't change language.
export function mountLangSwitcher(el) {
  if (!el) return;
  el.classList.add('lang-switcher');
  el.innerHTML = `
    <button class="lang-toggle" type="button" aria-label="Change language" aria-haspopup="menu" aria-expanded="false">
      <span aria-hidden="true">🌐</span>
    </button>
    <div class="lang-menu" role="menu" hidden>
      ${SUPPORTED.map((l) =>
        `<button type="button" role="menuitem" data-lang="${l.code}" class="lang-option${l.code === currentLang ? ' active' : ''}">${l.native}</button>`
      ).join('')}
    </div>
  `;
  const toggle = el.querySelector('.lang-toggle');
  const menu = el.querySelector('.lang-menu');

  function open() {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    el.classList.add('open');
  }
  function close() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    el.classList.remove('open');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden ? open() : close();
  });

  menu.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    await setLang(btn.dataset.lang);
    menu.querySelectorAll('.lang-option').forEach((b) =>
      b.classList.toggle('active', b.dataset.lang === currentLang)
    );
    close();
  });

  document.addEventListener('click', (e) => {
    if (!el.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
}

// Pages call initI18n({ relRoot: '../../' }) and we boot before the
// first render so widgets see the chosen language on first paint.
export async function initI18n({ relRoot = '' } = {}) {
  setI18nRoot(relRoot);
  // Always load English first so it's available as a fallback.
  try { fallbackDict = await fetchDict('en'); }
  catch (e) { console.warn('i18n fallback load failed', e); }
  const lang = detectLang();
  await setLang(lang, { persist: false });
}

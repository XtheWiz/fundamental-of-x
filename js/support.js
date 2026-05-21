// Buy Me a Coffee tip jar. Two button variants — a compact one in the
// site footer, and a card-style one after every "Key Takeaways" box.
// Both render even when `bmcUsername` is empty so you can preview the
// design; clicking an unconfigured button explains how to enable it.

import { config } from './config.js';
import { mascot } from './mascot.js';

function bmcUrl() {
  const u = (config.bmcUsername || '').trim();
  return u ? `https://www.buymeacoffee.com/${encodeURIComponent(u)}` : null;
}

function commonAttrs() {
  const url = bmcUrl();
  if (url) return `href="${url}" target="_blank" rel="noopener"`;
  return `href="#" data-bmc-preview="1"`;
}

function compactButton() {
  return `
    <a class="bmc-btn" ${commonAttrs()}>
      <span class="bmc-cup" aria-hidden="true">☕</span>
      <span class="bmc-label">Buy X-sensei a coffee</span>
    </a>
  `;
}

function cardButton() {
  return `
    <a class="bmc-card" ${commonAttrs()}>
      <div class="bmc-card-mascot">${mascot('coffee', { size: 70 })}</div>
      <div class="bmc-card-text">
        <strong>Found this useful?</strong>
        <span>Buy X-sensei a coffee and keep the site ad-free.</span>
      </div>
      <div class="bmc-card-cta">Tip ☕</div>
    </a>
  `;
}

export function mountSupport() {
  // Compact button at the bottom of every site footer.
  document.querySelectorAll('.site-footer').forEach((el) => {
    if (el.querySelector('.bmc-btn')) return;
    el.insertAdjacentHTML('beforeend', `<div class="bmc-footer-wrap">${compactButton()}</div>`);
  });

  // Card after every Key Takeaways box on lesson pages.
  document.querySelectorAll('.takeaways').forEach((el) => {
    if (el.nextElementSibling && el.nextElementSibling.classList?.contains('bmc-card')) return;
    el.insertAdjacentHTML('afterend', cardButton());
  });

  // Wire preview-mode buttons so clicks explain the setup step.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-bmc-preview]');
    if (!a) return;
    e.preventDefault();
    alert(
      'Preview mode.\n\n' +
      'To enable real tips: set `bmcUsername` in /js/config.js to your ' +
      'Buy Me a Coffee username (sign up free at buymeacoffee.com), ' +
      'then redeploy.'
    );
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSupport);
  } else {
    // Defer to next macrotask so the (circular) mascot.js import chain
    // finishes initializing before we call mascot() from inside cardButton.
    setTimeout(mountSupport, 0);
  }
}

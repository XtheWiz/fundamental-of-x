import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import { tallyEmbed } from '../data/contact.js';

// Hosts a Tally form inside our manga-styled modal. Tally's iframe posts
// height updates via window.postMessage when dynamicHeight=1; we listen
// and resize so the iframe never shows a scrollbar.
//
// `prefill` lets us pass `Form URL`, `Topic`, `Lesson` etc. as query
// params — Tally maps them to fields with the same labels.
export default function TallyModal({ open, onClose, title, formUrl, prefill = {} }) {
  const [height, setHeight] = useState(420);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (typeof e.data !== 'string' || !e.data.startsWith('{')) return;
      try {
        const data = JSON.parse(e.data);
        if (data?.event === 'Tally.FormHeight' && data?.height) setHeight(data.height + 8);
      } catch (_) { /* ignore non-Tally messages */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open]);

  // Merge Tally embed flags + prefill values into the embed URL.
  const src = formUrl ? tallyEmbed(formUrl, prefill) : null;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {src ? (
        <iframe
          ref={iframeRef}
          src={src}
          width="100%"
          height={height}
          frameBorder="0"
          title={title || 'Form'}
          style={{ display: 'block', background: 'transparent' }}
          allow="forms"
        />
      ) : (
        <p style={{ color: 'var(--ink-soft)' }}>Form not configured.</p>
      )}
    </Modal>
  );
}

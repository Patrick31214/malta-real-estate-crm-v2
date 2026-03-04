import React, { useState } from 'react';

const maskPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return '****' + digits.slice(-4);
};

const maskEmail = (email) => {
  if (!email) return '';
  const atIdx = email.indexOf('@');
  const local = atIdx >= 0 ? email.slice(0, atIdx) : email;
  return local.slice(0, Math.min(3, local.length)) + '***@***';
};

/**
 * BlurredText — shows masked text by default with a 👁 toggle to reveal.
 * Props:
 *   text          — the actual text to show/mask
 *   type          — 'phone' | 'email' | 'text'  (default 'text')
 *   initialBlurred — uncontrolled: starting blur state (default true)
 *   blurred       — controlled: externally controlled blur state
 *   onToggle      — controlled: callback when the toggle is clicked
 *   href          — optional link href shown when revealed
 */
const BlurredText = ({ text, type = 'text', initialBlurred = true, blurred: externalBlurred, onToggle, href }) => {
  const [internalBlurred, setInternalBlurred] = useState(initialBlurred);
  const isControlled = externalBlurred !== undefined;
  const blurred = isControlled ? externalBlurred : internalBlurred;
  const toggle = onToggle || (() => setInternalBlurred(b => !b));

  if (!text) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;

  const maskedText =
    type === 'phone' ? maskPhone(text) :
    type === 'email' ? maskEmail(text) :
    '••••••';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {blurred
        ? <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{maskedText}</span>
        : href
          ? <a href={href} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{text}</a>
          : <span>{text}</span>
      }
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        style={eyeBtn}
        title={blurred ? 'Reveal' : 'Hide'}
        aria-label={blurred ? 'Reveal sensitive information' : 'Hide sensitive information'}
      >
        {blurred ? '👁' : '🙈'}
      </button>
    </span>
  );
};

const eyeBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0 2px',
  fontSize: '14px',
  lineHeight: 1,
  color: 'var(--color-text-muted)',
};

export default BlurredText;

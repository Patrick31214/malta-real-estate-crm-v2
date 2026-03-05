import React, { useState } from 'react';

/**
 * Reusable Pagination component.
 *
 * Props:
 *   page         – current active page (1-based); alias: currentPage
 *   currentPage  – current active page (1-based); deprecated alias for page
 *   totalPages   – total number of pages
 *   total        – total number of items
 *   onPageChange – callback(page: number)
 *   limit        – items per page (used for "Showing X–Y of Z" text)
 *   style        – optional style overrides for the container (e.g. marginTop/marginBottom)
 */
export default function Pagination({ page, currentPage, totalPages, total, onPageChange, limit = 20, style: styleProp }) {
  const activePage = page ?? currentPage ?? 1;
  const [goTo, setGoTo] = useState('');
  const [goToError, setGoToError] = useState(false);

  if (!totalPages || totalPages <= 1) return null;

  const first = (activePage - 1) * limit + 1;
  const last  = Math.min(activePage * limit, total);

  const handleGoTo = (e) => {
    e.preventDefault();
    const p = parseInt(goTo, 10);
    if (p >= 1 && p <= totalPages) {
      onPageChange(p);
      setGoTo('');
      setGoToError(false);
    } else {
      setGoToError(true);
    }
  };

  const handleGoToChange = (e) => {
    setGoTo(e.target.value);
    setGoToError(false);
  };

  /* Build the list of page numbers / ellipsis tokens to render */
  const buildPages = () => {
    const delta  = 2; // pages shown on each side of current
    const pages  = [];
    const rangeStart = Math.max(2, activePage - delta);
    const rangeEnd   = Math.min(totalPages - 1, activePage + delta);

    pages.push(1);

    if (rangeStart > 2) pages.push('...');

    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

    if (rangeEnd < totalPages - 1) pages.push('...');

    pages.push(totalPages);

    return pages;
  };

  const pages = buildPages();

  const btnBase = {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    transition: 'var(--transition-fast)',
    minWidth: '36px',
    textAlign: 'center',
  };

  const activeStyle = {
    ...btnBase,
    background: 'var(--color-accent-gold)',
    borderColor: 'var(--color-accent-gold)',
    color: '#fff',
    fontWeight: 'var(--font-semibold)',
  };

  const disabledStyle = {
    ...btnBase,
    color: 'var(--color-text-muted)',
    cursor: 'not-allowed',
    opacity: 0.5,
  };

  const normalStyle = {
    ...btnBase,
    color: 'var(--color-text-primary)',
  };

  const navBtn = (disabled) => (disabled ? disabledStyle : normalStyle);

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-6)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        ...styleProp,
      }}
    >
      {/* Showing X–Y of Z */}
      {total > 0 && (
        <span
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            marginRight: 'var(--space-3)',
            whiteSpace: 'nowrap',
          }}
        >
          Showing {first}–{last} of {total}
        </span>
      )}

      {/* First */}
      <button
        disabled={activePage <= 1}
        onClick={() => onPageChange(1)}
        style={navBtn(activePage <= 1)}
        aria-label="First page"
      >
        «
      </button>

      {/* Prev */}
      <button
        disabled={activePage <= 1}
        onClick={() => onPageChange(activePage - 1)}
        style={navBtn(activePage <= 1)}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', padding: '0 var(--space-1)' }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={p === activePage ? activeStyle : normalStyle}
            aria-label={`Page ${p}`}
            aria-current={p === activePage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        disabled={activePage >= totalPages}
        onClick={() => onPageChange(activePage + 1)}
        style={navBtn(activePage >= totalPages)}
        aria-label="Next page"
      >
        Next ›
      </button>

      {/* Last */}
      <button
        disabled={activePage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        style={navBtn(activePage >= totalPages)}
        aria-label="Last page"
      >
        »
      </button>

      {/* Go to page */}
      {totalPages > 5 && (
        <form
          onSubmit={handleGoTo}
          style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', marginLeft: 'var(--space-3)' }}
        >
          <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            Go to
          </label>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={goTo}
            onChange={handleGoToChange}
            style={{
              width: '52px',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              border: goToError ? '1px solid var(--color-error, #e53e3e)' : '1px solid var(--color-border)',
              background: 'var(--color-surface-glass)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
            }}
            aria-label="Go to page number"
            aria-invalid={goToError}
          />
          <button type="submit" style={normalStyle}>Go</button>
        </form>
      )}
    </div>
  );
}

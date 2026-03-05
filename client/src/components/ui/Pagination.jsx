import React from 'react';

/**
 * Reusable Pagination component.
 *
 * Props:
 *   currentPage  – current active page (1-based)
 *   totalPages   – total number of pages
 *   total        – total number of items
 *   onPageChange – callback(page: number)
 *   limit        – items per page (used for "Showing X–Y of Z" text)
 */
export default function Pagination({ currentPage, totalPages, total, onPageChange, limit = 20 }) {
  if (!totalPages || totalPages <= 1) return null;

  const first = (currentPage - 1) * limit + 1;
  const last  = Math.min(currentPage * limit, total);

  /* Build the list of page numbers / ellipsis tokens to render */
  const buildPages = () => {
    const delta  = 2; // pages shown on each side of current
    const pages  = [];
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd   = Math.min(totalPages - 1, currentPage + delta);

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
        marginTop: 'var(--space-8)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
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
        disabled={currentPage <= 1}
        onClick={() => onPageChange(1)}
        style={navBtn(currentPage <= 1)}
        aria-label="First page"
      >
        «
      </button>

      {/* Prev */}
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={navBtn(currentPage <= 1)}
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
            style={p === currentPage ? activeStyle : normalStyle}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={navBtn(currentPage >= totalPages)}
        aria-label="Next page"
      >
        Next ›
      </button>

      {/* Last */}
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        style={navBtn(currentPage >= totalPages)}
        aria-label="Last page"
      >
        »
      </button>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * SearchableSelect — a reusable searchable dropdown component.
 *
 * Props:
 *   options    : [{ value, label, searchText }]
 *   value      : currently selected value (id string)
 *   onChange   : (value) => void — called with the selected option's value
 *   placeholder: string shown when nothing is selected
 *   disabled   : boolean
 */
const SearchableSelect = ({ options = [], value, onChange, placeholder = 'Select…', disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find the label of the currently selected option
  const selected = options.find(o => o.value === value);

  // When the dropdown closes, reset query
  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  const filtered = query.trim()
    ? options.filter(o => {
        const q = query.toLowerCase();
        return (
          (o.label || '').toLowerCase().includes(q) ||
          (o.searchText || '').toLowerCase().includes(q)
        );
      })
    : options;

  const handleSelect = (opt) => {
    onChange(opt.value);
    close();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    close();
  };

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-glass)',
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minHeight: '36px',
          userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0, marginLeft: 'var(--space-2)' }}>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
              title="Clear selection"
            >
              ×
            </button>
          )}
          <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>▼</span>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border-light)' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-glass)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                No results found
              </div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    color: opt.value === value ? 'var(--color-accent-gold)' : 'var(--color-text-primary)',
                    background: opt.value === value ? 'var(--color-primary-50)' : 'transparent',
                    borderBottom: '1px solid var(--color-border-light)',
                    transition: 'background var(--transition-fast)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--color-primary-100)'; }}
                  onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

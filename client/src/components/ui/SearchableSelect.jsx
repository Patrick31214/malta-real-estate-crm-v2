import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find the label of the currently selected option
  const selected = options.find(o => o.value === value);

  // When the dropdown closes, reset query
  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Calculate dropdown position from the trigger element, flipping above if needed
  const updatePos = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 300; // approx max height (search bar + options list)
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setDropdownPos({
        top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Close when clicking outside; reposition on scroll/resize using rAF to throttle
  useEffect(() => {
    const handleClick = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        close();
      }
    };
    let rafId = null;
    const handleReposition = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePos);
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open, close, updatePos]);

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
    updatePos();
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

      {/* Dropdown — rendered via portal to escape overflow/z-index constraints */}
      {open && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="glass"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableSelect;

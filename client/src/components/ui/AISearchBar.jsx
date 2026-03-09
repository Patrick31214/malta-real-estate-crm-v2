import React, { useState, useEffect, useRef } from 'react';

const SUGGESTIONS = [
  'Waterfront Villa in Sliema',
  'Penthouse with Pool & Sea View',
  'Historic Palazzo in Valletta',
  'Modern Apartment in St Julian\'s',
  '3-Bedroom Villa with Garden',
  'Investment Property in Gozo',
];

const PLACEHOLDERS = [
  'I want a 3-bedroom penthouse in Sliema under €800K...',
  'Show me sea-view apartments in Valletta...',
  'Find me a historic palazzo with character...',
  'I need a modern apartment near St Julian\'s...',
];

const AISearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [showChips, setShowChips] = useState(true);
  const [visibleChips, setVisibleChips] = useState([]);
  const inputRef = useRef(null);
  let placeholderIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      placeholderIdx.current = (placeholderIdx.current + 1) % PLACEHOLDERS.length;
      setPlaceholder(PLACEHOLDERS[placeholderIdx.current]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Stagger chips appearing
    SUGGESTIONS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleChips(prev => [...prev, i]);
      }, i * 150 + 300);
    });
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsThinking(true);
    setShowChips(false);
    setTimeout(() => {
      setIsThinking(false);
      if (onSearch) onSearch(query);
    }, 1800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleChipClick = (suggestion) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '50px',
        padding: '0.6rem 0.6rem 0.6rem 1.25rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        transition: 'all 0.3s ease',
      }}>
        {/* AI Icon */}
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>✨</span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            color: 'var(--color-text-primary, #F5F0E8)',
            fontFamily: 'var(--font-body, Inter, sans-serif)',
          }}
        />

        {/* Thinking Dots or Search Button */}
        {isThinking ? (
          <div className="thinking-dots" style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
            <span /><span /><span />
          </div>
        ) : (
          <button
            onClick={handleSearch}
            style={{
              background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
              color: '#1C140C',
              border: 'none',
              borderRadius: '40px',
              padding: '0.7rem 1.5rem',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.35)',
            }}
          >
            Search AI →
          </button>
        )}
      </div>

      {/* Suggestion Chips */}
      {showChips && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          marginTop: '1rem',
          justifyContent: 'center',
        }}>
          {SUGGESTIONS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(suggestion)}
              className="suggestion-chip"
              style={{
                opacity: visibleChips.includes(i) ? 1 : 0,
                transition: 'all 0.3s ease',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '20px',
                padding: '0.4rem 1rem',
                fontSize: '0.8rem',
                color: 'rgba(212, 175, 55, 0.9)',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                whiteSpace: 'nowrap',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* AI Result Placeholder */}
      {!isThinking && !showChips && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem 1.5rem',
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '16px',
          fontSize: '0.85rem',
          color: 'rgba(212, 175, 55, 0.9)',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          ✦ Our AI found <strong>12 matching properties</strong> based on your search. Register to view results.
        </div>
      )}
    </div>
  );
};

export default AISearchBar;

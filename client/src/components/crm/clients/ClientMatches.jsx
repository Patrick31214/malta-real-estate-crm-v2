import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { MATCH_STATUSES } from '../../../constants/clientRequirements';
import PropertyDetail from '../properties/PropertyDetail';

const PROPERTY_TYPE_EMOJI = {
  apartment: '🏢', penthouse: '🌆', villa: '🏡', house: '🏠',
  maisonette: '🏘️', townhouse: '🏘️', palazzo: '🏛️', farmhouse: '🌾',
  commercial: '🏪', office: '🏢', garage: '🚗', land: '🌿', other: '🏗️',
};

const STATUS_COLORS = {
  draft: 'var(--color-text-muted)',
  listed: 'var(--color-success)',
  under_offer: 'var(--color-warning)',
  sold: 'var(--color-error)',
  rented: 'var(--color-info)',
  withdrawn: 'var(--color-text-muted)',
};

const capitalizeType = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '';

const getScoreColor = (score) => {
  if (score >= 75) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-warning)';
  return 'var(--color-error)';
};

const formatPrice = (price, type) => {
  if (!price) return '—';
  const num = Number(price);
  const fmt = '€ ' + num.toLocaleString('en-MT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (type === 'long_let' || type === 'short_let') ? fmt + '/mo' : fmt;
};

const ScoreCircle = ({ score, size = 60 }) => {
  const color = getScoreColor(score);
  const pct = Math.min(100, Math.max(0, score));
  const inner = Math.round(size * 0.73);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `conic-gradient(${color} ${pct * 3.6}deg, var(--color-border) 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', zIndex: 2,
    }}>
      <div style={{
        width: inner, height: inner, borderRadius: '50%',
        background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: size < 50 ? '10px' : 'var(--text-sm)', fontWeight: 'var(--font-bold)', color }}>{score}%</span>
      </div>
    </div>
  );
};

const ScoreBar = ({ breakdown }) => {
  if (!breakdown || Object.keys(breakdown).length === 0) return null;
  const entries = Object.entries(breakdown);
  const total = entries.reduce((s, [, v]) => s + (v || 0), 0);
  const barColors = ['var(--color-success)','var(--color-info)','var(--color-warning)','var(--color-accent-gold)','var(--color-primary)'];

  return (
    <div>
      <div style={{ height: '6px', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: 'var(--space-1)' }}>
        {entries.map(([key, val], i) => (
          <div
            key={key}
            title={`${key}: ${val}`}
            style={{
              width: `${total > 0 ? ((val / total) * 100) : 0}%`,
              background: barColors[i % barColors.length],
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
        {entries.map(([key, val], i) => (
          <span key={key} style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: barColors[i % barColors.length], display: 'inline-block' }} />
            {key}: {val}
          </span>
        ))}
      </div>
    </div>
  );
};

const MatchCard = ({ match, clientId, onStatusUpdate, onViewProperty, viewMode }) => {
  const [status, setStatus] = useState(match.status || 'new');
  const [notes, setNotes] = useState(match.agentNotes || '');
  const [saving, setSaving] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const matchedFeatures = match.matchedFeatures || [];
  const missingFeatures = match.missingMustHaves || [];
  const property = match.property || match.Property || {};
  const score = match.matchScore ?? match.score ?? 0;

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      await api.patch(`/clients/${clientId}/matches/${match.id}/status`, { status: newStatus, agentNotes: notes });
      onStatusUpdate(match.id, newStatus, notes);
    } catch {
      setStatus(match.status || 'new');
    } finally {
      setSaving(false);
    }
  };

  const handleNotesSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/clients/${clientId}/matches/${match.id}/status`, { status, agentNotes: notes });
      onStatusUpdate(match.id, status, notes);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = STATUS_COLORS[property.status] || 'var(--color-text-muted)';
  const typeEmoji = PROPERTY_TYPE_EMOJI[property.type] || '🏠';

  if (viewMode === 'grid') {
    return (
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Hero image — overflow hidden clips the image only; ScoreCircle is outside this container */}
        <div style={{ aspectRatio: '16/9', background: 'var(--color-surface-glass)', position: 'relative', overflow: 'hidden', flexShrink: 0, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
          {property.heroImage ? (
            <img
              src={property.heroImage}
              alt={property.title || 'Property'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', background: 'var(--color-surface-glass)' }}>
              {typeEmoji}
            </div>
          )}
          {/* Status badge stays inside the image area */}
          {property.status && (
            <div style={{ position: 'absolute', top: 'var(--space-2)', left: 'var(--space-2)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 'var(--font-semibold)', background: 'rgba(0,0,0,0.6)', color: statusColor, border: `1px solid ${statusColor}` }}>
              {capitalizeType(property.status)}
            </div>
          )}
        </div>

        {/* ScoreCircle overlay — positioned relative to the card (not inside overflow:hidden hero) */}
        <div style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', zIndex: 2 }}>
          <ScoreCircle score={score} size={52} />
        </div>

        {/* Card content */}
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
          {/* Title */}
          <div
            style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', cursor: onViewProperty ? 'pointer' : 'default', lineHeight: 1.3 }}
            onClick={() => onViewProperty && onViewProperty(property.id || match.propertyId)}
            title={onViewProperty ? 'Click to view property details' : undefined}
          >
            {property.title || 'Property'}
          </div>

          {/* Locality + Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              📍 {property.locality || '—'}
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', whiteSpace: 'nowrap' }}>
              {formatPrice(property.price, property.listingType)}
            </div>
          </div>

          {/* Type badge + beds/baths/area row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {property.type && (
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-glass)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                {typeEmoji} {capitalizeType(property.type)}
              </span>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {property.bedrooms != null && <span>🛏️ {property.bedrooms}</span>}
              {property.bathrooms != null && <span>🚿 {property.bathrooms}</span>}
              {property.area && <span>📐 {property.area}m²</span>}
            </div>
          </div>

          {/* Score breakdown */}
          {match.matchBreakdown && (
            <div style={{ marginTop: 'var(--space-1)' }}>
              <ScoreBar breakdown={match.matchBreakdown} />
            </div>
          )}

          {/* Feature chips */}
          {(matchedFeatures.length > 0 || missingFeatures.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {matchedFeatures.slice(0, 3).map(f => (
                <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--radius-full)', fontSize: '10px', background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>✓ {f}</span>
              ))}
              {missingFeatures.slice(0, 2).map(f => (
                <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--radius-full)', fontSize: '10px', background: 'var(--color-error-light)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>✗ {f}</span>
              ))}
              {(matchedFeatures.length + missingFeatures.length) > 5 && (
                <span style={{ padding: '1px 6px', borderRadius: 'var(--radius-full)', fontSize: '10px', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>+{matchedFeatures.length + missingFeatures.length - 5} more</span>
              )}
            </div>
          )}

          {/* Status dropdown */}
          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={saving}
              style={inputStyle}
            >
              {MATCH_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Notes toggle + View Details */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={() => setNotesOpen(o => !o)}
              style={{ ...secondaryBtnStyle, flex: 1 }}
            >
              {notesOpen ? '▲ Notes' : '▼ Notes'}
            </button>
            {onViewProperty && (
              <button
                type="button"
                onClick={() => onViewProperty(property.id || match.propertyId)}
                style={{ ...viewBtnStyle, flex: 1 }}
              >
                View Details
              </button>
            )}
          </div>

          {/* Expandable notes */}
          {notesOpen && (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this match…"
                rows={2}
                style={{ ...inputStyle, flex: 1, resize: 'vertical', fontFamily: 'var(--font-body)' }}
              />
              <button onClick={handleNotesSave} disabled={saving} style={saveBtnStyle}>
                {saving ? '…' : '💾'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {property.heroImage ? (
            <img src={property.heroImage} alt={property.title || 'Property'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '28px' }}>{typeEmoji}</span>
          )}
        </div>

        {/* Property info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', cursor: onViewProperty ? 'pointer' : 'default', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onClick={() => onViewProperty && onViewProperty(property.id || match.propertyId)}
          >
            {property.title || 'Property'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span>📍 {property.locality || '—'}</span>
            {property.type && <span>{typeEmoji} {capitalizeType(property.type)}</span>}
            {property.bedrooms != null && <span>🛏️ {property.bedrooms}</span>}
            {property.bathrooms != null && <span>🚿 {property.bathrooms}</span>}
            {property.area && <span>📐 {property.area}m²</span>}
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)' }}>
            {formatPrice(property.price, property.listingType)}
          </div>
        </div>

        {/* Score */}
        <ScoreCircle score={score} size={52} />
      </div>

      {/* Score breakdown */}
      {match.matchBreakdown && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <ScoreBar breakdown={match.matchBreakdown} />
        </div>
      )}

      {/* Feature chips */}
      {(matchedFeatures.length > 0 || missingFeatures.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {matchedFeatures.map(f => (
            <span key={f} style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>✓ {f}</span>
          ))}
          {missingFeatures.map(f => (
            <span key={f} style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', background: 'var(--color-error-light)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>✗ {f}</span>
          ))}
        </div>
      )}

      {/* Status + notes */}
      <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
          <label style={labelStyle}>Match Status</label>
          <select
            value={status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={saving}
            style={inputStyle}
          >
            {MATCH_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Agent Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this match…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }}
            />
          </div>
          <button onClick={handleNotesSave} disabled={saving} style={{ ...saveBtnStyle, marginTop: '18px' }}>
            {saving ? '…' : '💾'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientMatches = ({ clientId, onClose }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score');
  const [viewMode, setViewMode] = useState('grid');
  const [overlayProperty, setOverlayProperty] = useState(null);
  const [overlayLoading, setOverlayLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/clients/${clientId}/matches`);
      setMatches(res.data.matches || res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api.post(`/clients/${clientId}/matches/recalculate`);
      setMatches(res.data.matches || res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  const handleStatusUpdate = (matchId, newStatus, newNotes) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: newStatus, agentNotes: newNotes } : m));
  };

  const handleViewProperty = async (propertyId) => {
    if (!propertyId) return;
    setOverlayLoading(true);
    try {
      const res = await api.get(`/properties/${propertyId}`);
      setOverlayProperty(res.data);
    } catch {
      setError('Could not load property details. Please try again.');
    } finally {
      setOverlayLoading(false);
    }
  };

  const filtered = matches
    .filter(m => (m.matchScore ?? m.score ?? 0) >= minScore)
    .sort((a, b) => {
      if (sortBy === 'score') return (b.matchScore ?? b.score ?? 0) - (a.matchScore ?? a.score ?? 0);
      if (sortBy === 'price') return ((a.property || a.Property)?.price ?? 0) - ((b.property || b.Property)?.price ?? 0);
      return 0;
    });

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0 }}>
            Property Matches
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid view"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--color-accent-gold)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}
            >⊞ Grid</button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List view"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                border: 'none',
                borderLeft: '1px solid var(--color-border)',
                background: viewMode === 'list' ? 'var(--color-accent-gold)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}
            >☰ List</button>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-accent-gold)',
              background: 'transparent',
              color: 'var(--color-accent-gold)',
              cursor: recalculating ? 'wait' : 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
            }}
          >
            {recalculating ? '⟳ Recalculating…' : '⟳ Recalculate'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>Min Score: {minScore}%</label>
          <input
            type="range" min={0} max={100} value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            style={{ width: '150px', accentColor: 'var(--color-accent-gold)' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
            <option value="score">Score (High → Low)</option>
            <option value="price">Price (Low → High)</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
          Loading matches…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🔍</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-secondary)' }}>No matches found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try recalculating or lowering the minimum score filter.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              clientId={clientId}
              onStatusUpdate={handleStatusUpdate}
              onViewProperty={handleViewProperty}
              viewMode="grid"
            />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && viewMode === 'list' && (
        <div>
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              clientId={clientId}
              onStatusUpdate={handleStatusUpdate}
              onViewProperty={handleViewProperty}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Property overlay modal */}
      {(overlayProperty || overlayLoading) && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}
          onClick={() => setOverlayProperty(null)}
        >
          <div
            style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', width: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative', boxShadow: 'var(--shadow-glass)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOverlayProperty(null)}
              aria-label="Close property details"
              style={{
                position: 'sticky',
                top: 'var(--space-3)',
                float: 'right',
                marginRight: 'var(--space-3)',
                zIndex: 10,
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-glass)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}
            >✕ Close</button>
            {overlayLoading ? (
              <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading property…</div>
            ) : (
              <PropertyDetail
                property={overlayProperty}
                onClose={() => setOverlayProperty(null)}
                onEdit={null}
                onToggleAvailable={() => {}}
                onToggleFeatured={() => {}}
                onDelete={null}
                canEdit={false}
                canToggleFeatured={false}
                canDelete={false}
                canApprove={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
};

const inputStyle = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  backdropFilter: 'blur(8px)',
  width: '100%',
  boxSizing: 'border-box',
};

const saveBtnStyle = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  alignSelf: 'flex-start',
};

const secondaryBtnStyle = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
};

const viewBtnStyle = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'transparent',
  color: 'var(--color-accent-gold)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
};

export default ClientMatches;

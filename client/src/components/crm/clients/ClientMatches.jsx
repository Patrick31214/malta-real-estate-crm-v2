import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { MATCH_STATUSES } from '../../../constants/clientRequirements';

const getScoreColor = (score) => {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-warning)';
  return 'var(--color-error)';
};

const ScoreCircle = ({ score }) => {
  const color = getScoreColor(score);
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{
      width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
      background: `conic-gradient(${color} ${pct * 3.6}deg, var(--color-border) 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color }}>{score}%</span>
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
      <div style={{ height: '8px', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: 'var(--space-2)' }}>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {entries.map(([key, val], i) => (
          <span key={key} style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: barColors[i % barColors.length], display: 'inline-block' }} />
            {key}: {val}
          </span>
        ))}
      </div>
    </div>
  );
};

const MatchCard = ({ match, clientId, onStatusUpdate }) => {
  const [status, setStatus] = useState(match.status || 'new');
  const [notes, setNotes] = useState(match.agentNotes || '');
  const [saving, setSaving] = useState(false);

  const matchedFeatures = match.matchedFeatures || [];
  const missingFeatures = match.missingMustHaves || [];
  const property = match.property || match.Property || {};

  const formatPrice = (price, type) => {
    if (!price) return '—';
    const num = Number(price);
    const fmt = '€ ' + num.toLocaleString('en-MT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (type === 'long_let' || type === 'short_let') ? fmt + '/mo' : fmt;
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      await api.patch(`/clients/${clientId}/matches/${match.id}/status`, { status: newStatus, agentNotes: notes });
      onStatusUpdate(match.id, newStatus, notes);
    } catch {
      // revert on error
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

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Score circle */}
        <ScoreCircle score={match.score ?? 0} />

        {/* Property info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', marginBottom: '2px' }}>
            {property.title || 'Property'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            📍 {property.locality || '—'}
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)' }}>
            {formatPrice(property.price, property.listingType)}
          </div>
        </div>

        {/* Status dropdown */}
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
      </div>

      {/* Score breakdown */}
      {match.breakdown && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <ScoreBar breakdown={match.breakdown} />
        </div>
      )}

      {/* Features */}
      {(matchedFeatures.length > 0 || missingFeatures.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          {matchedFeatures.map(f => (
            <span key={f} style={{
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontSize: '10px', background: 'var(--color-success-light)',
              color: 'var(--color-success)', border: '1px solid var(--color-success)',
            }}>✓ {f}</span>
          ))}
          {missingFeatures.map(f => (
            <span key={f} style={{
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontSize: '10px', background: 'var(--color-error-light)',
              color: 'var(--color-error)', border: '1px solid var(--color-error)',
            }}>✗ {f}</span>
          ))}
        </div>
      )}

      {/* Agent notes */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <label style={labelStyle}>Agent Notes</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px' }}>
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

  const filtered = matches
    .filter(m => (m.score ?? 0) >= minScore)
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === 'price') return ((a.property || a.Property)?.price ?? 0) - ((b.property || b.Property)?.price ?? 0);
      return 0;
    });

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0 }}>
            Property Matches
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
          <button onClick={onClose} style={backBtnStyle}>← Back</button>
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

      {!loading && filtered.map(match => (
        <MatchCard
          key={match.id}
          match={match}
          clientId={clientId}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
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
};

const backBtnStyle = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
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

export default ClientMatches;

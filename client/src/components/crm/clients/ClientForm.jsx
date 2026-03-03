import React, { useState } from 'react';
import api from '../../../services/api';
import { CLIENT_STATUSES, CLIENT_PREFERENCES, URGENCY_LABELS, MALTA_LOCALITIES, MOVE_IN_FLEXIBILITY } from '../../../constants/clientRequirements';
import { PROPERTY_FEATURES, CATEGORY_ICONS } from '../../../constants/propertyFeatures';

const EMPTY_FORM = {
  // Personal
  firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
  nationality: '', occupation: '', dateOfBirth: '', idNumber: '',
  // Living Situation
  numberOfPeople: '', hasChildren: false, numberOfChildren: '', childrenAges: '',
  hasPets: false, petDetails: '', yearsInMalta: '', currentAddress: '',
  // Requirements
  lookingFor: '', propertyTypes: [], preferredLocalities: [],
  minBudget: '', maxBudget: '', minBedrooms: '', maxBedrooms: '',
  minBathrooms: '', minArea: '', maxArea: '',
  // Features
  mustHaveFeatures: [], niceToHaveFeatures: [],
  // Internal
  acceptsChildren: false, childFriendlyRequired: false,
  acceptsSharing: false, isPetFriendly: false,
  isNegotiable: false, acceptsShortLet: false,
  // Timeline
  moveInDate: '', moveInFlexibility: '', urgency: '',
  viewingAvailability: '',
  // Additional
  notes: '', specialRequirements: '', referralSource: '',
  status: 'active', agentId: '', isVIP: false,
};

const SECTIONS = [
  'Personal Information',
  'Living Situation',
  'Property Requirements',
  'Must-Have Features',
  'Nice-to-Have Features',
  'Internal Preferences',
  'Viewing & Timeline',
  'Additional',
];

// ---------- small helpers ----------
const ToggleSwitch = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none' }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', position: 'relative',
        background: checked ? 'var(--color-success)' : 'var(--color-border)',
        transition: 'background var(--transition-fast)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: checked ? '19px' : '3px',
        width: '14px', height: '14px', borderRadius: '50%',
        background: '#fff', transition: 'left var(--transition-fast)',
      }} />
    </div>
    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</span>
  </label>
);

const FeaturePicker = ({ selected, onChange, exclude }) => {
  const [expandedCats, setExpandedCats] = useState({});
  const [search, setSearch] = useState('');
  const searchLower = search.toLowerCase();

  const toggle = (feature) => {
    onChange(
      selected.includes(feature)
        ? selected.filter(f => f !== feature)
        : [...selected, feature]
    );
  };

  const toggleCat = (cat) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div>
      <input
        type="text"
        placeholder="🔎 Search features…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, width: '100%', marginBottom: 'var(--space-3)', boxSizing: 'border-box' }}
      />
      {Object.entries(PROPERTY_FEATURES).map(([category, features]) => {
        const visible = search
          ? features.filter(f => !exclude?.includes(f) && f.toLowerCase().includes(searchLower))
          : features.filter(f => !exclude?.includes(f));
        if (visible.length === 0) return null;
        const selectedInCat = visible.filter(f => selected.includes(f)).length;
        const isExpanded = !!expandedCats[category];
        return (
          <div key={category} style={{ marginBottom: 'var(--space-2)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div
              onClick={() => toggleCat(category)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', cursor: 'pointer', background: 'var(--color-surface-glass)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span>{CATEGORY_ICONS[category]}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{category}</span>
                {selectedInCat > 0 && (
                  <span style={{ fontSize: 'var(--text-xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-gold)', color: '#fff', fontWeight: 'var(--font-semibold)' }}>
                    {selectedInCat}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{isExpanded || search ? '▲' : '▼'}</span>
            </div>
            {(isExpanded || search) && (
              <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {visible.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggle(feature)}
                    className={`feature-chip${selected.includes(feature) ? ' selected' : ''}`}
                  >
                    {selected.includes(feature) && <span>✓ </span>}{feature}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const LocalitiesSelect = ({ selected, onChange }) => {
  const [search, setSearch] = useState('');
  const searchLower = search.toLowerCase();
  const visible = search
    ? MALTA_LOCALITIES.filter(l => l.toLowerCase().includes(searchLower))
    : MALTA_LOCALITIES;

  const toggle = (loc) => {
    onChange(selected.includes(loc) ? selected.filter(l => l !== loc) : [...selected, loc]);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="🔎 Search localities…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, width: '100%', marginBottom: 'var(--space-2)', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', maxHeight: '160px', overflowY: 'auto' }}>
        {visible.map(loc => (
          <button
            key={loc}
            type="button"
            onClick={() => toggle(loc)}
            className={`feature-chip${selected.includes(loc) ? ' selected' : ''}`}
          >
            {selected.includes(loc) && <span>✓ </span>}{loc}
          </button>
        ))}
      </div>
    </div>
  );
};

const PropertyTypePicker = ({ selected, onChange }) => {
  const toggle = (type) => {
    onChange(selected.includes(type) ? selected.filter(t => t !== type) : [...selected, type]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
      {CLIENT_PREFERENCES.propertyTypes.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => toggle(type)}
          className={`feature-chip${selected.includes(type) ? ' selected' : ''}`}
          style={{ textTransform: 'capitalize' }}
        >
          {selected.includes(type) && <span>✓ </span>}{type}
        </button>
      ))}
    </div>
  );
};

// ---------- main form ----------
const ClientForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(initial || {}) }));
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let res;
      if (initial?.id) {
        res = await api.put(`/clients/${initial.id}`, form);
      } else {
        res = await api.post('/clients', form);
      }
      onSave(res.data.client || res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial?.id;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>
          {isEdit ? `Edit Client` : 'Add New Client'}
        </h1>
        <button onClick={onCancel} style={cancelBtnStyle}>← Cancel</button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(i)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: activeSection === i ? 'var(--color-accent-gold)' : 'var(--color-surface-glass)',
              color: activeSection === i ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: activeSection === i ? 'var(--font-semibold)' : 'var(--font-normal)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>

          {/* Section 0: Personal Information */}
          {activeSection === 0 && (
            <div>
              <SectionHeading>👤 Personal Information</SectionHeading>
              <div style={gridStyle}>
                <FormField label="First Name *">
                  <input type="text" required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Last Name *">
                  <input type="text" required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Email">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Phone">
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Alternate Phone">
                  <input type="tel" value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Nationality">
                  <input type="text" value={form.nationality} onChange={e => set('nationality', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Occupation">
                  <input type="text" value={form.occupation} onChange={e => set('occupation', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Date of Birth">
                  <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="ID / Passport Number">
                  <input type="text" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} style={inputStyle} />
                </FormField>
              </div>
            </div>
          )}

          {/* Section 1: Living Situation */}
          {activeSection === 1 && (
            <div>
              <SectionHeading>🏡 Living Situation</SectionHeading>
              <div style={gridStyle}>
                <FormField label="Number of People">
                  <input type="number" min={1} value={form.numberOfPeople} onChange={e => set('numberOfPeople', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Years in Malta">
                  <input type="number" min={0} value={form.yearsInMalta} onChange={e => set('yearsInMalta', e.target.value)} style={inputStyle} />
                </FormField>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <ToggleSwitch checked={form.hasChildren} onChange={v => set('hasChildren', v)} label="Has Children" />
                <ToggleSwitch checked={form.hasPets} onChange={v => set('hasPets', v)} label="Has Pets" />
              </div>
              {form.hasChildren && (
                <div style={gridStyle}>
                  <FormField label="Number of Children">
                    <input type="number" min={0} value={form.numberOfChildren} onChange={e => set('numberOfChildren', e.target.value)} style={inputStyle} />
                  </FormField>
                  <FormField label="Children Ages">
                    <input type="text" placeholder="e.g. 3, 7, 12" value={form.childrenAges} onChange={e => set('childrenAges', e.target.value)} style={inputStyle} />
                  </FormField>
                </div>
              )}
              {form.hasPets && (
                <FormField label="Pet Details">
                  <input type="text" placeholder="e.g. 1 dog, 2 cats" value={form.petDetails} onChange={e => set('petDetails', e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </FormField>
              )}
              <FormField label="Current Address">
                <textarea
                  rows={2}
                  value={form.currentAddress}
                  onChange={e => set('currentAddress', e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)' }}
                />
              </FormField>
            </div>
          )}

          {/* Section 2: Property Requirements */}
          {activeSection === 2 && (
            <div>
              <SectionHeading>🏠 Property Requirements</SectionHeading>
              <div style={gridStyle}>
                <FormField label="Looking For">
                  <select value={form.lookingFor} onChange={e => set('lookingFor', e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {CLIENT_PREFERENCES.lookingFor.map(v => (
                      <option key={v} value={v}>{v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Min Budget (€)">
                  <input type="number" min={0} value={form.minBudget} onChange={e => set('minBudget', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Max Budget (€)">
                  <input type="number" min={0} value={form.maxBudget} onChange={e => set('maxBudget', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Min Bedrooms">
                  <input type="number" min={0} value={form.minBedrooms} onChange={e => set('minBedrooms', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Max Bedrooms">
                  <input type="number" min={0} value={form.maxBedrooms} onChange={e => set('maxBedrooms', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Min Bathrooms">
                  <input type="number" min={0} value={form.minBathrooms} onChange={e => set('minBathrooms', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Min Area (m²)">
                  <input type="number" min={0} value={form.minArea} onChange={e => set('minArea', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Max Area (m²)">
                  <input type="number" min={0} value={form.maxArea} onChange={e => set('maxArea', e.target.value)} style={inputStyle} />
                </FormField>
              </div>

              <FormField label="Property Types">
                <PropertyTypePicker selected={form.propertyTypes} onChange={v => set('propertyTypes', v)} />
              </FormField>

              <FormField label="Preferred Localities" style={{ marginTop: 'var(--space-4)' }}>
                <LocalitiesSelect selected={form.preferredLocalities} onChange={v => set('preferredLocalities', v)} />
              </FormField>
            </div>
          )}

          {/* Section 3: Must-Have Features */}
          {activeSection === 3 && (
            <div>
              <SectionHeading>✅ Must-Have Features</SectionHeading>
              <FeaturePicker
                selected={form.mustHaveFeatures}
                onChange={v => set('mustHaveFeatures', v)}
                exclude={form.niceToHaveFeatures}
              />
            </div>
          )}

          {/* Section 4: Nice-to-Have Features */}
          {activeSection === 4 && (
            <div>
              <SectionHeading>💫 Nice-to-Have Features</SectionHeading>
              <FeaturePicker
                selected={form.niceToHaveFeatures}
                onChange={v => set('niceToHaveFeatures', v)}
                exclude={form.mustHaveFeatures}
              />
            </div>
          )}

          {/* Section 5: Internal Preferences */}
          {activeSection === 5 && (
            <div style={{ border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'rgba(196,154,69,0.05)' }}>
              <SectionHeading>🔒 Internal Preferences</SectionHeading>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning)', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-medium)' }}>
                ⚠ Internal use only — not shared with client
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <ToggleSwitch checked={form.acceptsChildren} onChange={v => set('acceptsChildren', v)} label="Accepts children in property" />
                <ToggleSwitch checked={form.childFriendlyRequired} onChange={v => set('childFriendlyRequired', v)} label="Child-friendly property required" />
                <ToggleSwitch checked={form.acceptsSharing} onChange={v => set('acceptsSharing', v)} label="Accepts flat-sharing arrangement" />
                <ToggleSwitch checked={form.isPetFriendly} onChange={v => set('isPetFriendly', v)} label="Pet-friendly property required" />
                <ToggleSwitch checked={form.isNegotiable} onChange={v => set('isNegotiable', v)} label="Budget is negotiable" />
                <ToggleSwitch checked={form.acceptsShortLet} onChange={v => set('acceptsShortLet', v)} label="Accepts short let" />
              </div>
            </div>
          )}

          {/* Section 6: Viewing & Timeline */}
          {activeSection === 6 && (
            <div>
              <SectionHeading>📅 Viewing & Timeline</SectionHeading>
              <div style={gridStyle}>
                <FormField label="Move-in Date">
                  <input type="date" value={form.moveInDate} onChange={e => set('moveInDate', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Move-in Flexibility">
                  <select value={form.moveInFlexibility} onChange={e => set('moveInFlexibility', e.target.value)} style={inputStyle}>
                    <option value="">Select flexibility…</option>
                    {MOVE_IN_FLEXIBILITY.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Urgency">
                  <select value={form.urgency} onChange={e => set('urgency', e.target.value)} style={inputStyle}>
                    <option value="">Select urgency…</option>
                    {Object.entries(URGENCY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Viewing Availability Notes">
                <textarea
                  rows={3}
                  value={form.viewingAvailability}
                  onChange={e => set('viewingAvailability', e.target.value)}
                  placeholder="e.g. Weekday evenings only, or anytime with 24h notice…"
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)' }}
                />
              </FormField>
            </div>
          )}

          {/* Section 7: Additional */}
          {activeSection === 7 && (
            <div>
              <SectionHeading>📝 Additional</SectionHeading>
              <div style={gridStyle}>
                <FormField label="Status">
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                    {CLIENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Referral Source">
                  <input type="text" value={form.referralSource} onChange={e => set('referralSource', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Agent ID">
                  <input type="text" value={form.agentId} onChange={e => set('agentId', e.target.value)} placeholder="Agent user ID" style={inputStyle} />
                </FormField>
              </div>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ToggleSwitch checked={form.isVIP} onChange={v => set('isVIP', v)} label="⭐ VIP Client" />
              </div>
              <FormField label="Notes">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)' }}
                />
              </FormField>
              <FormField label="Special Requirements">
                <textarea
                  rows={3}
                  value={form.specialRequirements}
                  onChange={e => set('specialRequirements', e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)' }}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Navigation + Submit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {activeSection > 0 && (
              <button type="button" onClick={() => setActiveSection(s => s - 1)} style={navBtnStyle}>
                ← Previous
              </button>
            )}
            {activeSection < SECTIONS.length - 1 && (
              <button type="button" onClick={() => setActiveSection(s => s + 1)} style={navBtnStyle}>
                Next →
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-accent-gold)',
              background: 'var(--color-accent-gold)',
              color: '#fff',
              cursor: saving ? 'wait' : 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '+ Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------- sub-components ----------
const SectionHeading = ({ children }) => (
  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
    {children}
  </h2>
);

const FormField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'var(--space-4)' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

// ---------- styles ----------
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-2)',
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

const cancelBtnStyle = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
};

const navBtnStyle = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
};

export default ClientForm;

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import PROPERTY_FEATURES from '../../../constants/propertyFeatures';
import FileUpload from '../../ui/FileUpload';

const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = [
  { value: 'sale',      label: 'For Sale' },
  { value: 'long_let',  label: 'Long Let' },
  { value: 'short_let', label: 'Short Let' },
  { value: 'both',      label: 'Both' },
];
const STATUS_TYPES = ['draft','listed','under_offer','sold','rented','withdrawn'];
const MALTA_LOCALITIES = ['Attard','Balzan','Birgu','Birkirkara','Birzebbuga','Bormla','Dingli','Fgura','Floriana','Fontana','Gharb','Gharghur','Ghasri','Ghaxaq','Gudja','Gzira','Hamrun','Iklin','Imdina','Imgarr','Imqabba','Imsida','Imtarfa','Kalkara','Kercem','Kirkop','Lija','Luqa','Marsa','Marsaskala','Marsaxlokk','Mellieha','Mgarr','Mosta','Mqabba','Msida','Mtarfa','Munxar','Naxxar','Paola','Pembroke','Pieta','Qala','Qormi','Qrendi','Rabat','Safi','San Gwann','San Lawrenz','San Pawl il-Baħar','Sannat','Santa Lucija','Santa Venera','Siggiewi','Sliema','St Julian\'s','St Paul\'s Bay','Swieqi','Ta\'Xbiex','Tarxien','Valletta','Xaghra','Xewkija','Xghajra','Zabbar','Zebbug','Zejtun','Zurrieq'];

const EMPTY_FORM = {
  title: '', description: '', type: '', listingType: '', status: 'draft',
  price: '', currency: 'EUR',
  bedrooms: '', bathrooms: '', area: '', floor: '', totalFloors: '', yearBuilt: '', energyRating: '',
  locality: '', address: '',
  features: [],
  heroImage: '', images: [], virtualTourUrl: '', videoUrl: '',
  droneImages: [], droneVideoUrl: '', threeDViewUrl: '',
  ownerId: '', agentId: '', branchId: '',
  isAvailable: true, isFeatured: false, availableFrom: '',
  acceptsChildren: true, childFriendlyRequired: false, acceptsSharing: false,
  acceptsShortLet: false, isPetFriendly: false, isNegotiable: false,
  acceptedAgeRange: '', internalNotes: '',
};

const PropertyForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial ? {
    ...EMPTY_FORM,
    ...initial,
    bedrooms:   initial.bedrooms   ?? '',
    bathrooms:  initial.bathrooms  ?? '',
    area:       initial.area       ?? '',
    floor:      initial.floor      ?? '',
    totalFloors:initial.totalFloors?? '',
    yearBuilt:  initial.yearBuilt  ?? '',
    features:   initial.features   || [],
    images:     initial.images     || [],
    droneImages: initial.droneImages || [],
    droneVideoUrl: initial.droneVideoUrl || '',
    threeDViewUrl: initial.threeDViewUrl || '',
    ownerId:    initial.ownerId    || '',
    agentId:    initial.agentId    || '',
    branchId:   initial.branchId   || '',
    availableFrom: initial.availableFrom ? initial.availableFrom.split('T')[0] : '',
  } : EMPTY_FORM);

  const [owners, setOwners]   = useState([]);
  const [agents, setAgents]   = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    api.get('/owners?limit=200').then(r => setOwners(r.data.owners || [])).catch(() => {});
    api.get('/users?role=agent').then(r => setAgents(r.data.users || [])).catch(() => {});
    api.get('/branches').then(r => setBranches(r.data.branches || [])).catch(() => {});
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleFeature = (feat) => {
    setForm(f => ({
      ...f,
      features: f.features.includes(feat)
        ? f.features.filter(x => x !== feat)
        : [...f.features, feat],
    }));
  };

  const toggleCategory = (cat) => {
    setCollapsedCategories(c => ({ ...c, [cat]: !c[cat] }));
  };

  const generateTitle = (type, locality, referenceNumber) => {
    const ref = referenceNumber || '';
    return [capitalize(type), 'in', locality, ref ? `- ${ref}` : ''].filter(Boolean).join(' ');
  };

  const validate = () => {
    const errs = {};
    // Auto-generate title if empty
    if (!form.title.trim() && form.type && form.locality) {
      set('title', generateTitle(form.type, form.locality, initial?.referenceNumber));
    } else if (!form.title.trim()) {
      errs.title = 'Title is required';
    }
    if (!form.type)            errs.type = 'Type is required';
    if (!form.listingType)     errs.listingType = 'Listing type is required';
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Valid price is required';
    if (!form.locality.trim()) errs.locality = 'Locality is required';
    if (!form.ownerId)         errs.ownerId = 'Owner is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      // Auto-generate title if still empty after validation
      if (!payload.title.trim() && payload.type && payload.locality) {
        payload.title = generateTitle(payload.type, payload.locality, initial?.referenceNumber);
      }
      // Ensure ownerId is included
      if (!payload.ownerId && initial?.ownerId) payload.ownerId = initial.ownerId;
      // clean up empty numeric fields
      ['bedrooms','bathrooms','floor','totalFloors','yearBuilt'].forEach(k => {
        payload[k] = payload[k] !== '' ? parseInt(payload[k], 10) : null;
      });
      ['price','area'].forEach(k => {
        const raw = String(payload[k] ?? '').replace(/[€,\s]/g, '');
        payload[k] = raw !== '' ? parseFloat(raw) : null;
      });
      ['agentId','branchId','availableFrom'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });

      let response;
      if (initial?.id) {
        response = await api.put(`/properties/${initial.id}`, payload);
      } else {
        response = await api.post('/properties', payload);
      }
      onSave(response.data);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(e => { mapped[e.path || e.param] = e.msg; });
        setErrors(mapped);
      } else {
        setErrors({ _general: err.response?.data?.error || 'Save failed' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 'min(95vw, 1400px)', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
        {initial?.id ? 'Edit Property' : 'Add Property'}
      </h2>

      {errors._general && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {errors._general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Section title="Basic Info">
          <FormField label="Title *" error={errors.title}>
            <input style={inputStyle(errors.title)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Stunning Sliema Penthouse" />
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...inputStyle(), minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the property…" />
          </FormField>
          <Row>
            <FormField label="Type *" error={errors.type}>
              <select style={inputStyle(errors.type)} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">Select Type</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
              </select>
            </FormField>
            <FormField label="Listing Type *" error={errors.listingType}>
              <select style={inputStyle(errors.listingType)} value={form.listingType} onChange={e => set('listingType', e.target.value)}>
                <option value="">Select Listing</option>
                {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select style={inputStyle()} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_TYPES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </FormField>
          </Row>
          <Row>
            <FormField label="Price (€) *" error={errors.price}>
              <input type="number" style={inputStyle(errors.price)} value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 450000" min={0} />
            </FormField>
            <FormField label="Currency">
              <input style={inputStyle()} value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="EUR" maxLength={3} />
            </FormField>
          </Row>
        </Section>

        {/* Details */}
        <Section title="Details">
          <Row>
            <FormField label="Bedrooms"><input type="number" style={inputStyle()} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} min={0} /></FormField>
            <FormField label="Bathrooms"><input type="number" style={inputStyle()} value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} min={0} /></FormField>
            <FormField label="Area (m²)"><input type="number" style={inputStyle()} value={form.area} onChange={e => set('area', e.target.value)} min={0} /></FormField>
          </Row>
          <Row>
            <FormField label="Floor"><input type="number" style={inputStyle()} value={form.floor} onChange={e => set('floor', e.target.value)} /></FormField>
            <FormField label="Total Floors"><input type="number" style={inputStyle()} value={form.totalFloors} onChange={e => set('totalFloors', e.target.value)} min={1} /></FormField>
            <FormField label="Year Built"><input type="number" style={inputStyle()} value={form.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} min={1800} max={new Date().getFullYear()} /></FormField>
            <FormField label="Energy Rating"><input style={inputStyle()} value={form.energyRating} onChange={e => set('energyRating', e.target.value)} placeholder="e.g. A" /></FormField>
          </Row>
        </Section>

        {/* Location */}
        <Section title="Location">
          <FormField label="Locality *" error={errors.locality}>
            <select style={inputStyle(errors.locality)} value={form.locality} onChange={e => set('locality', e.target.value)}>
              <option value="">Select Locality</option>
              {MALTA_LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Full Address">
            <textarea style={{ ...inputStyle(), resize: 'vertical' }} value={form.address} onChange={e => set('address', e.target.value)} rows={2} />
          </FormField>
        </Section>

        {/* Features */}
        <Section title="Features">
          {Object.entries(PROPERTY_FEATURES).map(([category, feats]) => (
            <div key={category} style={{ marginBottom: 'var(--space-3)' }}>
              <button
                type="button"
                className="collapsible-header"
                style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-text-secondary)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', cursor: 'pointer', padding: 'var(--space-1) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
                <span style={{ fontSize: 'var(--text-xs)' }}>
                  {form.features.filter(f => feats.includes(f)).length > 0
                    ? `${form.features.filter(f => feats.includes(f)).length} selected · `
                    : ''
                  }
                  {collapsedCategories[category] ? '▸' : '▾'}
                </span>
              </button>
              {!collapsedCategories[category] && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {feats.map(feat => (
                    <button
                      key={feat}
                      type="button"
                      className={`feature-chip${form.features.includes(feat) ? ' active' : ''}`}
                      onClick={() => toggleFeature(feat)}
                    >
                      {form.features.includes(feat) ? '✓ ' : ''}{feat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {form.features.length > 0 && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
              {form.features.length} feature{form.features.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </Section>

        {/* Media */}
        <Section title="Media">
          <FormField label="Hero Image">
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              multiple={false}
              value={form.heroImage ? [form.heroImage] : []}
              onChange={(urls) => set('heroImage', urls[0] || '')}
              label="Upload Hero Image (JPG, PNG, WebP · max 10 MB)"
            />
          </FormField>
          <FormField label="Additional Images">
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              multiple={true}
              value={form.images}
              onChange={(urls) => set('images', urls)}
              label="Upload Property Images (JPG, PNG, WebP · max 10 MB each)"
            />
          </FormField>
          <Row>
            <FormField label="Virtual Tour URL">
              <input style={inputStyle()} value={form.virtualTourUrl} onChange={e => set('virtualTourUrl', e.target.value)} placeholder="https://…" />
            </FormField>
            <FormField label="Video (upload or URL)">
              <FileUpload
                accept="video/mp4"
                multiple={false}
                value={form.videoUrl && form.videoUrl.startsWith('/uploads/') ? [form.videoUrl] : []}
                onChange={(urls) => set('videoUrl', urls[0] || '')}
                label="Upload Video (MP4 · max 100 MB)"
              />
              {(!form.videoUrl || !form.videoUrl.startsWith('/uploads/')) && (
                <input
                  style={{ ...inputStyle(), marginTop: 'var(--space-2)' }}
                  value={form.videoUrl && !form.videoUrl.startsWith('/uploads/') ? form.videoUrl : ''}
                  onChange={e => set('videoUrl', e.target.value)}
                  placeholder="Or paste a video URL…"
                />
              )}
            </FormField>
          </Row>
          <Row>
            <FormField label="Drone Video URL">
              <input style={inputStyle()} value={form.droneVideoUrl} onChange={e => set('droneVideoUrl', e.target.value)} placeholder="https://… drone video link" />
            </FormField>
            <FormField label="3D View URL">
              <input style={inputStyle()} value={form.threeDViewUrl} onChange={e => set('threeDViewUrl', e.target.value)} placeholder="https://… 3D view link" />
            </FormField>
          </Row>
          <FormField label="Drone Images (comma-separated URLs)">
            <textarea
              style={{ ...inputStyle(), resize: 'vertical', minHeight: '60px' }}
              value={form.droneImages.join(', ')}
              onChange={e => set('droneImages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="https://…, https://…"
            />
          </FormField>
        </Section>

        {/* Assignment */}
        <Section title="Assignment">
          <FormField label="Owner *" error={errors.ownerId}>
            <select style={inputStyle(errors.ownerId)} value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
              <option value="">Select Owner</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.firstName} {o.lastName} — {o.phone}</option>)}
            </select>
          </FormField>
          <Row>
            <FormField label="Agent">
              <select style={inputStyle()} value={form.agentId} onChange={e => set('agentId', e.target.value)}>
                <option value="">No Agent</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
              </select>
            </FormField>
            <FormField label="Branch">
              <select style={inputStyle()} value={form.branchId} onChange={e => set('branchId', e.target.value)}>
                <option value="">No Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>
          </Row>
        </Section>

        {/* Settings */}
        <Section title="Settings">
          <Row>
            <FormField label="Available From">
              <input type="date" style={inputStyle()} value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)} />
            </FormField>
          </Row>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            <label style={toggleLabelStyle}>
              <input type="checkbox" checked={form.isAvailable} onChange={e => set('isAvailable', e.target.checked)} />
              <span>Available</span>
            </label>
            <label style={toggleLabelStyle}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
              <span>Featured</span>
            </label>
          </div>
        </Section>

        {/* Internal Property Specifications */}
        <Section title="🔒 Internal Property Specifications">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            ⚠ Internal use only — not shown on website
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.acceptsChildren} onChange={e => set('acceptsChildren', e.target.checked)} /><span>Accepts Children</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.childFriendlyRequired} onChange={e => set('childFriendlyRequired', e.target.checked)} /><span>Child-Friendly Required</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.acceptsSharing} onChange={e => set('acceptsSharing', e.target.checked)} /><span>Accepts Sharing</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.acceptsShortLet} onChange={e => set('acceptsShortLet', e.target.checked)} /><span>Accepts Short Let</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.isPetFriendly} onChange={e => set('isPetFriendly', e.target.checked)} /><span>Pet Friendly</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.isNegotiable} onChange={e => set('isNegotiable', e.target.checked)} /><span>Price is Negotiable</span></label>
          </div>
          <Row>
            <FormField label="Accepted Age Range">
              <input style={inputStyle()} value={form.acceptedAgeRange || ''} onChange={e => set('acceptedAgeRange', e.target.value)} placeholder="e.g. 25-55" />
            </FormField>
          </Row>
          <FormField label="Internal Notes">
            <textarea style={{ ...inputStyle(), minHeight: '80px', resize: 'vertical' }} value={form.internalNotes || ''} onChange={e => set('internalNotes', e.target.value)} placeholder="Internal notes about this property…" />
          </FormField>
        </Section>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-6)' }}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={saveBtnStyle}>{saving ? 'Saving…' : 'Save Property'}</button>
        </div>
      </form>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>{title}</h3>
    {children}
  </div>
);

const FormField = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1, minWidth: '150px' }}>
    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>{children}</div>
);

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const inputStyle = (error) => ({
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  width: '100%',
  outline: 'none',
  backdropFilter: 'blur(8px)',
});

const toggleLabelStyle = {
  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
  fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'pointer',
};

const cancelBtnStyle = {
  padding: 'var(--space-3) var(--space-6)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
};

const saveBtnStyle = {
  padding: 'var(--space-3) var(--space-8)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  boxShadow: 'var(--shadow-gold-sm)',
};

export default PropertyForm;

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = [
  { value: 'sale',      label: 'For Sale' },
  { value: 'long_let',  label: 'Long Let' },
  { value: 'short_let', label: 'Short Let' },
  { value: 'both',      label: 'Both' },
];
const STATUS_TYPES = ['draft','listed','under_offer','sold','rented','withdrawn'];
const MALTA_LOCALITIES = ['Attard','Balzan','Birgu','Birkirkara','Birzebbuga','Bormla','Dingli','Fgura','Floriana','Fontana','Gharb','Gharghur','Ghasri','Ghaxaq','Gudja','Gzira','Hamrun','Iklin','Imdina','Imgarr','Imqabba','Imsida','Imtarfa','Kalkara','Kercem','Kirkop','Lija','Luqa','Marsa','Marsaskala','Marsaxlokk','Mellieha','Mgarr','Mosta','Mqabba','Msida','Mtarfa','Munxar','Naxxar','Paola','Pembroke','Pieta','Qala','Qormi','Qrendi','Rabat','Safi','San Gwann','San Lawrenz','San Pawl il-Baħar','Sannat','Santa Lucija','Santa Venera','Siggiewi','Sliema','St Julian\'s','St Paul\'s Bay','Swieqi','Ta\'Xbiex','Tarxien','Valletta','Xaghra','Xewkija','Xghajra','Zabbar','Zebbug','Zejtun','Zurrieq'];
const COMMON_FEATURES = ['Pool','Sea View','Parking','Garden','Balcony','Lift','Furnished','Air Conditioning','Roof Terrace','Fireplace','Storage','Gym'];

const EMPTY_FORM = {
  title: '', description: '', type: '', listingType: '', status: 'draft',
  price: '', currency: 'EUR',
  bedrooms: '', bathrooms: '', area: '', floor: '', totalFloors: '', yearBuilt: '', energyRating: '',
  locality: '', address: '',
  features: [],
  heroImage: '', images: [], virtualTourUrl: '', videoUrl: '',
  ownerId: '', agentId: '', branchId: '',
  isAvailable: true, isFeatured: false, availableFrom: '',
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
  const [newImageUrl, setNewImageUrl] = useState('');

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

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm(f => ({ ...f, images: [...f.images, newImageUrl.trim()] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim())    errs.title = 'Title is required';
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
      // clean up empty numeric fields
      ['bedrooms','bathrooms','floor','totalFloors','yearBuilt'].forEach(k => {
        payload[k] = payload[k] !== '' ? parseInt(payload[k], 10) : null;
      });
      ['price','area'].forEach(k => {
        payload[k] = payload[k] !== '' ? parseFloat(payload[k]) : null;
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
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {COMMON_FEATURES.map(feat => (
              <label key={feat} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: `1px solid ${form.features.includes(feat) ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
                background: form.features.includes(feat) ? 'rgba(196,162,101,0.1)' : 'transparent',
                fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                transition: 'all var(--transition-fast)',
              }}>
                <input type="checkbox" checked={form.features.includes(feat)} onChange={() => toggleFeature(feat)} style={{ display: 'none' }} />
                {form.features.includes(feat) ? '✓ ' : ''}{feat}
              </label>
            ))}
          </div>
        </Section>

        {/* Media */}
        <Section title="Media">
          <FormField label="Hero Image URL">
            <input style={inputStyle()} value={form.heroImage} onChange={e => set('heroImage', e.target.value)} placeholder="https://…" />
          </FormField>
          <FormField label="Additional Images">
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <input style={{ ...inputStyle(), flex: 1 }} value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="Image URL" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} />
              <button type="button" onClick={addImage} style={addBtnStyle}>+ Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {form.images.map((img, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', background: 'var(--color-surface-glass)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 'var(--text-xs)' }}>
                  <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{img}</span>
                  <button type="button" onClick={() => removeImage(i)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
              ))}
            </div>
          </FormField>
          <Row>
            <FormField label="Virtual Tour URL">
              <input style={inputStyle()} value={form.virtualTourUrl} onChange={e => set('virtualTourUrl', e.target.value)} placeholder="https://…" />
            </FormField>
            <FormField label="Video URL">
              <input style={inputStyle()} value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://…" />
            </FormField>
          </Row>
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

const addBtnStyle = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'transparent',
  color: 'var(--color-accent-gold)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  whiteSpace: 'nowrap',
};

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

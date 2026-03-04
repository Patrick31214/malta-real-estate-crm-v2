import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import PROPERTY_FEATURES, { formatFeatureLabel } from '../../../constants/propertyFeatures';
import FileUpload from '../../ui/FileUpload';
import SearchableSelect from '../../ui/SearchableSelect';

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
  petPolicy: {},
  tenantPolicy: {},
  nationalityPolicy: {},
  contractTerms: {},
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
    petPolicy:          initial.petPolicy          || {},
    tenantPolicy:       initial.tenantPolicy       || {},
    nationalityPolicy:  initial.nationalityPolicy  || {},
    contractTerms:      initial.contractTerms      || {},
  } : EMPTY_FORM);

  const [owners, setOwners]   = useState([]);
  const [agents, setAgents]   = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const dupTimerRef = useRef(null);

  useEffect(() => {
    api.get('/owners?limit=500').then(r => setOwners(r.data.owners || [])).catch(() => {});
    api.get('/users?role=agent').then(r => setAgents(r.data.users || [])).catch(() => {});
    api.get('/branches').then(r => setBranches(r.data.branches || [])).catch(() => {});
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // Debounced duplicate detection
  const checkDuplicates = (updatedForm) => {
    if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
    dupTimerRef.current = setTimeout(async () => {
      const { ownerId, locality, type, address, title } = updatedForm;
      if (!ownerId && !address) return;
      try {
        const params = new URLSearchParams();
        if (ownerId) params.set('ownerId', ownerId);
        if (locality) params.set('locality', locality);
        if (type) params.set('type', type);
        if (address) params.set('address', address);
        if (title) params.set('title', title);
        if (initial?.id) params.set('excludeId', initial.id);
        const res = await api.get(`/properties/check-duplicate?${params}`);
        setDuplicates(res.data.matches || []);
        setDuplicateDismissed(false);
      } catch {
        // silently ignore duplicate check errors
      }
    }, 500);
  };

  const setAndCheck = (key, value) => {
    setForm(f => {
      const updated = { ...f, [key]: value };
      checkDuplicates(updated);
      return updated;
    });
  };

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

  const handleGenerateDescription = async () => {
    if (form.description && !window.confirm('This will replace the current description. Continue?')) return;
    setAiGenerating(true);
    try {
      const res = await api.post('/properties/generate-description', {
        type: form.type,
        listingType: form.listingType,
        locality: form.locality,
        bedrooms: form.bedrooms !== '' ? form.bedrooms : undefined,
        bathrooms: form.bathrooms !== '' ? form.bathrooms : undefined,
        area: form.area !== '' ? form.area : undefined,
        floor: form.floor !== '' ? form.floor : undefined,
        totalFloors: form.totalFloors !== '' ? form.totalFloors : undefined,
        yearBuilt: form.yearBuilt !== '' ? form.yearBuilt : undefined,
        energyRating: form.energyRating || undefined,
        price: form.price || undefined,
        currency: form.currency || 'EUR',
        features: form.features,
      });
      set('description', res.data.description);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate description');
    } finally {
      setAiGenerating(false);
    }
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

      {/* Duplicate warning */}
      {duplicates.length > 0 && !duplicateDismissed && (
        <div style={{ background: 'rgba(255,180,0,0.12)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
            <strong style={{ color: 'var(--color-warning)', fontSize: 'var(--text-sm)' }}>⚠️ Possible duplicate detected! Similar properties already exist:</strong>
            <button type="button" onClick={() => setDuplicateDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
          <ul style={{ margin: 'var(--space-2) 0', paddingLeft: 'var(--space-5)' }}>
            {duplicates.map(d => (
              <li key={d.id} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                {d.referenceNumber && <span style={{ fontFamily: 'monospace', marginRight: 'var(--space-2)', color: 'var(--color-accent-gold)' }}>{d.referenceNumber}</span>}
                <strong>{d.title}</strong> · {d.locality} · {d.type} · {d.status}
                {d.price && <span> · €{Number(d.price).toLocaleString()}</span>}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            You can still continue saving — this is just a warning.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Section title="Basic Info">
          {initial?.referenceNumber && (
            <FormField label="Reference Number">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '4px 10px', color: 'var(--color-accent-gold)' }}>
                  {initial.referenceNumber}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>(auto-generated, read-only)</span>
              </div>
            </FormField>
          )}
          <FormField label="Title *" error={errors.title}>
            <input style={inputStyle(errors.title)} value={form.title} onChange={e => setAndCheck('title', e.target.value)} placeholder="e.g. Stunning Sliema Penthouse" />
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...inputStyle(), minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the property…" />
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={aiGenerating || !form.type || !form.locality}
              title={!form.type || !form.locality ? 'Set Type and Locality first' : 'Generate with AI'}
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-accent-gold)',
                background: aiGenerating || !form.type || !form.locality ? 'transparent' : 'var(--color-accent-gold)',
                color: aiGenerating || !form.type || !form.locality ? 'var(--color-text-muted)' : '#fff',
                cursor: aiGenerating || !form.type || !form.locality ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                opacity: aiGenerating || !form.type || !form.locality ? 0.6 : 1,
                transition: 'all var(--transition-fast)',
              }}
            >
              {aiGenerating ? '⏳ Generating…' : '✨ Generate Description with AI'}
            </button>
          </FormField>
          <Row>
            <FormField label="Type *" error={errors.type}>
              <select style={inputStyle(errors.type)} value={form.type} onChange={e => setAndCheck('type', e.target.value)}>
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
            <select style={inputStyle(errors.locality)} value={form.locality} onChange={e => setAndCheck('locality', e.target.value)}>
              <option value="">Select Locality</option>
              {MALTA_LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Full Address">
            <textarea style={{ ...inputStyle(), resize: 'vertical' }} value={form.address} onChange={e => setAndCheck('address', e.target.value)} rows={2} />
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
                      {form.features.includes(feat) ? '✓ ' : ''}{formatFeatureLabel(feat)}
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
            <FormField label="Property Video (MP4)">
              <FileUpload
                accept="video/mp4,video/quicktime"
                multiple={false}
                value={form.videoUrl ? [form.videoUrl] : []}
                onChange={(urls) => set('videoUrl', urls[0] || '')}
                label="Upload Property Video (MP4/MOV · max 100 MB)"
              />
            </FormField>
          </Row>
          <Row>
            <FormField label="Drone Video (MP4)">
              <FileUpload
                accept="video/mp4,video/quicktime"
                multiple={false}
                value={form.droneVideoUrl ? [form.droneVideoUrl] : []}
                onChange={(urls) => set('droneVideoUrl', urls[0] || '')}
                label="Upload Drone Video (MP4/MOV · max 100 MB)"
              />
            </FormField>
            <FormField label="3D View">
              <FileUpload
                accept="image/jpeg,image/png,image/webp,video/mp4"
                multiple={false}
                value={form.threeDViewUrl && form.threeDViewUrl.startsWith('/uploads/') ? [form.threeDViewUrl] : []}
                onChange={(urls) => set('threeDViewUrl', urls[0] || '')}
                label="Upload 3D View file"
              />
              <input
                style={{ ...inputStyle(), marginTop: 'var(--space-2)' }}
                value={form.threeDViewUrl && !form.threeDViewUrl.startsWith('/uploads/') ? form.threeDViewUrl : ''}
                onChange={e => set('threeDViewUrl', e.target.value)}
                placeholder="Or paste 3D tour URL…"
              />
            </FormField>
          </Row>
          <FormField label="Drone Images">
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              multiple={true}
              value={form.droneImages || []}
              onChange={(urls) => set('droneImages', urls)}
              label="Upload Drone Images (JPG, PNG, WebP · max 10 MB each)"
            />
          </FormField>
        </Section>

        {/* Assignment */}
        <Section title="Assignment" style={{ position: 'relative', zIndex: 10 }}>
          <FormField label="Owner *" error={errors.ownerId}>
            <SearchableSelect
              options={owners.map(o => ({
                value: o.id,
                label: [o.firstName, o.lastName, o.phone ? `— ${o.phone}` : '', o.referenceNumber ? `(${o.referenceNumber})` : ''].filter(Boolean).join(' '),
                searchText: [o.firstName, o.lastName, o.phone, o.alternatePhone, o.email, o.referenceNumber, o.idNumber, o.companyName, o.nationality, o.address].filter(Boolean).join(' '),
              }))}
              value={form.ownerId}
              onChange={v => setAndCheck('ownerId', v)}
              placeholder="Search owner by name, phone, reference…"
            />
          </FormField>
          <Row>
            <FormField label="Agent">
              <SearchableSelect
                options={agents.map(a => ({
                  value: a.id,
                  label: [a.firstName, a.lastName, a.email ? `— ${a.email}` : ''].filter(Boolean).join(' '),
                  searchText: [a.firstName, a.lastName, a.email, a.phone].filter(Boolean).join(' '),
                }))}
                value={form.agentId}
                onChange={v => set('agentId', v)}
                placeholder="Search agent…"
              />
            </FormField>
            <FormField label="Branch">
              <SearchableSelect
                options={branches.map(b => ({
                  value: b.id,
                  label: [b.name, b.email ? `— ${b.email}` : ''].filter(Boolean).join(' '),
                  searchText: [b.name, b.email, b.phone, b.address].filter(Boolean).join(' '),
                }))}
                value={form.branchId}
                onChange={v => set('branchId', v)}
                placeholder="Search branch…"
              />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
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

        {/* Pet Policy */}
        <PolicySection title="🐾 Pet Policy">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.petPolicy?.acceptsDogs} onChange={e => set('petPolicy', { ...form.petPolicy, acceptsDogs: e.target.checked })} /><span>Accept Dogs</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.petPolicy?.acceptsSmallDogs} onChange={e => set('petPolicy', { ...form.petPolicy, acceptsSmallDogs: e.target.checked })} /><span>Accept Small Dogs Only</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.petPolicy?.acceptsCats} onChange={e => set('petPolicy', { ...form.petPolicy, acceptsCats: e.target.checked })} /><span>Accept Cats</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.petPolicy?.acceptsBirds} onChange={e => set('petPolicy', { ...form.petPolicy, acceptsBirds: e.target.checked })} /><span>Accept Birds</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.petPolicy?.acceptsFish} onChange={e => set('petPolicy', { ...form.petPolicy, acceptsFish: e.target.checked })} /><span>Accept Fish/Aquarium</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.petPolicy?.petDeposit} onChange={e => set('petPolicy', { ...form.petPolicy, petDeposit: e.target.checked })} /><span>Pet Deposit Required</span></label>
          </div>
          <Row>
            <FormField label="Max Pets Allowed">
              <input type="number" min="1" max="5" style={inputStyle()} value={form.petPolicy?.maxPets ?? ''} onChange={e => set('petPolicy', { ...form.petPolicy, maxPets: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined })} placeholder="1–5" />
            </FormField>
            <FormField label="Pet Restrictions / Notes">
              <input style={inputStyle()} value={form.petPolicy?.petRestrictions || ''} onChange={e => set('petPolicy', { ...form.petPolicy, petRestrictions: e.target.value })} placeholder="e.g. Max 10kg, no aggressive breeds" />
            </FormField>
          </Row>
        </PolicySection>

        {/* Tenant Preferences */}
        <PolicySection title="👥 Tenant Preferences">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsFamilies} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsFamilies: e.target.checked })} /><span>Accept Families</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsCouples} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsCouples: e.target.checked })} /><span>Accept Couples</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsSingles} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsSingles: e.target.checked })} /><span>Accept Singles</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsStudents} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsStudents: e.target.checked })} /><span>Accept Students</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsSharers} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsSharers: e.target.checked })} /><span>Accept Sharers</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsRetirees} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsRetirees: e.target.checked })} /><span>Accept Retirees</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsChildren} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsChildren: e.target.checked })} /><span>Accept Children</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.tenantPolicy?.acceptsNewborns} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, acceptsNewborns: e.target.checked })} /><span>Accept Newborns</span></label>
          </div>
          <Row>
            <FormField label="Max Occupants">
              <input type="number" min="1" style={inputStyle()} value={form.tenantPolicy?.maxOccupants ?? ''} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, maxOccupants: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined })} placeholder="Any" />
            </FormField>
            <FormField label="Min Age">
              <input type="number" min="18" style={inputStyle()} value={form.tenantPolicy?.minAge ?? ''} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, minAge: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined })} placeholder="Any" />
            </FormField>
            <FormField label="Max Age">
              <input type="number" min="18" style={inputStyle()} value={form.tenantPolicy?.maxAge ?? ''} onChange={e => set('tenantPolicy', { ...form.tenantPolicy, maxAge: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined })} placeholder="Any" />
            </FormField>
          </Row>
        </PolicySection>

        {/* Nationality Preferences */}
        <PolicySection title="🌍 Nationality Preferences">
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={toggleLabelStyle}>
              <input type="checkbox" checked={!!form.nationalityPolicy?.acceptsAll} onChange={e => set('nationalityPolicy', { ...form.nationalityPolicy, acceptsAll: e.target.checked })} />
              <span>Accept Any Nationality</span>
            </label>
          </div>
          {!form.nationalityPolicy?.acceptsAll && (
            <>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>Accepted Regions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {[
                  { value: 'european', label: 'European' },
                  { value: 'asian', label: 'Asian' },
                  { value: 'south_american', label: 'South American' },
                  { value: 'north_american', label: 'North American' },
                  { value: 'african', label: 'African' },
                  { value: 'middle_eastern', label: 'Middle Eastern' },
                  { value: 'oceanian', label: 'Oceanian' },
                ].map(({ value, label }) => {
                  const regions = form.nationalityPolicy?.acceptedRegions || [];
                  const checked = regions.includes(value);
                  return (
                    <label key={value} style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          const next = e.target.checked ? [...regions, value] : regions.filter(r => r !== value);
                          set('nationalityPolicy', { ...form.nationalityPolicy, acceptedRegions: next });
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
          <FormField label="Nationality Notes">
            <input style={inputStyle()} value={form.nationalityPolicy?.notes || ''} onChange={e => set('nationalityPolicy', { ...form.nationalityPolicy, notes: e.target.value })} placeholder="Additional nationality preferences or notes…" />
          </FormField>
        </PolicySection>

        {/* Contract Terms */}
        <PolicySection title="📋 Contract Terms">
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.contractTerms?.acceptsTnCs} onChange={e => set('contractTerms', { ...form.contractTerms, acceptsTnCs: e.target.checked })} /><span>Accept T&amp;Cs</span></label>
          </div>
          <Row>
            <FormField label="Minimum Term">
              <select style={inputStyle()} value={form.contractTerms?.minimumTerm || ''} onChange={e => set('contractTerms', { ...form.contractTerms, minimumTerm: e.target.value })}>
                <option value="">— Select —</option>
                <option value="monthly">Monthly</option>
                <option value="3_months">3 Months</option>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
                <option value="2_years">2 Years</option>
                <option value="3_years">3 Years</option>
              </select>
            </FormField>
            <FormField label="Maximum Term">
              <select style={inputStyle()} value={form.contractTerms?.maximumTerm || ''} onChange={e => set('contractTerms', { ...form.contractTerms, maximumTerm: e.target.value })}>
                <option value="">— Select —</option>
                <option value="1_year">1 Year</option>
                <option value="2_years">2 Years</option>
                <option value="3_years">3 Years</option>
                <option value="5_years">5 Years</option>
                <option value="indefinite">Indefinite</option>
              </select>
            </FormField>
          </Row>
          <Row>
            <FormField label="Deposit (months)">
              <input type="number" min="0" style={inputStyle()} value={form.contractTerms?.depositMonths ?? ''} onChange={e => set('contractTerms', { ...form.contractTerms, depositMonths: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined })} placeholder="e.g. 2" />
            </FormField>
            <FormField label="Advance Payment (months)">
              <input type="number" min="0" style={inputStyle()} value={form.contractTerms?.advanceMonths ?? ''} onChange={e => set('contractTerms', { ...form.contractTerms, advanceMonths: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined })} placeholder="e.g. 1" />
            </FormField>
            <FormField label="Agency Fee">
              <input style={inputStyle()} value={form.contractTerms?.agencyFee || ''} onChange={e => set('contractTerms', { ...form.contractTerms, agencyFee: e.target.value })} placeholder="e.g. One month's rent" />
            </FormField>
          </Row>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.contractTerms?.breakClause} onChange={e => set('contractTerms', { ...form.contractTerms, breakClause: e.target.checked })} /><span>Break Clause</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.contractTerms?.guarantorRequired} onChange={e => set('contractTerms', { ...form.contractTerms, guarantorRequired: e.target.checked })} /><span>Guarantor Required</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.contractTerms?.proofOfIncomeRequired} onChange={e => set('contractTerms', { ...form.contractTerms, proofOfIncomeRequired: e.target.checked })} /><span>Proof of Income Required</span></label>
            <label style={toggleLabelStyle}><input type="checkbox" checked={!!form.contractTerms?.employmentLetterRequired} onChange={e => set('contractTerms', { ...form.contractTerms, employmentLetterRequired: e.target.checked })} /><span>Employment Letter Required</span></label>
          </div>
        </PolicySection>

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
const Section = ({ title, children, style: extraStyle }) => (
  <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', ...extraStyle }}>
    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>{title}</h3>
    {children}
  </div>
);

const PolicySection = ({ title, children }) => {
  const [collapsed, setCollapsed] = React.useState(true);
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid var(--color-border)' }}
      >
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{collapsed ? '▼ Expand' : '▲ Collapse'}</span>
      </div>
      {!collapsed && <div style={{ padding: 'var(--space-5)' }}>{children}</div>}
    </div>
  );
};

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

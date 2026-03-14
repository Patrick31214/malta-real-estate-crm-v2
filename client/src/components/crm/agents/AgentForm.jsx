import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import FileUpload from '../../ui/FileUpload';
import { AGENT_PERMISSION_CATEGORIES, ALL_PERMISSION_KEYS } from '../../../constants/agentPermissions';

/* ── tiny sub-components ─────────────────────────────────────────────────── */

const SPECIALIZATIONS = [
  'Residential Sales', 'Commercial Sales', 'Luxury Sales', 'Off-Plan Sales',
  'New Developments', 'Investment Properties', 'Holiday/Short-Let Rentals',
  'Long-Term Rentals', 'Land & Development', 'Student Accommodation',
  'Relocation Services', 'Property Management', 'Farmhouses & Rural',
  'Heritage & Palazzi', 'Seafront Properties', 'Buy-to-Let',
  'First-Time Buyers', 'Expat Services', 'Corporate Lettings',
  'Auction Properties', 'Repossessions', 'Penthouses', 'Villas',
  'Townhouses', 'Maisonettes', 'Garages & Parking', 'Offices',
  'Retail Spaces', 'Warehouses', 'Hotels & Hospitality',
  'Mixed-Use Properties', 'Green/Eco Properties', 'Renovation Projects',
  'Plot Sales', 'Agricultural Land',
];
const LANGUAGES = [
  'Afar', 'Afrikaans', 'Akan', 'Albanian', 'Amharic', 'Arabic', 'Aragonese', 'Armenian', 'Assamese',
  'Avaric', 'Avestan', 'Aymara', 'Azerbaijani', 'Bambara', 'Bashkir', 'Basque', 'Belarusian',
  'Bengali', 'Bihari', 'Bislama', 'Bhojpuri', 'Bosnian', 'Breton', 'Bulgarian', 'Burmese',
  'Catalan', 'Cebuano', 'Chamorro', 'Chechen', 'Chichewa', 'Chinese', 'Chuvash', 'Cornish',
  'Corsican', 'Cree', 'Croatian', 'Czech', 'Danish', 'Dhivehi', 'Dutch', 'Dzongkha',
  'English', 'Esperanto', 'Estonian', 'Ewe', 'Faroese', 'Fijian', 'Finnish', 'French',
  'Frisian', 'Fula', 'Ga', 'Galician', 'Georgian', 'German', 'Greek', 'Guarani',
  'Gujarati', 'Haitian Creole', 'Hausa', 'Hebrew', 'Herero', 'Hindi', 'Hiri Motu', 'Hmong',
  'Hungarian', 'Interlingua', 'Indonesian', 'Igbo', 'Ido', 'Icelandic', 'Inuktitut', 'Inupiaq',
  'Irish', 'Italian', 'Japanese', 'Javanese', 'Kalaallisut', 'Kannada', 'Kashmiri', 'Kazakh',
  'Khmer', 'Kikuyu', 'Kinyarwanda', 'Kirundi', 'Komi', 'Kongo', 'Korean', 'Konkani',
  'Kurdish', 'Kwanyama', 'Kyrgyz', 'Lao', 'Latin', 'Latvian', 'Lingala', 'Lithuanian',
  'Luba-Katanga', 'Luganda', 'Luxembourgish', 'Macedonian', 'Maithili', 'Malagasy', 'Malay', 'Malayalam',
  'Maltese', 'Manipuri', 'Manx', 'Maori', 'Marathi', 'Marshallese', 'Meitei', 'Mongolian',
  'Nauru', 'Navajo', 'Ndebele', 'Ndonga', 'Nepali', 'Newari', 'Northern Sami', 'Norwegian',
  'Nuosu', 'Occitan', 'Odia', 'Ojibwe', 'Old Church Slavonic', 'Oromo', 'Ossetian',
  'Pampanga', 'Pashto', 'Papiamento', 'Persian', 'Polish', 'Portuguese', 'Punjabi',
  'Quechua', 'Romanian', 'Romani', 'Rundi', 'Russian', 'Rusyn', 'Samoan', 'Sango',
  'Sanskrit', 'Santali', 'Sardinian', 'Scottish Gaelic', 'Scots', 'Serbian', 'Sepedi',
  'Sesotho', 'Setswana', 'Shan', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian',
  'Somali', 'Sorbian', 'Southern Ndebele', 'Spanish', 'Sundanese', 'Swahili', 'Swati',
  'Swedish', 'Tagalog', 'Tahitian', 'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai',
  'Tibetan', 'Tigrinya', 'Tok Pisin', 'Tonga', 'Tsonga', 'Tswana', 'Turkish', 'Turkmen',
  'Twi', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek', 'Venda', 'Vietnamese', 'Volapük',
  'Walloon', 'Welsh', 'Waray', 'Wolof', 'Xhosa', 'Yiddish', 'Yoruba', 'Zarma', 'Zhuang', 'Zulu',
].sort();

function SearchableMultiSelect({ options, value = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  const toggle = (o) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 38, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', cursor: 'pointer', alignItems: 'center' }}>
        {value.length ? value.map(v => <span key={v} style={{ background: 'var(--color-accent-gold)', color: '#000', borderRadius: 4, padding: '1px 6px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{v} <span onClick={e => { e.stopPropagation(); toggle(v); }}>×</span></span>) : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{placeholder}</span>}
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 10 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--color-surface, #1a1a2e)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ padding: '8px', border: 'none', borderBottom: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(o => (
              <div key={o} onClick={() => toggle(o)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', background: value.includes(o) ? 'rgba(255,193,7,0.1)' : 'transparent' }}>
                <span style={{ width: 14, height: 14, border: '1px solid var(--color-border)', borderRadius: 2, background: value.includes(o) ? 'var(--color-accent-gold)' : 'transparent', display: 'inline-block', flexShrink: 0 }} />
                {o}
              </div>
            ))}
          </div>
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

function SearchableSingleSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = options.filter(o => o.value.toLowerCase().includes(q.toLowerCase()) || o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ minHeight: 38, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
        <span style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{selected?.label ?? placeholder}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--color-surface, #1a1a2e)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ padding: '8px', border: 'none', borderBottom: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {placeholder && <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{placeholder}</div>}
            {filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)', background: value === o.value ? 'rgba(255,193,7,0.1)' : 'transparent' }}>{o.label}</div>
            ))}
          </div>
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const colors = ['', 'var(--color-error, #dc3545)', 'var(--color-error, #dc3545)', 'var(--color-accent-gold)', 'var(--color-accent-gold)', 'var(--color-success, #28a745)'];
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : 'var(--color-border)' }} />)}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: colors[score] }}>{labels[score]}</div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

const inputStyle = { width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' };

const ROLE_OPTIONS = [
  { value: 'admin',   label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'agent',   label: 'Agent' },
  { value: 'Senior Agent', label: 'Senior Agent' },
  { value: 'Junior Agent', label: 'Junior Agent' },
  { value: 'Trainee / Intern', label: 'Trainee / Intern' },
  { value: 'Employee', label: 'Employee' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Associate', label: 'Associate' },
  { value: 'Contractor', label: 'Contractor' },
  { value: 'Freelancer', label: 'Freelancer' },
  { value: 'Temp Worker', label: 'Temp Worker' },
  { value: 'Seasonal Worker', label: 'Seasonal Worker' },
  { value: 'Property Manager', label: 'Property Manager' },
  { value: 'Letting Agent', label: 'Letting Agent' },
  { value: 'Sales Agent', label: 'Sales Agent' },
  { value: 'Rental Agent', label: 'Rental Agent' },
  { value: 'Property Coordinator', label: 'Property Coordinator' },
  { value: 'Tenancy Manager', label: 'Tenancy Manager' },
  { value: 'Office Manager', label: 'Office Manager' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'Marketing Manager', label: 'Marketing Manager' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Admin Assistant', label: 'Admin Assistant' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'Data Entry Clerk', label: 'Data Entry Clerk' },
  { value: 'Legal Advisor', label: 'Legal Advisor' },
  { value: 'Compliance Officer', label: 'Compliance Officer' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Financial Advisor', label: 'Financial Advisor' },
  { value: 'Notary', label: 'Notary' },
  { value: 'Auditor', label: 'Auditor' },
  { value: 'Tax Consultant', label: 'Tax Consultant' },
  { value: 'Owner / Director', label: 'Owner / Director' },
  { value: 'Co-Owner', label: 'Co-Owner' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Silent Partner', label: 'Silent Partner' },
  { value: 'Shareholder', label: 'Shareholder' },
  { value: 'Board Member', label: 'Board Member' },
  { value: 'Stakeholder', label: 'Stakeholder' },
  { value: 'Customer Service', label: 'Customer Service' },
  { value: 'Virtual Assistant', label: 'Virtual Assistant' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'Help Desk', label: 'Help Desk' },
  { value: 'Technical Support', label: 'Technical Support' },
  { value: 'Client Relations', label: 'Client Relations' },
  { value: 'Branch Manager', label: 'Branch Manager' },
  { value: 'Regional Manager', label: 'Regional Manager' },
  { value: 'Area Manager', label: 'Area Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Team Leader', label: 'Team Leader' },
  { value: 'Shift Supervisor', label: 'Shift Supervisor' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Maintenance Coordinator', label: 'Maintenance Coordinator' },
  { value: 'Property Inspector', label: 'Property Inspector' },
  { value: 'Valuer / Appraiser', label: 'Valuer / Appraiser' },
  { value: 'Surveyor', label: 'Surveyor' },
  { value: 'Architect', label: 'Architect' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'Interior Designer', label: 'Interior Designer' },
  { value: 'Cleaning Supervisor', label: 'Cleaning Supervisor' },
  { value: 'Security Officer', label: 'Security Officer' },
  { value: 'Concierge', label: 'Concierge' },
  { value: 'Doorman', label: 'Doorman' },
  { value: 'Handyman', label: 'Handyman' },
  { value: 'Gardener', label: 'Gardener' },
  { value: 'Pool Technician', label: 'Pool Technician' },
  { value: 'Electrician', label: 'Electrician' },
  { value: 'Plumber', label: 'Plumber' },
  { value: 'Photographer', label: 'Photographer' },
  { value: 'Videographer', label: 'Videographer' },
  { value: 'Content Creator', label: 'Content Creator' },
  { value: 'Social Media Manager', label: 'Social Media Manager' },
  { value: 'SEO Specialist', label: 'SEO Specialist' },
  { value: 'Graphic Designer', label: 'Graphic Designer' },
  { value: 'Copywriter', label: 'Copywriter' },
  { value: 'Mortgage Broker', label: 'Mortgage Broker' },
  { value: 'Insurance Agent', label: 'Insurance Agent' },
  { value: 'Revenue Manager', label: 'Revenue Manager' },
  { value: 'Collections Officer', label: 'Collections Officer' },
  { value: 'Payroll Specialist', label: 'Payroll Specialist' },
  { value: 'Bookkeeper', label: 'Bookkeeper' },
  { value: 'Tour Guide', label: 'Tour Guide' },
  { value: 'Concierge Manager', label: 'Concierge Manager' },
  { value: 'Event Coordinator', label: 'Event Coordinator' },
  { value: 'Travel Agent', label: 'Travel Agent' },
  { value: 'Relocation Specialist', label: 'Relocation Specialist' },
  { value: 'Immigration Advisor', label: 'Immigration Advisor' },
  { value: 'Lawyer', label: 'Lawyer' },
  { value: 'Paralegal', label: 'Paralegal' },
  { value: 'AML Officer', label: 'AML Officer' },
  { value: 'KYC Analyst', label: 'KYC Analyst' },
  { value: 'Regulatory Advisor', label: 'Regulatory Advisor' },
  { value: 'Contract Manager', label: 'Contract Manager' },
  { value: 'Mediator', label: 'Mediator' },
  { value: 'External Valuator', label: 'External Valuator' },
  { value: 'External Auditor', label: 'External Auditor' },
  { value: 'Government Liaison', label: 'Government Liaison' },
  { value: 'Bank Representative', label: 'Bank Representative' },
  { value: 'Insurance Assessor', label: 'Insurance Assessor' },
  { value: 'Vendor', label: 'Vendor' },
];
const APPROVAL_OPTIONS = [
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

/**
 * Default permissions enabled for a brand-new agent.
 * Must match the server-side AGENT_DEFAULT_PERMISSIONS list in src/routes/agents.js.
 */
const NEW_AGENT_DEFAULT_PERMISSIONS = new Set([
  'dashboard_view',
  'properties_view',
  'clients_view',
  'owners_view',
  'contacts_view',
  'inquiries_view_own',
  'calendar_view',
  'chat_view',
  'chat_direct_message',
  'chat_group_channels',
  'notifications_view',
  'announcements_view',
  'documents_view',
  'services_view',
  'financial_own_commission',
]);

function buildInitialPermissions() {
  return ALL_PERMISSION_KEYS.reduce((acc, k) => { acc[k] = false; return acc; }, {});
}

function buildDefaultNewAgentPermissions() {
  return ALL_PERMISSION_KEYS.reduce((acc, k) => {
    acc[k] = NEW_AGENT_DEFAULT_PERMISSIONS.has(k);
    return acc;
  }, {});
}

export default function AgentForm({ initial, onSave, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  /* form fields */
  const [fields, setFields] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', role: 'agent', jobTitle: '',
    branchId: '', licenseNumber: '', commissionRate: '',
    bio: '', nationality: '', dateOfBirth: '', address: '',
    emergencyContact: '', emergencyPhone: '',
    startDate: '', eireLicenseExpiry: '',
    approvalStatus: 'pending',
    isActive: true,
    specializations: [], languages: [],
    profileImage: [], passportImage: [], idCardImage: [], contractFile: [],
    otherDocuments: [],
  });

  const [permissions, setPermissions] = useState(() =>
    isEdit ? buildInitialPermissions() : buildDefaultNewAgentPermissions()
  );
  const permissionsRef = useRef({});
  useEffect(() => { permissionsRef.current = permissions; }, [permissions]);

  /* load agent data on edit */
  useEffect(() => {
    if (!initial) return;
    setFields({
      firstName: initial.firstName ?? '',
      lastName: initial.lastName ?? '',
      email: initial.email ?? '',
      password: '',
      phone: initial.phone ?? '',
      role: initial.role ?? 'agent',
      jobTitle: initial.jobTitle ?? '',
      branchId: initial.branchId ? String(initial.branchId) : '',
      licenseNumber: initial.licenseNumber ?? '',
      commissionRate: initial.commissionRate != null ? String(initial.commissionRate) : '',
      bio: initial.bio ?? '',
      nationality: initial.nationality ?? '',
      dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.split('T')[0] : '',
      address: initial.address ?? '',
      emergencyContact: initial.emergencyContact ?? '',
      emergencyPhone: initial.emergencyPhone ?? '',
      startDate: initial.startDate ? initial.startDate.split('T')[0] : '',
      eireLicenseExpiry: initial.eireLicenseExpiry ? initial.eireLicenseExpiry.split('T')[0] : '',
      approvalStatus: initial.approvalStatus ?? 'pending',
      isActive: initial.isActive !== false,
      specializations: Array.isArray(initial.specializations) ? initial.specializations : [],
      languages: Array.isArray(initial.languages) ? initial.languages : [],
      profileImage: initial.profileImage ? [initial.profileImage] : [],
      passportImage: initial.passportImage ? [initial.passportImage] : [],
      idCardImage: initial.idCardImage ? [initial.idCardImage] : [],
      contractFile: initial.contractFile ? [initial.contractFile] : [],
      otherDocuments: Array.isArray(initial.otherDocuments) ? initial.otherDocuments : (initial.otherDocuments ? [initial.otherDocuments] : []),
    });

    /* build permissions from UserPermissions */
    const base = buildInitialPermissions();
    if (Array.isArray(initial.UserPermissions)) {
      initial.UserPermissions.forEach(p => { base[p.feature] = Boolean(p.isEnabled); });
    }
    setPermissions(base);
  }, [initial]);

  /* load branches */
  useEffect(() => {
    api.get('/branches').then(({ data }) => {
      const list = Array.isArray(data) ? data : data.branches ?? [];
      setBranches(list.map(b => ({ value: String(b.id), label: `${b.name}${b.city ? ` – ${b.city}` : ''}` })));
    }).catch(err => {
      showError(err.response?.data?.error || err.message || 'Failed to load branches');
    });
  }, [showError]);

  const set = (key, val) => setFields(f => ({ ...f, [key]: val }));

  /* ── permission handlers ─────────────────────────────────────────────── */

  const togglePermission = useCallback(async (key, val) => {
    setPermissions(p => ({ ...p, [key]: val }));
    if (isAdmin && isEdit && initial?.id) {
      try {
        await api.patch(`/agents/${initial.id}/permissions/${key}`, { isEnabled: val });
      } catch (err) {
        showError(err.response?.data?.error || err.message || `Failed to save permission: ${key}`);
        setPermissions(p => ({ ...p, [key]: !val }));
      }
    }
  }, [isAdmin, isEdit, initial?.id, showError]);

  const bulkPermissions = useCallback(async (nextPerms) => {
    const prev = { ...permissionsRef.current };
    setPermissions(nextPerms);
    if (isAdmin && isEdit && initial?.id) {
      try {
        await api.put(`/agents/${initial.id}/permissions`, { permissions: nextPerms });
      } catch (err) {
        showError(err.response?.data?.error || err.message || 'Failed to save permissions');
        setPermissions(prev);
      }
    }
  }, [isAdmin, isEdit, initial?.id, showError]);

  const selectAllPermissions = useCallback(() => {
    const next = ALL_PERMISSION_KEYS.reduce((acc, k) => { acc[k] = true; return acc; }, {});
    bulkPermissions(next);
  }, [bulkPermissions]);

  const deselectAllPermissions = useCallback(() => {
    const next = ALL_PERMISSION_KEYS.reduce((acc, k) => { acc[k] = false; return acc; }, {});
    bulkPermissions(next);
  }, [bulkPermissions]);

  const selectAllCategory = useCallback((cat) => {
    setPermissions(prev => {
      const next = { ...prev };
      cat.permissions.forEach(p => { next[p.key] = true; });
      if (isAdmin && isEdit && initial?.id) {
        api.put(`/agents/${initial.id}/permissions`, { permissions: next }).catch(err => {
          showError(err.response?.data?.error || err.message || 'Failed to save permissions');
          setPermissions(prev);
        });
      }
      return next;
    });
  }, [isAdmin, isEdit, initial?.id, showError]);

  const deselectAllCategory = useCallback((cat) => {
    setPermissions(prev => {
      const next = { ...prev };
      cat.permissions.forEach(p => { next[p.key] = false; });
      if (isAdmin && isEdit && initial?.id) {
        api.put(`/agents/${initial.id}/permissions`, { permissions: next }).catch(err => {
          showError(err.response?.data?.error || err.message || 'Failed to save permissions');
          setPermissions(prev);
        });
      }
      return next;
    });
  }, [isAdmin, isEdit, initial?.id, showError]);

  /* ── submit ──────────────────────────────────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.firstName.trim()) return showError('First name is required');
    if (!fields.lastName.trim()) return showError('Last name is required');
    if (!fields.email.trim()) return showError('Email is required');
    if (!isEdit && !fields.password.trim()) return showError('Password is required');

    let commissionRate = null;
    if (fields.commissionRate !== '') {
      const parsed = parseFloat(fields.commissionRate);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) return showError('Commission rate must be a number between 0 and 100');
      commissionRate = parsed;
    }

    const payload = {
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone || null,
      role: fields.role,
      jobTitle: fields.jobTitle || null,
      branchId: fields.branchId || null,
      licenseNumber: fields.licenseNumber || null,
      commissionRate,
      bio: fields.bio || null,
      nationality: fields.nationality || null,
      dateOfBirth: fields.dateOfBirth || null,
      address: fields.address || null,
      emergencyContact: fields.emergencyContact || null,
      emergencyPhone: fields.emergencyPhone || null,
      startDate: fields.startDate || null,
      eireLicenseExpiry: fields.eireLicenseExpiry || null,
      approvalStatus: fields.approvalStatus,
      isActive: fields.isActive,
      specializations: fields.specializations,
      languages: fields.languages,
      profileImage: fields.profileImage[0] ?? null,
      passportImage: fields.passportImage[0] ?? null,
      idCardImage: fields.idCardImage[0] ?? null,
      contractFile: fields.contractFile[0] ?? null,
      otherDocuments: fields.otherDocuments.length > 0 ? fields.otherDocuments : null,
    };

    if (!isEdit) {
      payload.password = fields.password;
      if (isAdmin) payload.permissions = permissions;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/agents/${initial.id}`, payload);
      } else {
        await api.post('/agents', payload);
      }
      showSuccess(isEdit ? 'Agent updated' : 'Agent created');
      onSave?.();
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  /* ── inline modals ───────────────────────────────────────────────────── */

  const doResetPw = async () => {
    if (!newPassword.trim()) return showError('Enter a new password');
    try {
      await api.patch(`/agents/${initial.id}/reset-password`, { newPassword });
      setPwModalOpen(false);
      setNewPassword('');
      showSuccess('Password reset successfully');
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed'); }
  };

  const doChangeEmail = async () => {
    if (!newEmail.trim()) return showError('Enter a new email');
    try {
      await api.patch(`/agents/${initial.id}/email`, { newEmail });
      set('email', newEmail);
      setEmailModalOpen(false);
      setNewEmail('');
      showSuccess('Email updated');
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed'); }
  };

  const btnPrimary = { padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)' };
  const btnSecondary = { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' };

  const SectionHeader = ({ title }) => (
    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>{title}</h3>
  );

  const enabledCount = ALL_PERMISSION_KEYS.filter(k => permissions[k]).length;

  const Modal = ({ title, onClose: closeModal, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{isEdit ? 'Edit Agent' : 'Add New Agent'}</h2>
        <button type="button" onClick={onCancel} style={btnSecondary}>✕ Cancel</button>
      </div>

      {/* ── Section 1: Personal ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Personal Information" />
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Profile Photo</label>
          <FileUpload accept="image/jpeg,image/png,image/webp" multiple={false} value={fields.profileImage} onChange={v => set('profileImage', v)} label="Upload Profile Photo" />
        </div>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input style={inputStyle} value={fields.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" required />
          </div>
          <div>
            <label style={labelStyle}>Last Name *</label>
            <input style={inputStyle} value={fields.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" required />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={fields.phone} onChange={e => set('phone', e.target.value)} placeholder="+356 xxxx xxxx" />
          </div>
          <div>
            <label style={labelStyle}>Nationality</label>
            <input style={inputStyle} value={fields.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Nationality" />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input type="date" style={inputStyle} value={fields.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={fields.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label style={labelStyle}>Emergency Contact</label>
            <input style={inputStyle} value={fields.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Name" />
          </div>
          <div>
            <label style={labelStyle}>Emergency Phone</label>
            <input style={inputStyle} value={fields.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="+356 xxxx xxxx" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Professional ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Professional Details" />
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Role *</label>
            <SearchableSingleSelect options={ROLE_OPTIONS} value={fields.role} onChange={v => set('role', v)} placeholder="Select role" />
          </div>
          <div>
            <label style={labelStyle}>Job Title</label>
            <input style={inputStyle} value={fields.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="e.g. Senior Property Consultant" />
          </div>
          <div>
            <label style={labelStyle}>Branch</label>
            <SearchableSingleSelect options={branches} value={fields.branchId} onChange={v => set('branchId', v)} placeholder="Select branch" />
          </div>
          <div>
            <label style={labelStyle}>License Number</label>
            <input style={inputStyle} value={fields.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="License #" />
          </div>
          <div>
            <label style={labelStyle}>Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" style={inputStyle} value={fields.commissionRate} onChange={e => set('commissionRate', e.target.value)} placeholder="e.g. 2.5" />
          </div>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" style={inputStyle} value={fields.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>EIRE License Expiry</label>
            <input type="date" style={inputStyle} value={fields.eireLicenseExpiry} onChange={e => set('eireLicenseExpiry', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Specializations</label>
            <SearchableMultiSelect options={SPECIALIZATIONS} value={fields.specializations} onChange={v => set('specializations', v)} placeholder="Select specializations…" />
          </div>
          <div>
            <label style={labelStyle}>Languages</label>
            <SearchableMultiSelect options={LANGUAGES} value={fields.languages} onChange={v => set('languages', v)} placeholder="Select languages…" />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <label style={labelStyle}>Bio</label>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4} value={fields.bio} onChange={e => set('bio', e.target.value)} placeholder="Brief agent biography…" />
        </div>
      </div>

      {/* ── Section 3: Documents ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Documents" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Passport Image</label>
            <FileUpload accept="image/jpeg,image/png,application/pdf" multiple={false} value={fields.passportImage} onChange={v => set('passportImage', v)} label="Upload Passport" />
          </div>
          <div>
            <label style={labelStyle}>ID Card Image</label>
            <FileUpload accept="image/jpeg,image/png,application/pdf" multiple={false} value={fields.idCardImage} onChange={v => set('idCardImage', v)} label="Upload ID Card" />
          </div>
          <div>
            <label style={labelStyle}>Employment Contract</label>
            <FileUpload accept="application/pdf,image/jpeg,image/png" multiple={false} value={fields.contractFile} onChange={v => set('contractFile', v)} label="Upload Contract" />
          </div>
          <div>
            <label style={labelStyle}>Other Documents</label>
            <FileUpload accept="application/pdf,image/jpeg,image/png" multiple value={fields.otherDocuments} onChange={v => set('otherDocuments', v)} label="Upload Other Documents" />
          </div>
        </div>
      </div>

      {/* ── Section 4: Credentials ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Login Credentials" />
        {!isEdit ? (
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" style={inputStyle} value={fields.email} onChange={e => set('email', e.target.value)} placeholder="agent@example.com" required />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input type="password" style={inputStyle} value={fields.password} onChange={e => set('password', e.target.value)} placeholder="Create password" required />
              <PasswordStrength password={fields.password} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Email: <strong style={{ color: 'var(--color-text-primary)' }}>{fields.email}</strong></span>
            <button type="button" onClick={() => setPwModalOpen(true)} style={btnSecondary}>🔑 Reset Password</button>
            <button type="button" onClick={() => setEmailModalOpen(true)} style={btnSecondary}>✉️ Change Email</button>
          </div>
        )}
      </div>

      {/* ── Section 5: Permissions ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            Feature Permissions <span style={{ color: 'var(--color-accent-gold)' }}>({enabledCount}/{ALL_PERMISSION_KEYS.length} enabled)</span>
          </h3>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="button" onClick={selectAllPermissions} style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '4px 10px' }}>Select All</button>
              <button type="button" onClick={deselectAllPermissions} style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '4px 10px' }}>Deselect All</button>
            </div>
          )}
        </div>
        {isAdmin && isEdit && <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Permissions are saved immediately when toggled.</p>}
        {!isAdmin && <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Only administrators can modify feature permissions.</p>}
        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {AGENT_PERMISSION_CATEGORIES.map(cat => {
            const catEnabled = cat.permissions.filter(p => permissions[p.key]).length;
            const allOn = catEnabled === cat.permissions.length;
            return (
              <div key={cat.id} className="glass" style={{ borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{cat.icon} {cat.label} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({catEnabled}/{cat.permissions.length})</span></span>
                  {isAdmin && (
                    <button type="button" onClick={() => allOn ? deselectAllCategory(cat) : selectAllCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>
                      {allOn ? 'None' : 'All'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cat.permissions.map(p => (
                    isAdmin ? (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
                        <input
                          type="checkbox"
                          checked={!!permissions[p.key]}
                          onChange={e => togglePermission(p.key, e.target.checked)}
                          style={{ width: 14, height: 14, accentColor: 'var(--color-accent-gold)', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ color: permissions[p.key] ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{p.label}</span>
                      </label>
                    ) : (
                      <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{p.label}</span>
                        <span style={{ fontWeight: 700, color: permissions[p.key] ? 'var(--color-success, #28a745)' : 'var(--color-text-muted)' }}>{permissions[p.key] ? '✓' : '✗'}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 6: Account Status (edit only) ── */}
      {isEdit && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SectionHeader title="Account Status" />
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Approval Status</label>
              <SearchableSingleSelect options={APPROVAL_OPTIONS} value={fields.approvalStatus} onChange={v => set('approvalStatus', v)} placeholder="Select status" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                <input type="checkbox" checked={fields.isActive} onChange={e => set('isActive', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-accent-gold)' }} />
                Active Account
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Agent')}</button>
      </div>

      {/* ── Reset Password Modal ── */}
      {pwModalOpen && (
        <Modal title="Reset Password" onClose={() => { setPwModalOpen(false); setNewPassword(''); }}>
          <label style={labelStyle}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Enter new password" />
          <PasswordStrength password={newPassword} />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setPwModalOpen(false); setNewPassword(''); }} style={btnSecondary}>Cancel</button>
            <button type="button" onClick={doResetPw} style={btnPrimary}>Reset Password</button>
          </div>
        </Modal>
      )}

      {/* ── Change Email Modal ── */}
      {emailModalOpen && (
        <Modal title="Change Email" onClose={() => { setEmailModalOpen(false); setNewEmail(''); }}>
          <label style={labelStyle}>New Email</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} placeholder="Enter new email" />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setEmailModalOpen(false); setNewEmail(''); }} style={btnSecondary}>Cancel</button>
            <button type="button" onClick={doChangeEmail} style={btnPrimary}>Change Email</button>
          </div>
        </Modal>
      )}
    </form>
  );
}

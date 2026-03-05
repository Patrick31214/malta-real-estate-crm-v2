import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import ContactTable from '../../components/crm/contacts/ContactTable';
import ContactForm from '../../components/crm/contacts/ContactForm';
import ContactDetail from '../../components/crm/contacts/ContactDetail';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';

const EMPTY_FILTERS = { search: '', category: '', isActive: '' };

const CATEGORIES = [
  { value: 'legal',       label: 'Legal' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'emergency',   label: 'Emergency' },
  { value: 'staff',       label: 'Staff' },
  { value: 'branch',      label: 'Branch' },
  { value: 'other',       label: 'Other' },
];

const CrmContactsPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { showError } = useToast();
  const canCreate = ['admin', 'manager'].includes(role);
  const canEdit   = ['admin', 'manager'].includes(role);
  const canDelete = role === 'admin';

  const [contacts, setContacts]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('list');
  const [selected, setSelected]     = useState(null);

  // Scroll to top when opening detail or form views
  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
      const response = await api.get('/contacts', { params });
      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load contacts';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchContacts(1);
  }, [fetchContacts]);

  const handleView = async (contact) => {
    try {
      const res = await api.get(`/contacts/${contact.id}`);
      setSelected(res.data);
      setMode('detail');
    } catch {
      setSelected(contact);
      setMode('detail');
    }
  };

  const handleEdit = (contact) => {
    setSelected(contact);
    setMode('form');
  };

  const handleSave = (savedContact) => {
    setContacts(prev => {
      const exists = prev.find(c => c.id === savedContact.id);
      const updated = exists ? prev.map(c => c.id === savedContact.id ? savedContact : c) : [savedContact, ...prev];
      setPagination(p => ({ ...p, total: exists ? p.total : p.total + 1 }));
      return updated;
    });
    setMode('list');
    setSelected(null);
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Delete "${contact.firstName} ${contact.lastName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/contacts/${contact.id}`);
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete contact');
    }
  };

  const handleToggleActive = async (contact) => {
    try {
      const res = await api.patch(`/contacts/${contact.id}/toggle-active`);
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, isActive: res.data.isActive } : c));
      if (selected?.id === contact.id) setSelected(s => ({ ...s, isActive: res.data.isActive }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleClearFilters = () => setFilters(EMPTY_FILTERS);

  const closeModal = () => { setMode('list'); setSelected(null); };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            Contacts
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${pagination.total} contact${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setSelected(null); setMode('form'); }}
            style={{
              padding: 'var(--space-3) var(--space-5)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-accent-gold)',
              background: 'var(--color-accent-gold)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              boxShadow: 'var(--shadow-gold-sm)',
              whiteSpace: 'nowrap',
            }}
          >
            + Add Contact
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={filterLabel}>Search</label>
          <input
            style={filterInput}
            placeholder="Name, email, phone, company…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div style={{ flex: '0 1 160px' }}>
          <label style={filterLabel}>Category</label>
          <select style={filterInput} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 140px' }}>
          <label style={filterLabel}>Status</label>
          <select style={filterInput} value={filters.isActive} onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button onClick={handleClearFilters} style={clearBtn}>Clear</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass" style={{ height: '52px', borderRadius: 'var(--radius-sm)', opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && contacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>👥</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No contacts found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your filters or add a new contact.</p>
        </div>
      )}

      {/* Table */}
      {!loading && contacts.length > 0 && (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <ContactTable
            contacts={contacts}
            onView={handleView}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchContacts(p)}
        limit={pagination.limit}
      />
      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="700px">
        <ContactForm
          initial={selected}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </GlassModal>
      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="750px">
        <ContactDetail
          contact={selected}
          onEdit={(c) => { setMode('form'); setSelected(c); }}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          onClose={closeModal}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </GlassModal>
    </div>
  );
};

const filterLabel = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-1)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
};

const filterInput = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  width: '100%',
  outline: 'none',
};

const clearBtn = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  alignSelf: 'flex-end',
};

export default CrmContactsPage;

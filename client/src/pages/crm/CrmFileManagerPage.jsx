import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

const CATEGORIES = [
  { value: 'property',  label: 'Property',  icon: '🏠' },
  { value: 'client',    label: 'Client',    icon: '👤' },
  { value: 'legal',     label: 'Legal',     icon: '⚖️' },
  { value: 'financial', label: 'Financial', icon: '💰' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'internal',  label: 'Internal',  icon: '🏢' },
  { value: 'other',     label: 'Other',     icon: '📌' },
];

const CATEGORY_CONFIG = {
  property:  { bg: 'rgba(99,102,241,0.15)',  color: '#a78bfa', border: 'rgba(99,102,241,0.35)' },
  client:    { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8', border: 'rgba(14,165,233,0.35)' },
  legal:     { bg: 'rgba(239,68,68,0.14)',   color: '#f87171', border: 'rgba(239,68,68,0.35)'  },
  financial: { bg: 'rgba(234,179,8,0.14)',   color: '#fbbf24', border: 'rgba(234,179,8,0.35)'  },
  marketing: { bg: 'rgba(249,115,22,0.14)',  color: '#fb923c', border: 'rgba(249,115,22,0.35)' },
  internal:  { bg: 'rgba(168,85,247,0.14)',  color: '#c084fc', border: 'rgba(168,85,247,0.35)' },
  other:     { bg: 'rgba(107,114,128,0.14)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
};

const MIME_ICONS = {
  'image/jpeg': '🖼️', 'image/png': '🖼️', 'image/webp': '🖼️', 'image/gif': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📋',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📋',
  'text/plain': '📃', 'text/csv': '📊',
  'video/mp4': '🎬', 'video/quicktime': '🎬',
};

const EMPTY_FORM = { name: '', description: '', category: 'other', tags: '', propertyId: '', clientId: '' };
const EMPTY_FOLDER = { name: '', category: 'other' };

const lbl = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)',
};
const inp = (err) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
  border: `1px solid ${err ? '#f87171' : 'rgba(212,175,55,0.2)'}`,
  background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', width: '100%', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
});
const goldBtn = (disabled) => ({
  padding: 'var(--space-2) var(--space-5)', borderRadius: '8px',
  border: '1px solid var(--color-accent-gold)',
  background: disabled ? 'rgba(212,175,55,0.3)' : 'var(--color-accent-gold)',
  color: disabled ? 'rgba(255,255,255,0.5)' : '#0a0a0f',
  cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)', opacity: disabled ? 0.7 : 1, transition: 'all 0.2s',
});
const ghostBtn = {
  padding: 'var(--space-2) var(--space-4)', borderRadius: '8px',
  border: '1px solid rgba(212,175,55,0.25)', background: 'transparent',
  color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
  transition: 'all 0.2s',
};
const dangerBtn = {
  padding: 'var(--space-2) var(--space-4)', borderRadius: '8px',
  border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
  color: '#f87171', cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.2s',
};
const segBtn = (active) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
  border: `1px solid ${active ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.15)'}`,
  background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
  color: active ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
  cursor: 'pointer', fontSize: 'var(--text-sm)',
  fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)',
  transition: 'all 0.15s', whiteSpace: 'nowrap',
});

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MT', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const getMimeIcon = (mimeType) => MIME_ICONS[mimeType] || '📁';
const getCategoryConf = (cat) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;

function ActionBtn({ label, title, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 8px', borderRadius: '6px',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(212,175,55,0.2)'}`,
        background: 'transparent', cursor: 'pointer', fontSize: '0.75rem',
        color: danger ? '#f87171' : 'var(--color-text-secondary)', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  );
}

function FolderCard({ folder, onEnter, onEdit, onDelete, isAdmin }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: '12px', padding: 'var(--space-4)', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}
      onClick={() => onEnter(folder)}
    >
      <div style={{ fontSize: '2rem', textAlign: 'center' }}>📂</div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', textAlign: 'center', wordBreak: 'break-word' }}>{folder.name}</div>
      {folder.category && (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: '4px', background: getCategoryConf(folder.category).bg, color: getCategoryConf(folder.category).color }}>
            {folder.category}
          </span>
        </div>
      )}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center', marginTop: 'auto' }}
          onClick={(e) => e.stopPropagation()}>
          <ActionBtn label="✏️" title="Edit" onClick={() => onEdit(folder)} />
          <ActionBtn label="🗑️" title="Delete" onClick={() => onDelete(folder)} danger />
        </div>
      )}
    </div>
  );
}

function FileCard({ file, onDetail, onEdit, onDelete, onDownload, isAdmin }) {
  const conf = getCategoryConf(file.category);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)',
        borderRadius: '12px', padding: 'var(--space-4)', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}
      onClick={() => onDetail(file)}
    >
      <div style={{ fontSize: '2rem', textAlign: 'center' }}>{getMimeIcon(file.mimeType)}</div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3 }}>{file.name}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>{formatSize(file.size)}</div>
      {file.category && (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: '4px', background: conf.bg, color: conf.color }}>{file.category}</span>
        </div>
      )}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>{formatDate(file.createdAt)}</div>
      <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center', marginTop: 'auto' }}
        onClick={(e) => e.stopPropagation()}>
        <ActionBtn label="⬇️" title="Download" onClick={() => onDownload(file)} />
        {isAdmin && <>
          <ActionBtn label="✏️" title="Edit" onClick={() => onEdit(file)} />
          <ActionBtn label="🗑️" title="Delete" onClick={() => onDelete(file)} danger />
        </>}
      </div>
    </div>
  );
}

function GridView({ folders, files, isAdmin, onEnterFolder, onDetail, onEdit, onDelete, onDownload }) {
  if (folders.length === 0 && files.length === 0) return null;
  return (
    <div>
      {folders.length > 0 && (
        <>
          <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>Folders ({folders.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            {folders.map((f) => <FolderCard key={f.id} folder={f} isAdmin={isAdmin} onEnter={onEnterFolder} onEdit={onEdit} onDelete={onDelete} />)}
          </div>
        </>
      )}
      {files.length > 0 && (
        <>
          <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>Files ({files.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            {files.map((f) => <FileCard key={f.id} file={f} isAdmin={isAdmin} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} onDownload={onDownload} />)}
          </div>
        </>
      )}
    </div>
  );
}

function ListView({ folders, files, isAdmin, onEnterFolder, onDetail, onEdit, onDelete, onDownload }) {
  const all = [...folders.map((f) => ({ ...f, _isFolder: true })), ...files];
  if (all.length === 0) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
            {['Name', 'Category', 'Size', 'Uploaded by', 'Date', 'Actions'].map((h) => (
              <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--font-semibold)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {all.map((item) => {
            const conf = getCategoryConf(item.category);
            const isFolder = item.isFolder;
            return (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => isFolder ? onEnterFolder(item) : onDetail(item)}
              >
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span>{isFolder ? '📂' : getMimeIcon(item.mimeType)}</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {item.category && <span style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: '4px', background: conf.bg, color: conf.color }}>{item.category}</span>}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{isFolder ? '—' : formatSize(item.size)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {item.uploader ? `${item.uploader.firstName} ${item.uploader.lastName}` : '—'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{formatDate(item.createdAt)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    {!isFolder && <ActionBtn label="⬇️" title="Download" onClick={() => onDownload(item)} />}
                    {isAdmin && <ActionBtn label="✏️" title="Edit" onClick={() => onEdit(item)} />}
                    {isAdmin && <ActionBtn label="🗑️" title="Delete" onClick={() => onDelete(item)} danger />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CrmFileManagerPage() {
  usePageTimeTracker('file_manager');
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const isAdmin = ['admin', 'manager'].includes(user?.role);

  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [folderStack, setFolderStack] = useState([]);
  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [showFolder, setShowFolder] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [folderForm, setFolderForm] = useState(EMPTY_FOLDER);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, folderId: currentFolderId ?? 'null' };
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/files', { params });
      setFiles(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 30, total: 0, totalPages: 0 });
    } catch {
      showError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, currentFolderId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { setPage(1); }, [search, category, currentFolderId]);

  const enterFolder = (folder) => {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setPage(1);
  };
  const navigateBreadcrumb = (idx) => {
    setFolderStack(idx === -1 ? [] : (prev) => prev.slice(0, idx + 1));
    setPage(1);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setUploadFile(f); setShowUpload(true); }
  };
  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setUploadFile(f); setShowUpload(true); }
    e.target.value = '';
  };

  const doUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('name', uploadForm.name || uploadFile.name);
      fd.append('description', uploadForm.description);
      fd.append('category', uploadForm.category);
      if (currentFolderId) fd.append('folderId', currentFolderId);
      if (uploadForm.tags) fd.append('tags', uploadForm.tags);
      await api.post('/files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSuccess('File uploaded successfully');
      setShowUpload(false); setUploadFile(null); setUploadForm(EMPTY_FORM);
      fetchFiles();
    } catch { showError('Failed to upload file'); }
    finally { setUploading(false); }
  };

  const doCreateFolder = async () => {
    if (!folderForm.name.trim()) return;
    setCreatingFolder(true);
    try {
      const payload = { name: folderForm.name.trim(), category: folderForm.category };
      if (currentFolderId) payload.folderId = currentFolderId;
      await api.post('/files/folder', payload);
      showSuccess('Folder created');
      setShowFolder(false); setFolderForm(EMPTY_FOLDER); fetchFiles();
    } catch { showError('Failed to create folder'); }
    finally { setCreatingFolder(false); }
  };

  const openEdit = (item) => {
    setSelected(item);
    setEditForm({
      name: item.name, description: item.description || '',
      category: item.category || 'other',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      propertyId: item.propertyId || '', clientId: item.clientId || '',
    });
    setShowEdit(true);
  };

  const doEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/files/${selected.id}`, {
        ...editForm,
        tags: editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      showSuccess('Updated successfully');
      setShowEdit(false); fetchFiles();
    } catch { showError('Failed to update'); }
    finally { setSaving(false); }
  };

  const openDelete = (item) => { setSelected(item); setShowDelete(true); };
  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/files/${selected.id}`);
      showSuccess('Deleted successfully');
      setShowDelete(false); setSelected(null); fetchFiles();
    } catch { showError('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const doDownload = async (item) => {
    try {
      const response = await api.get(`/files/${item.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url; a.download = item.name; a.click();
      URL.revokeObjectURL(url);
    } catch { showError('Failed to download file'); }
  };

  const folders = files.filter((f) => f.isFolder);
  const fileItems = files.filter((f) => !f.isFolder);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>
            📁 File Manager
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 'var(--space-1) 0 0' }}>
            Centralized file storage and organization
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button style={ghostBtn} onClick={() => setShowFolder(true)}>📂 New Folder</button>
          )}
          <button style={goldBtn(false)} onClick={() => fileInputRef.current?.click()}>⬆️ Upload File</button>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: folderStack.length === 0 ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', padding: '2px 4px' }}
          onClick={() => navigateBreadcrumb(-1)}
        >
          🏠 Root
        </button>
        {folderStack.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <span style={{ color: 'var(--color-text-muted)' }}>›</span>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === folderStack.length - 1 ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', padding: '2px 4px' }}
              onClick={() => navigateBreadcrumb(idx)}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inp(false), maxWidth: '260px' }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-1)', marginLeft: 'auto' }}>
            <button style={segBtn(viewMode === 'grid')} onClick={() => setViewMode('grid')}>⊞ Grid</button>
            <button style={segBtn(viewMode === 'list')} onClick={() => setViewMode('list')}>☰ List</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button style={segBtn(!category)} onClick={() => setCategory('')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.value} style={segBtn(category === c.value)} onClick={() => setCategory(c.value === category ? '' : c.value)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.2)'}`,
          borderRadius: '12px', padding: dragOver ? 'var(--space-8)' : 'var(--space-3)',
          textAlign: 'center', marginBottom: 'var(--space-4)',
          background: dragOver ? 'rgba(212,175,55,0.05)' : 'transparent',
          transition: 'all 0.2s', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {dragOver ? '📂 Drop to upload' : '⬆️ Drop files here or click to upload'}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>Loading files...</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>📂</div>
          <p>No files found. Upload your first file or create a folder.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView folders={folders} files={fileItems} isAdmin={isAdmin} onEnterFolder={enterFolder}
          onDetail={(item) => { setSelected(item); setShowDetail(true); }}
          onEdit={openEdit} onDelete={openDelete} onDownload={doDownload} />
      ) : (
        <ListView folders={folders} files={fileItems} isAdmin={isAdmin} onEnterFolder={enterFolder}
          onDetail={(item) => { setSelected(item); setShowDetail(true); }}
          onEdit={openEdit} onDelete={openDelete} onDownload={doDownload} />
      )}

      <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total}
        onPageChange={setPage} limit={pagination.limit} style={{ marginTop: 'var(--space-6)' }} />

      {/* Upload Modal */}
      <GlassModal isOpen={showUpload} onClose={() => { setShowUpload(false); setUploadFile(null); setUploadForm(EMPTY_FORM); }} title="Upload File" maxWidth="560px">
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {uploadFile && (
            <div style={{ padding: 'var(--space-3)', background: 'rgba(212,175,55,0.07)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              📎 {uploadFile.name} ({formatSize(uploadFile.size)})
            </div>
          )}
          <div>
            <label style={lbl}>Name</label>
            <input style={inp(false)} placeholder={uploadFile?.name || 'File name'} value={uploadForm.name} onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea rows={2} style={{ ...inp(false), resize: 'vertical' }} placeholder="Optional description" value={uploadForm.description} onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select style={inp(false)} value={uploadForm.category} onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Tags (comma separated)</label>
            <input style={inp(false)} placeholder="e.g. contract, 2024" value={uploadForm.tags} onChange={(e) => setUploadForm((p) => ({ ...p, tags: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
            <button style={ghostBtn} onClick={() => { setShowUpload(false); setUploadFile(null); setUploadForm(EMPTY_FORM); }}>Cancel</button>
            <button style={goldBtn(uploading || !uploadFile)} onClick={doUpload} disabled={uploading || !uploadFile}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Create Folder Modal */}
      <GlassModal isOpen={showFolder} onClose={() => { setShowFolder(false); setFolderForm(EMPTY_FOLDER); }} title="Create Folder" maxWidth="440px">
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Folder Name *</label>
            <input style={inp(false)} placeholder="My Folder" value={folderForm.name} onChange={(e) => setFolderForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select style={inp(false)} value={folderForm.category} onChange={(e) => setFolderForm((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <button style={ghostBtn} onClick={() => { setShowFolder(false); setFolderForm(EMPTY_FOLDER); }}>Cancel</button>
            <button style={goldBtn(creatingFolder || !folderForm.name.trim())} onClick={doCreateFolder} disabled={creatingFolder || !folderForm.name.trim()}>
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* File Detail Modal */}
      {selected && (
        <GlassModal isOpen={showDetail} onClose={() => setShowDetail(false)} title={selected.name} maxWidth="600px">
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {selected.mimeType?.startsWith('image/') && (
              <div style={{ textAlign: 'center', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                <img src={`/uploads/files/${selected.path}`} alt={selected.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Meta label="Type" value={selected.mimeType || (selected.isFolder ? 'Folder' : '—')} />
              <Meta label="Size" value={formatSize(selected.size)} />
              <Meta label="Category" value={selected.category || '—'} />
              <Meta label="Uploaded" value={formatDate(selected.createdAt)} />
              <Meta label="By" value={selected.uploader ? `${selected.uploader.firstName} ${selected.uploader.lastName}` : '—'} />
              {selected.property && <Meta label="Property" value={selected.property.title} />}
              {selected.client && <Meta label="Client" value={`${selected.client.firstName} ${selected.client.lastName}`} />}
            </div>
            {selected.description && (
              <div>
                <span style={lbl}>Description</span>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>{selected.description}</p>
              </div>
            )}
            {Array.isArray(selected.tags) && selected.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                {selected.tags.map((t) => (
                  <span key={t} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(212,175,55,0.1)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-xs)' }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
              {!selected.isFolder && (
                <button style={goldBtn(false)} onClick={() => doDownload(selected)}>⬇️ Download</button>
              )}
              {(isAdmin || selected.uploadedBy === user?.id) && (
                <>
                  <button style={ghostBtn} onClick={() => { setShowDetail(false); openEdit(selected); }}>✏️ Edit</button>
                  <button style={dangerBtn} onClick={() => { setShowDetail(false); openDelete(selected); }}>🗑️ Delete</button>
                </>
              )}
            </div>
          </div>
        </GlassModal>
      )}

      {/* Edit Modal */}
      {selected && (
        <GlassModal isOpen={showEdit} onClose={() => setShowEdit(false)} title={`Edit: ${selected.name}`} maxWidth="520px">
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={lbl}>Name *</label>
              <input style={inp(false)} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea rows={2} style={{ ...inp(false), resize: 'vertical' }} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp(false)} value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tags (comma separated)</label>
              <input style={inp(false)} value={editForm.tags} onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button style={ghostBtn} onClick={() => setShowEdit(false)}>Cancel</button>
              <button style={goldBtn(saving || !editForm.name.trim())} onClick={doEdit} disabled={saving || !editForm.name.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* Delete Confirm Modal */}
      {selected && (
        <GlassModal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" maxWidth="420px">
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{selected.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button style={ghostBtn} onClick={() => setShowDelete(false)}>Cancel</button>
              <button style={dangerBtn} onClick={doDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </GlassModal>
      )}

    </div>
  );
}

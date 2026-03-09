import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'onboarding',       label: 'Onboarding',       icon: '🚀' },
  { value: 'sales',            label: 'Sales',            icon: '💼' },
  { value: 'legal',            label: 'Legal',            icon: '⚖️' },
  { value: 'compliance',       label: 'Compliance',       icon: '🛡️' },
  { value: 'product_knowledge',label: 'Product',          icon: '🏠' },
  { value: 'soft_skills',      label: 'Soft Skills',      icon: '🤝' },
  { value: 'technology',       label: 'Technology',       icon: '💻' },
  { value: 'other',            label: 'Other',            icon: '📌' },
];

const DIFFICULTIES = [
  { value: 'beginner',     label: 'Beginner',     color: '#4ade80' },
  { value: 'intermediate', label: 'Intermediate', color: '#fbbf24' },
  { value: 'advanced',     label: 'Advanced',     color: '#f87171' },
];

const CONTENT_TYPES = [
  { value: 'video',         label: 'Video',         icon: '🎬' },
  { value: 'document',      label: 'Document',      icon: '📄' },
  { value: 'quiz',          label: 'Quiz',          icon: '❓' },
  { value: 'interactive',   label: 'Interactive',   icon: '🖱️' },
  { value: 'external_link', label: 'External Link', icon: '🔗' },
];

const CATEGORY_CONFIG = {
  onboarding:        { bg: 'rgba(99,102,241,0.15)',  color: '#a78bfa' },
  sales:             { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8' },
  legal:             { bg: 'rgba(239,68,68,0.14)',   color: '#f87171' },
  compliance:        { bg: 'rgba(234,179,8,0.14)',   color: '#fbbf24' },
  product_knowledge: { bg: 'rgba(34,197,94,0.14)',   color: '#4ade80' },
  soft_skills:       { bg: 'rgba(168,85,247,0.14)',  color: '#c084fc' },
  technology:        { bg: 'rgba(6,182,212,0.14)',   color: '#22d3ee' },
  other:             { bg: 'rgba(107,114,128,0.14)', color: '#9ca3af' },
};

const DIFF_CONFIG = {
  beginner:     { bg: 'rgba(34,197,94,0.14)',  color: '#4ade80' },
  intermediate: { bg: 'rgba(234,179,8,0.14)',  color: '#fbbf24' },
  advanced:     { bg: 'rgba(239,68,68,0.14)',  color: '#f87171' },
};

const EMPTY_COURSE_FORM = {
  title: '', description: '', category: 'other', difficulty: 'beginner',
  duration: '', contentType: 'document', contentUrl: '', thumbnailUrl: '',
  instructor: '', isRequired: false, isPublished: true, order: 0, tags: '',
};

// ─── Style helpers ─────────────────────────────────────────────────────────────

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

const tabBtn = (active) => ({
  padding: 'var(--space-2) var(--space-4)', borderRadius: '8px',
  border: `1px solid ${active ? 'var(--color-accent-gold)' : 'transparent'}`,
  background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
  color: active ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
  cursor: 'pointer', fontSize: 'var(--text-sm)',
  fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)',
  transition: 'all 0.15s',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (mins) => {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MT', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getCategoryConf = (cat) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
const getDiffConf = (diff) => DIFF_CONFIG[diff] || DIFF_CONFIG.beginner;
const getContentTypeConf = (ct) => CONTENT_TYPES.find((c) => c.value === ct) || { icon: '📄', label: 'Document' };

function ProgressBar({ value, color = 'var(--color-accent-gold)', height = 6 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Badge({ label, bg, color }) {
  return (
    <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '4px', background: bg, color, fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>{label}</span>
  );
}

// ─── CrmTrainingPage ───────────────────────────────────────────────────────────

export default function CrmTrainingPage() {
  usePageTimeTracker('training');
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const isAdmin = ['admin', 'manager'].includes(user?.role);

  // Stats
  const [stats, setStats] = useState(null);

  // Courses
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Progress
  const [progressRecords, setProgressRecords] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);

  // Filters
  const [tab, setTab] = useState('all'); // 'all' | 'progress' | 'required'
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // ── Fetch stats ───────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/training/stats');
      setStats(data.data);
    } catch { /* silent */ }
  }, []);

  // ── Fetch courses ─────────────────────────────────────────────────────────────

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)     params.search     = search;
      if (category)   params.category   = category;
      if (difficulty) params.difficulty = difficulty;
      if (tab === 'required') params.isRequired = true;
      const { data } = await api.get('/training/courses', { params });
      setCourses(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch { showError('Failed to load courses'); }
    finally { setLoading(false); }
  }, [page, search, category, difficulty, tab]);

  // ── Fetch progress ────────────────────────────────────────────────────────────

  const fetchProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      const { data } = await api.get('/training/progress');
      setProgressRecords(data.data || []);
    } catch { /* silent */ }
    finally { setProgressLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { if (tab === 'progress') fetchProgress(); }, [tab, fetchProgress]);
  useEffect(() => { setPage(1); }, [search, category, difficulty, tab]);

  // ── Create / Edit course ──────────────────────────────────────────────────────

  const openCreate = () => {
    setCourseForm(EMPTY_COURSE_FORM);
    setFormErrors({});
    setShowCreate(true);
  };

  const openEditCourse = (course) => {
    setSelected(course);
    setCourseForm({
      title: course.title, description: course.description || '',
      category: course.category, difficulty: course.difficulty,
      duration: course.duration || '', contentType: course.contentType,
      contentUrl: course.contentUrl || '', thumbnailUrl: course.thumbnailUrl || '',
      instructor: course.instructor || '',
      isRequired: course.isRequired, isPublished: course.isPublished,
      order: course.order || 0,
      tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
    });
    setFormErrors({});
    setShowEdit(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!courseForm.title.trim()) errors.title = 'Title is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const doCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...courseForm,
        tags: courseForm.tags ? courseForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        duration: courseForm.duration ? parseInt(courseForm.duration, 10) : null,
      };
      await api.post('/training/courses', payload);
      showSuccess('Course created successfully');
      setShowCreate(false);
      fetchCourses(); fetchStats();
    } catch { showError('Failed to create course'); }
    finally { setSaving(false); }
  };

  const doEdit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...courseForm,
        tags: courseForm.tags ? courseForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        duration: courseForm.duration ? parseInt(courseForm.duration, 10) : null,
      };
      await api.put(`/training/courses/${selected.id}`, payload);
      showSuccess('Course updated successfully');
      setShowEdit(false);
      fetchCourses();
    } catch { showError('Failed to update course'); }
    finally { setSaving(false); }
  };

  // ── Delete course ─────────────────────────────────────────────────────────────

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/training/courses/${selected.id}`);
      showSuccess('Course deleted');
      setShowDelete(false); setSelected(null);
      fetchCourses(); fetchStats();
    } catch { showError('Failed to delete course'); }
    finally { setDeleting(false); }
  };

  // ── Progress tracking ─────────────────────────────────────────────────────────

  const updateProgress = async (courseId, updates) => {
    setUpdatingProgress(true);
    try {
      await api.post(`/training/progress/${courseId}`, updates);
      showSuccess('Progress updated');
      fetchCourses(); fetchStats();
      if (tab === 'progress') fetchProgress();
      // Refresh detail modal
      if (selected?.id === courseId) {
        const { data } = await api.get(`/training/courses/${courseId}`);
        setSelected(data.data);
      }
    } catch { showError('Failed to update progress'); }
    finally { setUpdatingProgress(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const hasRequired = stats?.requiredCourses > 0;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>
            🎓 Training
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 'var(--space-1) 0 0' }}>
            Courses, certifications, and training materials
          </p>
        </div>
        {isAdmin && (
          <button style={goldBtn(false)} onClick={openCreate}>+ Create Course</button>
        )}
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Total Courses', value: stats.totalCourses, icon: '📚', color: '#a78bfa' },
            { label: 'Completed',     value: stats.completed,    icon: '✅', color: '#4ade80' },
            { label: 'In Progress',   value: stats.inProgress,   icon: '▶️', color: '#fbbf24' },
            { label: 'Completion',    value: `${stats.completionRate}%`, icon: '📈', color: '#38bdf8' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '16px', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid rgba(212,175,55,0.12)', paddingBottom: 'var(--space-3)' }}>
        <button style={tabBtn(tab === 'all')} onClick={() => setTab('all')}>📚 All Courses</button>
        <button style={tabBtn(tab === 'progress')} onClick={() => setTab('progress')}>📊 My Progress</button>
        {hasRequired && (
          <button style={tabBtn(tab === 'required')} onClick={() => setTab('required')}>⭐ Required</button>
        )}
      </div>

      {tab === 'progress' ? (
        <ProgressTab records={progressRecords} loading={progressLoading} />
      ) : (
        <>
          {/* Filters */}
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inp(false), maxWidth: '260px' }}
              />
              <select style={{ ...inp(false), maxWidth: '160px' }} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">All Levels</option>
                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
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

          {/* Course grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>Loading courses...</div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🎓</div>
              <p>No courses found. {isAdmin && 'Create your first course!'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isAdmin={isAdmin}
                  onDetail={() => { setSelected(course); setShowDetail(true); }}
                  onEdit={() => openEditCourse(course)}
                  onDelete={() => { setSelected(course); setShowDelete(true); }}
                />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total}
            onPageChange={setPage} limit={pagination.limit} style={{ marginTop: 'var(--space-6)' }} />
        </>
      )}

      {/* Create Modal */}
      <GlassModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Course" maxWidth="620px">
        <CourseForm form={courseForm} errors={formErrors} onChange={setCourseForm} />
        <div style={{ padding: '0 var(--space-5) var(--space-5)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button style={ghostBtn} onClick={() => setShowCreate(false)}>Cancel</button>
          <button style={goldBtn(saving || !courseForm.title.trim())} onClick={doCreate} disabled={saving || !courseForm.title.trim()}>
            {saving ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </GlassModal>

      {/* Edit Modal */}
      {selected && (
        <GlassModal isOpen={showEdit} onClose={() => setShowEdit(false)} title={`Edit: ${selected.title}`} maxWidth="620px">
          <CourseForm form={courseForm} errors={formErrors} onChange={setCourseForm} />
          <div style={{ padding: '0 var(--space-5) var(--space-5)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <button style={ghostBtn} onClick={() => setShowEdit(false)}>Cancel</button>
            <button style={goldBtn(saving || !courseForm.title.trim())} onClick={doEdit} disabled={saving || !courseForm.title.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </GlassModal>
      )}

      {/* Detail Modal */}
      {selected && (
        <GlassModal isOpen={showDetail} onClose={() => setShowDetail(false)} title={selected.title} maxWidth="640px">
          <CourseDetail
            course={selected}
            isAdmin={isAdmin}
            onUpdateProgress={updateProgress}
            updatingProgress={updatingProgress}
          />
        </GlassModal>
      )}

      {/* Delete Confirm */}
      {selected && (
        <GlassModal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Course" maxWidth="420px">
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{selected.title}</strong>? All progress records will also be deleted.
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

// ─── CourseCard ───────────────────────────────────────────────────────────────

function CourseCard({ course, isAdmin, onDetail, onEdit, onDelete }) {
  const catConf  = getCategoryConf(course.category);
  const diffConf = getDiffConf(course.difficulty);
  const ctConf   = getContentTypeConf(course.contentType);
  const progress = course.userProgress;
  const progressPct = progress?.progress || 0;

  const statusColor = progress?.status === 'completed' ? '#4ade80' : progress?.status === 'in_progress' ? '#fbbf24' : '#9ca3af';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
        border: `1px solid ${course.isRequired ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.12)'}`,
        borderRadius: '16px', padding: 'var(--space-5)', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      }}
      onClick={onDetail}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge label={course.category?.replace('_', ' ')} bg={catConf.bg} color={catConf.color} />
          <Badge label={course.difficulty} bg={diffConf.bg} color={diffConf.color} />
          {course.isRequired && <Badge label="Required" bg="rgba(212,175,55,0.15)" color="var(--color-accent-gold)" />}
        </div>
        {!course.isPublished && <Badge label="Draft" bg="rgba(107,114,128,0.2)" color="#9ca3af" />}
      </div>

      {/* Title */}
      <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{course.title}</h3>

      {/* Description */}
      {course.description && (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        <span>{ctConf.icon} {ctConf.label}</span>
        {course.duration && <span>⏱ {formatDuration(course.duration)}</span>}
        {course.instructor && <span>👤 {course.instructor}</span>}
      </div>

      {/* Progress */}
      {progress && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            <span style={{ color: statusColor, textTransform: 'capitalize' }}>{progress.status?.replace('_', ' ')}</span>
            <span>{progressPct}%</span>
          </div>
          <ProgressBar value={progressPct} color={statusColor} />
        </div>
      )}

      {/* Footer actions */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', paddingTop: 'var(--space-1)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          onClick={(e) => e.stopPropagation()}>
          <button
            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.2)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', transition: 'all 0.15s' }}
            onClick={onEdit}
          >✏️ Edit</button>
          <button
            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-xs)', color: '#f87171', transition: 'all 0.15s' }}
            onClick={onDelete}
          >🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

// ─── CourseDetail ─────────────────────────────────────────────────────────────

function CourseDetail({ course, isAdmin, onUpdateProgress, updatingProgress }) {
  const progress = course.userProgress;
  const catConf  = getCategoryConf(course.category);
  const diffConf = getDiffConf(course.difficulty);
  const ctConf   = getContentTypeConf(course.contentType);

  const progressPct = progress?.progress || 0;
  const statusColor = progress?.status === 'completed' ? '#4ade80' : progress?.status === 'in_progress' ? '#fbbf24' : '#9ca3af';

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Badge label={course.category?.replace('_', ' ')} bg={catConf.bg} color={catConf.color} />
        <Badge label={course.difficulty} bg={diffConf.bg} color={diffConf.color} />
        <Badge label={`${ctConf.icon} ${ctConf.label}`} bg="rgba(255,255,255,0.06)" color="var(--color-text-secondary)" />
        {course.isRequired && <Badge label="⭐ Required" bg="rgba(212,175,55,0.15)" color="var(--color-accent-gold)" />}
      </div>

      {/* Description */}
      {course.description && (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{course.description}</p>
      )}

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        {course.instructor && <MetaItem label="Instructor" value={course.instructor} />}
        {course.duration && <MetaItem label="Duration" value={formatDuration(course.duration)} />}
        <MetaItem label="Created" value={formatDate(course.createdAt)} />
        {course.creator && <MetaItem label="Created by" value={`${course.creator.firstName} ${course.creator.lastName}`} />}
      </div>

      {/* Content link */}
      {course.contentUrl && (
        <div>
          <p style={{ margin: '0 0 var(--space-2)', ...lbl }}>Content</p>
          <a href={course.contentUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none', background: 'rgba(212,175,55,0.07)', transition: 'all 0.2s' }}>
            {ctConf.icon} Open {ctConf.label}
          </a>
        </div>
      )}

      {/* Tags */}
      {Array.isArray(course.tags) && course.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {course.tags.map((t) => (
            <span key={t} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(212,175,55,0.1)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-xs)' }}>{t}</span>
          ))}
        </div>
      )}

      {/* Progress section */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: 'var(--space-4)' }}>
        <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>Your Progress</p>
        {progress ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
              <span style={{ color: statusColor, textTransform: 'capitalize' }}>{progress.status?.replace('_', ' ')}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{progressPct}%</span>
            </div>
            <ProgressBar value={progressPct} color={statusColor} height={8} />
            {progress.startedAt && (
              <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Started: {formatDate(progress.startedAt)}
                {progress.completedAt && ` · Completed: ${formatDate(progress.completedAt)}`}
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Not started yet</p>
        )}
      </div>

      {/* Progress actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {(!progress || progress.status === 'not_started') && (
          <button style={goldBtn(updatingProgress)} onClick={() => onUpdateProgress(course.id, { status: 'in_progress' })} disabled={updatingProgress}>
            ▶️ Start Course
          </button>
        )}
        {progress?.status === 'in_progress' && (
          <button style={goldBtn(updatingProgress)} onClick={() => onUpdateProgress(course.id, { status: 'completed', progress: 100 })} disabled={updatingProgress}>
            ✅ Mark Complete
          </button>
        )}
        {progress?.status === 'completed' && (
          <button style={{ ...ghostBtn, color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }} disabled>
            ✅ Completed
          </button>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  );
}

// ─── ProgressTab ──────────────────────────────────────────────────────────────

function ProgressTab({ records, loading }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>Loading progress...</div>;
  if (records.length === 0) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>📊</div>
      <p>No courses started yet. Start a course to track your progress.</p>
    </div>
  );

  const completed  = records.filter((r) => r.status === 'completed');
  const inProgress = records.filter((r) => r.status === 'in_progress');
  const notStarted = records.filter((r) => r.status === 'not_started');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {[
        { label: '✅ Completed', items: completed,  color: '#4ade80' },
        { label: '▶️ In Progress', items: inProgress, color: '#fbbf24' },
        { label: '⏹ Not Started', items: notStarted, color: '#9ca3af' },
      ].filter((g) => g.items.length > 0).map((group) => (
        <div key={group.label}>
          <h3 style={{ fontSize: 'var(--text-sm)', color: group.color, marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {group.label} ({group.items.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {group.items.map((record) => (
              <div key={record.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '12px', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>
                    {record.course?.title || 'Unknown Course'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {record.course?.category?.replace('_', ' ')} · {record.course?.difficulty}
                    {record.completedAt && ` · Completed ${formatDate(record.completedAt)}`}
                  </p>
                </div>
                <div style={{ flexShrink: 0, width: '120px', textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: group.color, marginBottom: '4px' }}>{record.progress}%</div>
                  <ProgressBar value={record.progress} color={group.color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CourseForm ───────────────────────────────────────────────────────────────

function CourseForm({ form, errors, onChange }) {
  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '65vh', overflowY: 'auto' }}>
      <div>
        <label style={lbl}>Title *</label>
        <input style={inp(errors.title)} value={form.title} onChange={set('title')} placeholder="Course title" />
        {errors.title && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171' }}>{errors.title}</span>}
      </div>
      <div>
        <label style={lbl}>Description</label>
        <textarea rows={3} style={{ ...inp(false), resize: 'vertical' }} value={form.description} onChange={set('description')} placeholder="Course description" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div>
          <label style={lbl}>Category</label>
          <select style={inp(false)} value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Difficulty</label>
          <select style={inp(false)} value={form.difficulty} onChange={set('difficulty')}>
            {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div>
          <label style={lbl}>Content Type</label>
          <select style={inp(false)} value={form.contentType} onChange={set('contentType')}>
            {CONTENT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Duration (minutes)</label>
          <input type="number" style={inp(false)} value={form.duration} onChange={set('duration')} placeholder="60" min="0" />
        </div>
      </div>
      <div>
        <label style={lbl}>Content URL</label>
        <input style={inp(false)} value={form.contentUrl} onChange={set('contentUrl')} placeholder="https://..." />
      </div>
      <div>
        <label style={lbl}>Instructor</label>
        <input style={inp(false)} value={form.instructor} onChange={set('instructor')} placeholder="Instructor name" />
      </div>
      <div>
        <label style={lbl}>Tags (comma separated)</label>
        <input style={inp(false)} value={form.tags} onChange={set('tags')} placeholder="e.g. onboarding, 2024" />
      </div>
      <div>
        <label style={lbl}>Order</label>
        <input type="number" style={inp(false)} value={form.order} onChange={set('order')} placeholder="0" min="0" />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={form.isRequired} onChange={set('isRequired')} />
          Required for all agents
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} />
          Published
        </label>
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';
import api from '../../services/api';

/**
 * ImageDropZone — drag-and-drop / click-to-browse single-image uploader.
 *
 * Props:
 *  - value:       string URL of the current image (or empty string)
 *  - onChange:    (url: string) => void — called with uploaded URL or '' when cleared
 *  - variant:     'logo' | 'cover'
 *                   'logo'  — 120×120px square, circular preview
 *                   'cover' — full-width, 160px tall, rectangular preview
 *  - label:       string — display label (optional)
 *  - placeholder: string — text shown in empty state (optional)
 */
const ImageDropZone = ({
  value = '',
  onChange,
  variant = 'cover',
  label,
  placeholder,
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // base64 preview during upload
  const [error, setError] = useState(null);

  const isLogo = variant === 'logo';

  const zoneStyle = isLogo
    ? {
        width: 120,
        height: 120,
        borderRadius: '50%',
        flexShrink: 0,
      }
    : {
        width: '100%',
        height: 160,
        borderRadius: 'var(--radius-md)',
      };

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    setError(null);

    // Generate base64 preview for immediate display
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(null);
      onChange(res.data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Check your connection and try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const [imgError, setImgError] = useState(false);

  // Reset imgError whenever the src changes
  const prevSrc = React.useRef(null);
  if (prevSrc.current !== (preview || value)) {
    prevSrc.current = preview || value;
    if (imgError) setImgError(false);
  }
  const displaySrc = preview || value || null;
  const hasImage = Boolean(displaySrc) && !imgError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <span style={{
          display: 'block',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </span>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          ...zoneStyle,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: uploading ? 'not-allowed' : 'pointer',
          border: dragging
            ? '2px dashed var(--color-accent-gold)'
            : hasImage
              ? '2px solid var(--color-border)'
              : '1px dashed var(--color-border)',
          background: dragging
            ? 'rgba(196,162,101,0.08)'
            : 'var(--color-surface-glass)',
          transition: 'border-color 0.15s, background 0.15s',
          boxSizing: 'border-box',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={uploading}
        />

        {/* Image preview */}
        {hasImage && (
          <img
            src={displaySrc}
            alt="preview"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: isLogo ? '50%' : 'var(--radius-md)',
              opacity: uploading ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
            onError={() => setImgError(true)}
          />
        )}

        {/* Loading spinner overlay */}
        {uploading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            zIndex: 2,
          }}>
            <div style={{
              width: 22,
              height: 22,
              border: '3px solid rgba(255,193,7,0.3)',
              borderTopColor: 'var(--color-accent-gold)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', fontWeight: 600 }}>
              Uploading…
            </span>
          </div>
        )}

        {/* Empty state */}
        {!hasImage && !uploading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              {placeholder || 'Drag & drop or click to browse'}
            </span>
          </div>
        )}

        {/* Clear button */}
        {hasImage && !uploading && (
          <button
            type="button"
            onClick={handleClear}
            title="Remove image"
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0,0,0,0.65)',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              lineHeight: 1,
              transition: 'background 0.15s',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {(error || imgError) && (
        <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', margin: 0 }}>
          {error || 'Could not load image. The URL may be invalid or inaccessible.'}
        </p>
      )}

      {/* Spinner keyframes injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ImageDropZone;

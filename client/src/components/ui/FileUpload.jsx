import React, { useRef, useState } from 'react';
import api from '../../services/api';

/**
 * FileUpload — drag-and-drop / click-to-browse file uploader.
 *
 * Props:
 *  - accept:      MIME types string, e.g. "image/jpeg,image/png,image/webp" (default: images)
 *  - multiple:    boolean — allow multiple files (default: true)
 *  - value:       array of URL strings already uploaded
 *  - onChange:    (urls: string[]) => void
 *  - label:       string — display label
 */
const FileUpload = ({ accept = 'image/jpeg,image/png,image/webp', multiple = true, value = [], onChange, label = 'Upload Files' }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data.url;
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    const fileArray = Array.from(files);
    const targets = multiple ? fileArray : [fileArray[0]];

    try {
      const urls = await Promise.all(targets.map(uploadFile));
      const next = multiple ? [...value, ...urls] : urls;
      onChange(next);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (url) => {
    let filename;
    try {
      filename = new URL(url, window.location.origin).pathname.split('/').pop();
    } catch {
      filename = url.split('/').pop();
    }
    try {
      await api.delete(`/uploads/${filename}`);
    } catch {
      // Best-effort — still remove from UI
    }
    onChange(value.filter(u => u !== url));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const isImage = (url) => /\.(jpe?g|png|webp)$/i.test(url);
  const isVideo = (url) => /\.(mp4|mov)$/i.test(url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="file-upload-dropzone"
        style={{
          border: `2px dashed ${dragging ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragging ? 'rgba(196,162,101,0.08)' : 'var(--color-surface-glass)',
          transition: 'all var(--transition-fast)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>⏳</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>Uploading… {progress}%</p>
            <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent-gold)', transition: 'width 0.2s' }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>📁</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              {label}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
              Drag & drop or click to browse
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>{error}</p>
      )}

      {/* Thumbnails */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {value.map((url) => (
            <div key={url} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              {isImage(url) ? (
                <img src={url} alt="upload preview" style={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }} />
              ) : isVideo(url) ? (
                <video src={url} style={{ height: 80, width: 120, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
              ) : (
                <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-glass)', fontSize: 'var(--text-xl)' }}>
                  🎬
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(url)}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: 'var(--color-error)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

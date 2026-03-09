import React from 'react';
import { useAuth } from '../../context/AuthContext';

const PermissionGate = ({ permissionKey, children }) => {
  const { user } = useAuth();

  if (!user) return null;

  // Admin bypasses all permission checks
  if (user.role === 'admin') return children;

  // Check permission map
  const permMap = {};
  (user.UserPermissions || []).forEach(p => { permMap[p.feature] = p.isEnabled; });

  if (permissionKey && permMap[permissionKey] !== true) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '400px', textAlign: 'center', padding: 'var(--space-8)',
      }}>
        <span style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🔒</span>
        <h2 style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)',
        }}>Access Restricted</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: '400px' }}>
          You don&apos;t have permission to access this feature. Please contact your administrator to request access.
        </p>
      </div>
    );
  }

  return children;
};

export default PermissionGate;

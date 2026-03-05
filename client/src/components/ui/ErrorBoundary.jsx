import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <div style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
            Unable to display this content. Please try again.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-glass)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
            }}
          >
            ← Go Back
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

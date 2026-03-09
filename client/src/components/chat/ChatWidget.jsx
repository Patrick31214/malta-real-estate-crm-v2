import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ChannelList from './ChannelList';
import ChatView from './ChatView';
import NewConversation from './NewConversation';
import ErrorBoundary from '../ui/ErrorBoundary';
import './ChatWidget.css';

const UNREAD_POLL_MS = 15000;

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'chat' | 'new'
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const pollRef = useRef(null);

  // Only show for authenticated agents/managers/admins
  const canUseChat = isAuthenticated && ['admin', 'manager', 'agent'].includes(user?.role);

  // Fetch channels when widget opens
  useEffect(() => {
    if (!open || !canUseChat) return;
    api.get('/chat/channels')
      .then(r => setChannels(r.data.channels || []))
      .catch(() => {});
  }, [open, canUseChat]);

  // Poll unread count when widget is closed
  useEffect(() => {
    if (!canUseChat) return;

    const fetchUnread = () => {
      api.get('/chat/unread-count')
        .then(r => setUnreadTotal(r.data.total || 0))
        .catch(() => {});
    };

    fetchUnread();
    if (!open) {
      pollRef.current = setInterval(fetchUnread, UNREAD_POLL_MS);
    }
    return () => clearInterval(pollRef.current);
  }, [open, canUseChat]);

  // Refresh channel list on new message to update unread counts
  const refreshChannels = () => {
    if (!open) return;
    api.get('/chat/channels')
      .then(r => {
        setChannels(r.data.channels || []);
        const total = (r.data.channels || []).reduce((s, c) => s + (c.unreadCount || 0), 0);
        setUnreadTotal(total);
      })
      .catch(() => {});
  };

  const handleSelectChannel = (channel) => {
    setActiveChannel(channel);
    setView('chat');
    // Reset unread for this channel in local state
    setChannels(prev =>
      prev.map(c => c.id === channel.id ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleToggle = () => {
    setOpen(o => {
      if (!o) {
        // Reset to list view when opening
        setView('list');
        setActiveChannel(null);
      }
      return !o;
    });
  };

  const handleBack = () => {
    setView('list');
    setActiveChannel(null);
    refreshChannels();
  };

  if (!canUseChat) return null;

  const totalUnread = channels.reduce((s, c) => s + (c.unreadCount || 0), 0) || unreadTotal;

  return (
    <>
      {/* Floating button */}
      <button
        className={`chat-widget-btn${totalUnread > 0 ? ' has-unread' : ''}`}
        onClick={handleToggle}
        title={open ? 'Close chat' : 'Open chat'}
        aria-label="Chat"
      >
        {open ? '✕' : '💬'}
        {!open && totalUnread > 0 && (
          <span className="chat-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
        )}
      </button>

      {/* Widget panel */}
      {open && (
        <div className="chat-widget-panel" role="dialog" aria-label="Chat">
          {/* Header */}
          <div className="chat-widget-header">
            <h2 className="chat-widget-header-title">
              💬 Messages
              {totalUnread > 0 && view === 'list' && (
                <span className="chat-badge" style={{ position: 'static', border: 'none', marginLeft: 4 }}>
                  {totalUnread}
                </span>
              )}
            </h2>
            <div className="chat-widget-header-actions">
              <button
                className="chat-widget-icon-btn"
                onClick={handleToggle}
                title="Close"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="chat-widget-body">
            <ErrorBoundary fallback={(error) => (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Unable to load chat. Please try closing and reopening.
                {process.env.NODE_ENV !== 'production' && error && (
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>{error.message}</div>
                )}
              </div>
            )}>
              {view === 'list' && (
                <ChannelList
                  channels={channels}
                  activeChannelId={activeChannel?.id}
                  onSelectChannel={handleSelectChannel}
                  onNewMessage={() => setView('new')}
                />
              )}

              {view === 'chat' && activeChannel && (
                <ChatView
                  channel={activeChannel}
                  currentUser={user}
                  onBack={handleBack}
                  autoFocus
                />
              )}

              {view === 'new' && (
                <NewConversation
                  onBack={() => setView('list')}
                  onSelectChannel={(channel) => {
                    // Add to channels if not already there, then open
                    setChannels(prev => {
                      const exists = prev.find(c => c.id === channel.id);
                      return exists ? prev : [{ ...channel, unreadCount: 0 }, ...prev];
                    });
                    handleSelectChannel(channel);
                  }}
                  currentUser={user}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

'use client';

import { useState, useRef, useEffect } from 'react';
import { NotificationLog } from '@/lib/offline/db';

interface NotificationCenterProps {
  notifications: NotificationLog[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onDelete,
  onClearAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown if user clicks outside of container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon"
        style={{
          background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: 38,
          height: 38,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? '#4f8ef7' : 'var(--text-2)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
        title="Notifications"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            className="pulse-dot"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 15,
              height: 15,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              border: '2px solid #080810',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div
          className="glass anim-fade"
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            zIndex: 100,
            padding: 16,
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 10 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  onClearAll();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 290, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', gap: 8, color: 'var(--text-3)' }}>
                <span style={{ fontSize: 26 }}>🔔</span>
                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>All caught up!</p>
                <p style={{ fontSize: '0.72rem', textAlign: 'center', opacity: 0.7 }}>Milestones and progress reminders will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: notif.read ? 'rgba(255, 255, 255, 0.01)' : 'rgba(79, 142, 247, 0.04)',
                    border: notif.read ? '1px solid rgba(255, 255, 255, 0.03)' : '1px solid rgba(79, 142, 247, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Title & Type Indicators */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 36 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background:
                          notif.type === 'success'
                            ? '#30d474'
                            : notif.type === 'warning'
                            ? '#fb8c00'
                            : '#4f8ef7',
                        boxShadow: `0 0 6px ${
                          notif.type === 'success'
                            ? '#30d474'
                            : notif.type === 'warning'
                            ? '#fb8c00'
                            : '#4f8ef7'
                        }`,
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: notif.read ? 'var(--text-2)' : 'var(--text-1)' }}>
                      {notif.title}
                    </span>
                  </div>

                  {/* Message body */}
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', lineHeight: 1.4, paddingRight: 36 }}>
                    {notif.message}
                  </p>

                  {/* Time badge */}
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.25)', fontWeight: 600 }}>
                    {formatTime(notif.created_at)}
                  </span>

                  {/* Actions overlay panel */}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Mark as read button */}
                    {!notif.read && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4f8ef7',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Mark as Read"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(notif.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                      title="Clear Alert"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

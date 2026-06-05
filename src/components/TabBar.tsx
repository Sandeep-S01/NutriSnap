'use client';

type Tab = 'scan' | 'dashboard' | 'history';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  entryCount: number;
}

export default function TabBar({ activeTab, onTabChange, entryCount }: TabBarProps) {
  const tabs: { id: Tab; label: string; icon: string; activeIcon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard',           activeIcon: 'dashboard' },
    { id: 'scan',      label: 'Scan',      icon: 'center_focus_strong', activeIcon: 'center_focus_strong' },
    { id: 'history',   label: 'History',   icon: 'history',             activeIcon: 'history' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`nav-btn${activeTab === tab.id ? ' active' : ''}`}
          style={{ position: 'relative' }}
          aria-label={tab.label}
        >
          {/* Badge for dashboard */}
          {tab.id === 'dashboard' && entryCount > 0 && activeTab !== 'dashboard' && (
            <span style={{
              position: 'absolute', top: 4, right: 16,
              minWidth: 16, height: 16, borderRadius: 99,
              background: 'var(--primary)', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
            }}>{entryCount > 9 ? '9+' : entryCount}</span>
          )}

          <span className={`material-symbols-outlined${activeTab === tab.id ? ' icon-fill' : ''}`}>
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

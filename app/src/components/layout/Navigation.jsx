const Navigation = ({ activeTab, setActiveTab }) => (
    <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF', borderTop: '1px solid #EEE',
        display: 'flex', justifyContent: 'space-around',
        padding: '12px 0 20px', zIndex: 50,
    }}>
        {[
            { id: 'home', icon: '🏠', label: 'ホーム' },
            { id: 'calendar', icon: '📅', label: 'カレンダー' },
            { id: 'timeline', icon: '📜', label: '履歴' },
            { id: 'settings', icon: '⚙️', label: '設定' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                    border: 'none', background: 'transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '4px', cursor: 'pointer',
                    opacity: activeTab === tab.id ? 1 : 0.5,
                }}
            >
                <span style={{ fontSize: '24px' }}>{tab.icon}</span>
                <span style={{
                    fontSize: '10px',
                    color: activeTab === tab.id ? '#FF6B9D' : '#888',
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                }}>
                    {tab.label}
                </span>
            </button>
        ))}
    </nav>
);

export default Navigation;

const Navigation = ({ activeTab, setActiveTab }) => (
    <nav className="bottom-nav">
        {[
            { id: 'home', icon: '🏠', label: 'ホーム' },
            { id: 'tasks', icon: '✅', label: 'タスク' },
            { id: 'goals', icon: '🎯', label: '目標' },
            { id: 'calendar', icon: '📅', label: 'カレンダー' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
            </button>
        ))}
    </nav>
);

export default Navigation;

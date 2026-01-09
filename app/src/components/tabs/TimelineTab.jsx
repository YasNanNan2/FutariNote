const TimelineTab = ({ timeline, thanksCount }) => (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
        <h2 style={{ margin: '0 0 20px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>📜 タイムライン</h2>

        <div style={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
            borderRadius: '20px', padding: '20px', marginBottom: '24px',
            color: '#FFF', textAlign: 'center',
        }}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>感謝の総数</p>
            <p style={{ margin: '8px 0', fontSize: '48px', fontWeight: 'bold' }}>💝 {thanksCount}</p>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>これまでに送った「ありがとう」</p>
        </div>

        {timeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                <p>まだ履歴がありません</p>
                <p style={{ fontSize: '14px' }}>タスクを追加・完了すると履歴が表示されます</p>
            </div>
        ) : (
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '2px', backgroundColor: '#EEE' }} />
                {timeline.map((entry, idx) => (
                    <div key={entry.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both` }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: entry.userColor || '#FF6B9D',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FFF', fontWeight: 'bold', fontSize: '14px',
                            flexShrink: 0, zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}>
                            {entry.user?.[0] || '?'}
                        </div>
                        <div style={{
                            flex: 1, backgroundColor: '#FFF', borderRadius: '16px', padding: '16px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{entry.user}</span>
                                <span style={{ fontSize: '12px', color: '#888' }}>
                                    {new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>{entry.details}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default TimelineTab;

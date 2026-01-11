/**
 * RecipientSelector - 感謝の宛先選択モーダル
 *
 * 3人以上のグループで感謝を送る際に、宛先を選択するためのコンポーネント
 */
const RecipientSelector = ({ members, onSelect, onClose }) => {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 100,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#FFF',
                    borderRadius: '24px 24px 0 0',
                    padding: '24px',
                    width: '100%',
                    maxWidth: '500px',
                    animation: 'slideUp 0.3s ease-out',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{
                    margin: '0 0 20px',
                    fontSize: '18px',
                    fontFamily: "'Zen Maru Gothic', sans-serif",
                    textAlign: 'center',
                }}>
                    誰に感謝を送りますか？
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {members.map(member => (
                        <button
                            key={member.userId}
                            onClick={() => onSelect(member.userId)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                borderRadius: '16px',
                                border: '2px solid #EEE',
                                background: '#FFF',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = member.color || '#4ECDC4';
                                e.currentTarget.style.backgroundColor = `${member.color || '#4ECDC4'}10`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#EEE';
                                e.currentTarget.style.backgroundColor = '#FFF';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: member.color || '#4ECDC4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFF',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                flexShrink: 0,
                            }}>
                                {(member.name || member.email)?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                }}>
                                    {member.name || member.email}
                                </p>
                                {member.name && member.email && (
                                    <p style={{
                                        margin: '4px 0 0',
                                        fontSize: '12px',
                                        color: '#888',
                                    }}>
                                        {member.email}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '16px',
                        width: '100%',
                        padding: '14px',
                        border: 'none',
                        borderRadius: '12px',
                        backgroundColor: '#F0F0F0',
                        color: '#666',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
};

export default RecipientSelector;

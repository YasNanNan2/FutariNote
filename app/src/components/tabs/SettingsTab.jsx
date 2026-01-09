import { useState } from 'react';
import { COLORS } from '../../constants';

const SettingsTab = ({ currentUser, partner, onUpdateUser, showNotification }) => {
    const [editName, setEditName] = useState(currentUser?.name || '');
    const [editColor, setEditColor] = useState(currentUser?.color || '#FF6B9D');
    const [notifications, setNotifications] = useState(true);

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <h2 style={{ margin: '0 0 24px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                ⚙️ 設定
            </h2>

            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>👤 プロフィール</h3>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                        ニックネーム
                    </label>
                    <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #EEE',
                            borderRadius: '12px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
                        テーマカラー
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setEditColor(color)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    border: editColor === color ? '3px solid #333' : '3px solid transparent',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {
                        onUpdateUser({ name: editName, color: editColor });
                        showNotification('プロフィールを更新しました', 'success');
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                        color: '#FFF',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    保存
                </button>
            </div>

            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>🔔 通知設定</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>プッシュ通知</span>
                    <button
                        onClick={() => setNotifications(!notifications)}
                        style={{
                            width: '50px',
                            height: '28px',
                            borderRadius: '14px',
                            border: 'none',
                            backgroundColor: notifications ? '#4ECDC4' : '#DDD',
                            cursor: 'pointer',
                            position: 'relative',
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#FFF',
                            position: 'absolute',
                            top: '2px',
                            left: notifications ? '24px' : '2px',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }} />
                    </button>
                </div>
            </div>

            {partner && (
                <div style={{
                    backgroundColor: '#FFF',
                    borderRadius: '20px',
                    padding: '20px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>💑 連携情報</h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#F8F8F8',
                        borderRadius: '12px',
                    }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: partner.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF',
                            fontWeight: 'bold',
                        }}>
                            {partner.name[0]}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{partner.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>連携中</p>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#E55' }}>⚠️ 危険な操作</h3>
                <button
                    onClick={() => {
                        if (window.confirm('本当にすべてのデータを削除しますか？')) {
                            localStorage.removeItem('futariNote');
                            window.location.reload();
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E55',
                        borderRadius: '12px',
                        backgroundColor: 'transparent',
                        color: '#E55',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    アカウントを削除
                </button>
            </div>
        </div>
    );
};

export default SettingsTab;

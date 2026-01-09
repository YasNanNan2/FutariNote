import { useState } from 'react';
import { COLORS } from '../../constants';
import InviteFlow from '../onboarding/InviteFlow';

const SettingsTab = ({ currentUser, partner, onUpdateUser, onSignOut, onDeleteAccount, showNotification, refreshAuth }) => {
    const [editName, setEditName] = useState(currentUser?.name || '');
    const [editColor, setEditColor] = useState(currentUser?.color || '#FF6B9D');
    const [showInviteFlow, setShowInviteFlow] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await onUpdateUser({ name: editName, color: editColor });
            if (success && refreshAuth) {
                await refreshAuth();
            }
            showNotification('プロフィールを更新しました', 'success');
        } catch {
            showNotification('更新に失敗しました', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const success = await onDeleteAccount();
            if (success) {
                showNotification('アカウントを削除しました', 'success');
            } else {
                showNotification('削除に失敗しました', 'error');
                setShowDeleteConfirm(false);
            }
        } catch {
            showNotification('削除に失敗しました', 'error');
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    if (showInviteFlow) {
        return (
            <InviteFlow
                onComplete={() => {
                    setShowInviteFlow(false);
                    showNotification('パートナーと連携しました！', 'success');
                    window.location.reload();
                }}
                onSkip={() => setShowInviteFlow(false)}
            />
        );
    }

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
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
                        メールアドレス
                    </label>
                    <input
                        type="text"
                        value={currentUser?.email || ''}
                        disabled
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #EEE',
                            borderRadius: '12px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                            backgroundColor: '#F8F8F8',
                            color: '#888',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                        ニックネーム
                    </label>
                    <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="ニックネームを入力"
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
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '12px',
                        background: saving ? '#CCC' : 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                        color: '#FFF',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                >
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>

            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>💑 パートナー連携</h3>
                {partner ? (
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
                            backgroundColor: partner.color || '#4ECDC4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF',
                            fontWeight: 'bold',
                        }}>
                            {(partner.name || partner.email)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{partner.name || partner.email}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>連携中</p>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowInviteFlow(true)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px dashed #DDD',
                            borderRadius: '12px',
                            backgroundColor: 'transparent',
                            color: '#666',
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        パートナーを招待する
                    </button>
                )}
            </div>

            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#E55' }}>⚠️ アカウント</h3>
                <button
                    onClick={onSignOut}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E55',
                        borderRadius: '12px',
                        backgroundColor: 'transparent',
                        color: '#E55',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '12px',
                    }}
                >
                    ログアウト
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '12px',
                        backgroundColor: '#E55',
                        color: '#FFF',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    アカウントを削除
                </button>
            </div>

            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                }}>
                    <div style={{
                        backgroundColor: '#FFF',
                        borderRadius: '20px',
                        padding: '24px',
                        margin: '20px',
                        maxWidth: '320px',
                        textAlign: 'center',
                    }}>
                        <h3 style={{ margin: '0 0 12px', color: '#E55' }}>⚠️ アカウント削除</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#666' }}>
                            この操作は取り消せません。<br />本当に削除しますか？
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '2px solid #DDD',
                                    borderRadius: '12px',
                                    backgroundColor: '#FFF',
                                    color: '#666',
                                    fontSize: '14px',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    backgroundColor: deleting ? '#CCC' : '#E55',
                                    color: '#FFF',
                                    fontSize: '14px',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {deleting ? '削除中...' : '削除する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsTab;

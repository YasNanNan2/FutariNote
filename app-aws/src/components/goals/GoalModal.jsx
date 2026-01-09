import { useState } from 'react';
import { GOAL_ICONS } from '../../constants';

const GoalModal = ({ goal, onSave, onDelete, onClose, loading }) => {
    const isEditing = goal && goal.id; // prefillDeadlineのみの場合は新規作成
    const [title, setTitle] = useState(isEditing ? goal.title : '');
    const [deadline, setDeadline] = useState(goal?.prefillDeadline || goal?.deadline || '');
    const [icon, setIcon] = useState(
        isEditing && goal?.icon
            ? (typeof goal.icon === 'string'
                ? GOAL_ICONS.find(i => i.emoji === goal.icon || i.id === goal.icon) || GOAL_ICONS[0]
                : goal.icon)
            : GOAL_ICONS[0]
    );
    const [targetAmount, setTargetAmount] = useState(isEditing ? (goal?.targetAmount || '') : '');
    const [currentAmount, setCurrentAmount] = useState(isEditing ? (goal?.currentAmount || 0) : 0);

    const handleSave = () => {
        if (!title || !deadline) return;
        onSave({
            title,
            deadline,
            icon: icon.emoji,
            targetAmount: targetAmount ? parseInt(targetAmount, 10) : null,
            currentAmount: currentAmount ? parseInt(currentAmount, 10) : 0,
        });
    };

    // 金額をフォーマット（カンマ区切り）
    const formatAmount = (value) => {
        if (!value) return '';
        return parseInt(value, 10).toLocaleString();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '400px',
                animation: 'popIn 0.3s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    {isEditing ? '🎯 目標を編集' : '🎯 新しい目標'}
                </h3>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
                        アイコン
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {GOAL_ICONS.map(i => (
                            <button
                                key={i.id}
                                onClick={() => setIcon(i)}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    border: icon.id === i.id ? '2px solid #FF6B9D' : '2px solid #EEE',
                                    borderRadius: '12px',
                                    backgroundColor: icon.id === i.id ? '#FFF5F7' : '#FFF',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                }}
                            >
                                {i.emoji}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                        目標タイトル
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="例: 沖縄旅行"
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                        期限
                    </label>
                    <input
                        type="date"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
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

                {/* 目標金額（オプション） */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                        💰 目標金額（円）
                    </label>
                    <input
                        type="number"
                        value={targetAmount}
                        onChange={e => setTargetAmount(e.target.value)}
                        placeholder="例: 300000"
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

                {/* 現在の金額（目標金額が設定されている場合のみ表示） */}
                {targetAmount && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                            📊 現在の金額（円）
                        </label>
                        <input
                            type="number"
                            value={currentAmount}
                            onChange={e => setCurrentAmount(e.target.value)}
                            placeholder="0"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #EEE',
                                borderRadius: '12px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                        {/* 進捗バープレビュー */}
                        <div style={{ marginTop: '12px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                color: '#888',
                                marginBottom: '4px',
                            }}>
                                <span>¥{formatAmount(currentAmount)}</span>
                                <span>¥{formatAmount(targetAmount)}</span>
                            </div>
                            <div style={{
                                height: '8px',
                                backgroundColor: '#EEE',
                                borderRadius: '4px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${Math.min(100, (currentAmount / targetAmount) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: '#4ECDC4',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease',
                                }} />
                            </div>
                            <div style={{
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#4ECDC4',
                                fontWeight: 'bold',
                                marginTop: '4px',
                            }}>
                                {Math.round((currentAmount / targetAmount) * 100)}%
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    {isEditing && (
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            style={{
                                padding: '14px 20px',
                                border: 'none',
                                borderRadius: '12px',
                                backgroundColor: '#FEE',
                                color: '#E55',
                                fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            🗑️
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!title || !deadline || loading}
                        style={{
                            flex: 1,
                            padding: '14px',
                            border: 'none',
                            borderRadius: '12px',
                            background: title && deadline && !loading ? 'linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%)' : '#EEE',
                            color: title && deadline && !loading ? '#FFF' : '#999',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: title && deadline && !loading ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {loading ? '保存中...' : isEditing ? '更新する' : '設定する'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalModal;

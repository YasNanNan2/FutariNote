import { useState } from 'react';
import { GOAL_ICONS } from '../../constants';

const GoalModal = ({ goal, onSave, onDelete, onClose }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [amount, setAmount] = useState(goal?.amount || '');
    const [current, setCurrent] = useState(goal?.current || 0);
    const [deadline, setDeadline] = useState(goal?.deadline || '');
    const [icon, setIcon] = useState(goal?.icon || GOAL_ICONS[0]);

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
                    {goal ? '🎯 目標を編集' : '🎯 新しい目標'}
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

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                            目標金額 (円)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="100000"
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
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                            現在の金額 (円)
                        </label>
                        <input
                            type="number"
                            value={current}
                            onChange={e => setCurrent(e.target.value)}
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
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
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

                <div style={{ display: 'flex', gap: '12px' }}>
                    {goal && (
                        <button
                            onClick={onDelete}
                            style={{
                                padding: '14px 20px',
                                border: 'none',
                                borderRadius: '12px',
                                backgroundColor: '#FEE',
                                color: '#E55',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            🗑️
                        </button>
                    )}
                    <button
                        onClick={() => title && amount && onSave({
                            title,
                            amount: Number(amount),
                            current: Number(current),
                            deadline,
                            icon
                        })}
                        disabled={!title || !amount}
                        style={{
                            flex: 1,
                            padding: '14px',
                            border: 'none',
                            borderRadius: '12px',
                            background: title && amount ? 'linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%)' : '#EEE',
                            color: title && amount ? '#FFF' : '#999',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: title && amount ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {goal ? '更新する' : '設定する'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalModal;

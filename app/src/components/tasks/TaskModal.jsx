import { useState } from 'react';
import { CATEGORIES } from '../../constants';

const TaskModal = ({ task, currentUser, partner, onSave, onDelete, onClose }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [date, setDate] = useState(task?.date || new Date().toISOString().split('T')[0]);
    const [assignee, setAssignee] = useState(task?.assignee || currentUser?.name);
    const [category, setCategory] = useState(task?.category || 'other');

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                animation: 'slideUp 0.3s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    {task ? '📝 タスクを編集' : '✨ 新しいタスク'}
                </h3>

                <div style={{ marginBottom: '16px' }}>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="タスク名を入力..."
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #EEE',
                            borderRadius: '12px',
                            fontSize: '16px',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                        autoFocus
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                            📅 日付
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
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
                            👤 担当
                        </label>
                        <select
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #EEE',
                                borderRadius: '12px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        >
                            <option value={currentUser?.name}>{currentUser?.name}</option>
                            {partner && <option value={partner.name}>{partner.name}</option>}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
                        🏷️ カテゴリ
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                style={{
                                    padding: '8px 16px',
                                    border: category === cat.id ? `2px solid ${cat.color}` : '2px solid #EEE',
                                    borderRadius: '20px',
                                    backgroundColor: category === cat.id ? `${cat.color}20` : '#FFF',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {task && (
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
                            🗑️ 削除
                        </button>
                    )}
                    <button
                        onClick={() => title && onSave({ title, date, assignee, category })}
                        disabled={!title}
                        style={{
                            flex: 1,
                            padding: '14px',
                            border: 'none',
                            borderRadius: '12px',
                            background: title ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)' : '#EEE',
                            color: title ? '#FFF' : '#999',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: title ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {task ? '更新する' : '追加する'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;

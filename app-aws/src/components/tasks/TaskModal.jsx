import { useState } from 'react';
import { CATEGORIES } from '../../constants';

const TaskModal = ({ task, currentUser, partner, onSave, onDelete, onClose, loading }) => {
    const isEditing = task && task.id; // prefillDateのみの場合は新規作成
    const [title, setTitle] = useState(isEditing ? task.title : '');
    const [date, setDate] = useState(task?.prefillDate || task?.date || new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(task?.category || 'OTHER');

    // 既存タスクのassigneeをuserIdに変換（古いニックネームで保存されている場合への対応）
    const resolveAssigneeToUserId = (assigneeValue) => {
        if (!assigneeValue) return currentUser?.userId;

        // 既にuserIdの場合はそのまま
        if (assigneeValue === currentUser?.userId) return currentUser?.userId;
        if (partner && assigneeValue === partner.userId) return partner.userId;

        // 自分のname/emailの場合はuserIdに変換
        if (assigneeValue === currentUser?.name || assigneeValue === currentUser?.email) {
            return currentUser?.userId;
        }
        // パートナーのname/emailの場合はパートナーのuserIdに変換
        if (partner && (assigneeValue === partner.name || assigneeValue === partner.email)) {
            return partner.userId;
        }

        // 不明な値（古いニックネーム等）の場合はデフォルトで自分を選択
        return currentUser?.userId;
    };

    const [assignee, setAssignee] = useState(resolveAssigneeToUserId(task?.assignee));

    const handleSave = () => {
        if (!title) return;
        onSave({
            title,
            date,
            assignee,
            category: category.toUpperCase(),
        });
    };

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
                    {isEditing ? '📝 タスクを編集' : '✨ 新しいタスク'}
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
                            <option value={currentUser?.userId}>
                                {currentUser?.name || currentUser?.email}
                            </option>
                            {partner && (
                                <option value={partner.userId}>
                                    {partner.name || partner.email}
                                </option>
                            )}
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
                                onClick={() => setCategory(cat.id.toUpperCase())}
                                style={{
                                    padding: '8px 16px',
                                    border: category.toLowerCase() === cat.id ? `2px solid ${cat.color}` : '2px solid #EEE',
                                    borderRadius: '20px',
                                    backgroundColor: category.toLowerCase() === cat.id ? `${cat.color}20` : '#FFF',
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
                            🗑️ 削除
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!title || loading}
                        style={{
                            flex: 1,
                            padding: '14px',
                            border: 'none',
                            borderRadius: '12px',
                            background: title && !loading ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)' : '#EEE',
                            color: title && !loading ? '#FFF' : '#999',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: title && !loading ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {loading ? '保存中...' : isEditing ? '更新する' : '追加する'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;

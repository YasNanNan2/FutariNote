import { useState, useMemo } from 'react';
import { CATEGORIES } from '../../constants';
import { formatDate } from '../../utils';

// 日付をYYYY-MM-DD形式で取得
const toDateString = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 週の開始日（日曜）を取得
const getWeekStart = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return toDateString(d);
};

const TasksTab = ({
    currentUser,
    otherMembers = [],
    tasks,
    filter,
    setFilter,
    setShowStampSelector,
    setEditingTask,
    setShowTaskModal,
    completeTask,
    undoComplete,
    loading,
    thankedTaskIds = new Set(),
}) => {
    const [taskTab, setTaskTab] = useState('incomplete');

    const isMyAssignee = (assignee) => {
        return assignee === currentUser?.userId ||
               assignee === currentUser?.name ||
               assignee === currentUser?.email;
    };

    const getAssigneeName = (assignee) => {
        if (isMyAssignee(assignee)) {
            return currentUser?.name || currentUser?.email;
        }
        // 他メンバーから該当者を探す
        const matchedMember = otherMembers.find(m =>
            assignee === m.userId || assignee === m.name || assignee === m.email
        );
        if (matchedMember) {
            return matchedMember.name || matchedMember.email;
        }
        return assignee;
    };

    const getAssigneeColor = (assignee) => {
        if (isMyAssignee(assignee)) {
            return currentUser?.color || '#FF6B9D';
        }
        // 他メンバーから該当者を探す
        const matchedMember = otherMembers.find(m =>
            assignee === m.userId || assignee === m.name || assignee === m.email
        );
        if (matchedMember) {
            return matchedMember.color || '#4ECDC4';
        }
        return '#888';
    };

    const incompleteTasks = (filter === 'mine'
        ? tasks.filter(t => !t.completed && isMyAssignee(t.assignee))
        : tasks.filter(t => !t.completed)
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const completedTasks = tasks
        .filter(t => t.completed)
        .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));

    const groupedTasks = useMemo(() => {
        const today = toDateString(new Date());
        const tomorrow = toDateString(new Date(Date.now() + 86400000));
        const thisWeekStart = getWeekStart(new Date());

        const groups = {
            overdue: { label: '🔴 期限切れ', tasks: [], color: '#FF4757' },
            today: { label: '📍 今日', tasks: [], color: '#FF6B9D' },
            tomorrow: { label: '📅 明日', tasks: [], color: '#FFA502' },
            thisWeek: { label: '📆 今週', tasks: [], color: '#3742FA' },
            later: { label: '🗓️ 来週以降', tasks: [], color: '#888' },
        };

        incompleteTasks.forEach(task => {
            const taskDate = task.date;
            if (taskDate < today) {
                groups.overdue.tasks.push(task);
            } else if (taskDate === today) {
                groups.today.tasks.push(task);
            } else if (taskDate === tomorrow) {
                groups.tomorrow.tasks.push(task);
            } else if (getWeekStart(taskDate) === thisWeekStart) {
                groups.thisWeek.tasks.push(task);
            } else {
                groups.later.tasks.push(task);
            }
        });

        return groups;
    }, [incompleteTasks]);

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    ✅ タスク
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'mine'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px', border: 'none', borderRadius: '16px',
                                backgroundColor: filter === f ? '#FF6B9D' : '#F0F0F0',
                                color: filter === f ? '#FFF' : '#666', fontSize: '13px', cursor: 'pointer',
                                fontWeight: filter === f ? 'bold' : 'normal',
                            }}
                        >
                            {f === 'all' ? 'すべて' : '自分'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0', marginBottom: '16px', backgroundColor: '#F0F0F0', borderRadius: '12px', padding: '4px' }}>
                <button
                    onClick={() => setTaskTab('incomplete')}
                    style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        backgroundColor: taskTab === 'incomplete' ? '#FFF' : 'transparent',
                        color: taskTab === 'incomplete' ? '#333' : '#888',
                        fontSize: '14px', cursor: 'pointer', fontWeight: taskTab === 'incomplete' ? 'bold' : 'normal',
                        boxShadow: taskTab === 'incomplete' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                >
                    未完了 ({incompleteTasks.length})
                </button>
                <button
                    onClick={() => setTaskTab('completed')}
                    style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        backgroundColor: taskTab === 'completed' ? '#FFF' : 'transparent',
                        color: taskTab === 'completed' ? '#333' : '#888',
                        fontSize: '14px', cursor: 'pointer', fontWeight: taskTab === 'completed' ? 'bold' : 'normal',
                        boxShadow: taskTab === 'completed' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                >
                    完了済み ({completedTasks.length})
                </button>
            </div>

            {loading && <p style={{ textAlign: 'center', color: '#888', fontSize: '13px' }}>読み込み中...</p>}

            {taskTab === 'incomplete' && (
                incompleteTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎊</div>
                        <p style={{ margin: 0, fontSize: '16px' }}>すべてのタスクが完了しました！</p>
                    </div>
                ) : (
                    Object.entries(groupedTasks).map(([key, group]) => (
                        group.tasks.length > 0 && (
                            <div key={key} style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    marginBottom: '10px', paddingBottom: '6px',
                                    borderBottom: `2px solid ${group.color}20`,
                                }}>
                                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: group.color }}>
                                        {group.label}
                                    </span>
                                    <span style={{
                                        fontSize: '12px', color: '#FFF', backgroundColor: group.color,
                                        padding: '2px 10px', borderRadius: '10px',
                                    }}>
                                        {group.tasks.length}
                                    </span>
                                </div>
                                {group.tasks.map(task => {
                                    const cat = CATEGORIES.find(c => c.id === task.category?.toLowerCase());
                                    const isOverdue = key === 'overdue';
                                    return (
                                        <div
                                            key={task.id}
                                            style={{
                                                backgroundColor: isOverdue ? '#FFF5F5' : '#FFF',
                                                borderRadius: '12px', padding: '14px',
                                                marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                borderLeft: `4px solid ${getAssigneeColor(task.assignee)}`,
                                            }}
                                        >
                                            <button
                                                onClick={() => completeTask(task.id)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    border: '2px solid #DDD', backgroundColor: 'transparent',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', flexShrink: 0, fontSize: '14px', color: '#CCC',
                                                }}
                                            >
                                                ✓
                                            </button>
                                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '16px' }}>{cat?.icon || '📌'}</span>
                                                    <h3 style={{ margin: 0, fontSize: '15px', color: isOverdue ? '#FF4757' : '#333' }}>
                                                        {task.title}
                                                    </h3>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px', color: isOverdue ? '#FF4757' : '#888' }}>
                                                    <span>📅 {formatDate(task.date)}</span>
                                                    <span>👤 {getAssigneeName(task.assignee)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ))
                )
            )}

            {taskTab === 'completed' && (
                completedTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>まだ完了したタスクがありません</p>
                    </div>
                ) : (
                    completedTasks.map(task => {
                        const cat = CATEGORIES.find(c => c.id === task.category?.toLowerCase());
                        const isThanked = thankedTaskIds.has(task.id);
                        return (
                            <div
                                key={task.id}
                                style={{
                                    backgroundColor: '#F8F8F8', borderRadius: '12px', padding: '14px',
                                    marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px',
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    backgroundColor: '#4ECDC4', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: '#FFF', flexShrink: 0, fontSize: '14px',
                                }}>
                                    ✓
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '16px' }}>{cat?.icon || '📌'}</span>
                                        <h3 style={{ margin: 0, fontSize: '15px', color: '#888' }}>
                                            {task.title}
                                        </h3>
                                        {isThanked && (
                                            <span style={{
                                                fontSize: '10px',
                                                backgroundColor: '#FFE4EC',
                                                color: '#FF6B9D',
                                                padding: '2px 6px',
                                                borderRadius: '8px',
                                                fontWeight: 'bold',
                                            }}>
                                                💝 感謝済み
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#AAA', marginTop: '4px' }}>
                                        👤 {getAssigneeName(task.assignee)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {!isThanked && (
                                        <button
                                            onClick={() => setShowStampSelector(task.id)}
                                            style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#FFE4EC', fontSize: '16px', cursor: 'pointer' }}
                                        >
                                            💝
                                        </button>
                                    )}
                                    <button
                                        onClick={() => undoComplete(task.id)}
                                        style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#EEE', fontSize: '14px', cursor: 'pointer' }}
                                    >
                                        ↩️
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )
            )}
        </div>
    );
};

export default TasksTab;

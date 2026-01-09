import { CATEGORIES } from '../../constants';
import { formatDate, formatFullDate } from '../../utils';

const HomeTab = ({
    currentUser,
    partner,
    tasks,
    goals,
    thanksCount,
    filter,
    setFilter,
    setShowGoalModal,
    setShowStampSelector,
    setEditingGoal,
    setEditingTask,
    setShowTaskModal,
    completeTask,
    undoComplete,
}) => {
    const myTasks = filter === 'mine'
        ? tasks.filter(t => !t.completed && t.assignee === currentUser?.name)
        : tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed).slice(0, 5);

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                        こんにちは、{currentUser?.name} さん 👋
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>
                        {formatFullDate(new Date())}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: currentUser?.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FFF', fontWeight: 'bold',
                    }}>
                        {currentUser?.name?.[0]}
                    </div>
                    {partner && (
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: partner.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FFF', fontWeight: 'bold',
                            marginLeft: '-16px', border: '2px solid #FFF',
                        }}>
                            {partner.name?.[0]}
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #FFE66D 0%, #F8B500 100%)',
                borderRadius: '20px', padding: '20px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(248, 181, 0, 0.2)',
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>💝 Thanks Count</p>
                    <p style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: 'bold' }}>{thanksCount}</p>
                </div>
                <div style={{ fontSize: '48px' }}>🎉</div>
            </div>

            {goals.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '16px' }}>🎯 目標</h2>
                        <button
                            onClick={() => setShowGoalModal(true)}
                            style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#F0F0F0', fontSize: '12px', cursor: 'pointer' }}
                        >
                            + 追加
                        </button>
                    </div>
                    {goals.map(goal => {
                        const progress = Math.min((goal.current / goal.amount) * 100, 100);
                        return (
                            <div
                                key={goal.id}
                                onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                                style={{
                                    backgroundColor: '#FFF', borderRadius: '16px', padding: '16px',
                                    marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '28px' }}>{goal.icon.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, fontSize: '16px' }}>{goal.title}</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                                            {goal.deadline && `期限: ${formatDate(goal.deadline)}`}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#4ECDC4' }}>
                                            {goal.current.toLocaleString()}円
                                        </p>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                                            / {goal.amount.toLocaleString()}円
                                        </p>
                                    </div>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${progress}%`, height: '100%',
                                        background: 'linear-gradient(90deg, #4ECDC4 0%, #95E1D3 100%)',
                                        borderRadius: '4px', transition: 'width 0.5s ease-out',
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {goals.length === 0 && (
                <button
                    onClick={() => setShowGoalModal(true)}
                    style={{
                        width: '100%', padding: '20px', border: '2px dashed #DDD', borderRadius: '16px',
                        backgroundColor: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '24px',
                    }}
                >
                    🎯 共通の目標を設定する
                </button>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['all', 'mine'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '8px 16px', border: 'none', borderRadius: '20px',
                            backgroundColor: filter === f ? '#FF6B9D' : '#F0F0F0',
                            color: filter === f ? '#FFF' : '#666', fontSize: '13px', cursor: 'pointer',
                        }}
                    >
                        {f === 'all' ? 'すべて' : '自分の担当'}
                    </button>
                ))}
            </div>

            <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>📋 未完了タスク ({myTasks.length})</h2>

            {myTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎊</div>
                    <p>すべてのタスクが完了しました！</p>
                </div>
            ) : (
                myTasks.map(task => {
                    const cat = CATEGORIES.find(c => c.id === task.category);
                    const isMyTask = task.assignee === currentUser?.name;
                    return (
                        <div
                            key={task.id}
                            style={{
                                backgroundColor: '#FFF', borderRadius: '16px', padding: '16px',
                                marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                borderLeft: `4px solid ${isMyTask ? currentUser?.color : partner?.color || '#888'}`,
                            }}
                        >
                            <button
                                onClick={() => completeTask(task.id)}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    border: '2px solid #DDD', backgroundColor: 'transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                }}
                            >
                                ✓
                            </button>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px' }}>{cat?.icon}</span>
                                    <h3 style={{ margin: 0, fontSize: '15px' }}>{task.title}</h3>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: '#888' }}>
                                    <span>📅 {formatDate(task.date)}</span>
                                    <span>👤 {task.assignee}</span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {completedTasks.length > 0 && (
                <>
                    <h2 style={{ margin: '24px 0 12px', fontSize: '16px' }}>✅ 完了済み</h2>
                    {completedTasks.map(task => {
                        const cat = CATEGORIES.find(c => c.id === task.category);
                        return (
                            <div
                                key={task.id}
                                style={{
                                    backgroundColor: '#F8F8F8', borderRadius: '16px', padding: '16px',
                                    marginBottom: '12px', display: 'flex', alignItems: 'center',
                                    gap: '12px', opacity: 0.7,
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    backgroundColor: '#4ECDC4', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: '#FFF', flexShrink: 0,
                                }}>
                                    ✓
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px' }}>{cat?.icon}</span>
                                        <h3 style={{ margin: 0, fontSize: '15px', textDecoration: 'line-through', color: '#888' }}>
                                            {task.title}
                                        </h3>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setShowStampSelector(task.id)}
                                        style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#FFE4EC', fontSize: '14px', cursor: 'pointer' }}
                                    >
                                        💝
                                    </button>
                                    <button
                                        onClick={() => undoComplete(task.id)}
                                        style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#EEE', fontSize: '12px', cursor: 'pointer' }}
                                    >
                                        ↩️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default HomeTab;

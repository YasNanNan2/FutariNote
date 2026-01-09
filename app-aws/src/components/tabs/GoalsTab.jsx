import { useState } from 'react';
import { GOAL_ICONS } from '../../constants';
import { formatDate } from '../../utils';

const GoalsTab = ({
    goals,
    setShowGoalModal,
    setEditingGoal,
    achieveGoal,
    unachieveGoal,
    loading,
}) => {
    const [viewTab, setViewTab] = useState('active'); // 'active' | 'achieved'

    // 目標を進行中と達成済みに分類
    const activeGoals = goals.filter(g => !g.achieved);
    const achievedGoals = goals.filter(g => g.achieved);

    const getGoalIcon = (goal) => {
        if (typeof goal.icon === 'string') {
            const found = GOAL_ICONS.find(i => i.emoji === goal.icon || i.id === goal.icon);
            return found?.emoji || goal.icon;
        }
        return goal.icon?.emoji || '🎯';
    };

    // 進捗率を計算（目標金額と現在金額がある場合）
    const getProgress = (goal) => {
        if (goal.targetAmount && goal.currentAmount !== undefined) {
            return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
        }
        return null;
    };

    // 金額をフォーマット（カンマ区切り）
    const formatAmount = (value) => {
        if (!value && value !== 0) return '0';
        return parseInt(value, 10).toLocaleString();
    };

    // 期限までの日数を計算
    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const diff = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    🎯 ふたりの目標
                </h1>
                <button
                    onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                    style={{
                        padding: '8px 16px', border: 'none', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                        color: '#FFF', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255, 107, 157, 0.3)',
                    }}
                >
                    + 追加
                </button>
            </div>

            {/* タブ切り替え */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', backgroundColor: '#F0F0F0', borderRadius: '12px', padding: '4px' }}>
                <button
                    onClick={() => setViewTab('active')}
                    style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        backgroundColor: viewTab === 'active' ? '#FFF' : 'transparent',
                        color: viewTab === 'active' ? '#333' : '#888',
                        fontSize: '14px', cursor: 'pointer', fontWeight: viewTab === 'active' ? 'bold' : 'normal',
                        boxShadow: viewTab === 'active' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                >
                    進行中 ({activeGoals.length})
                </button>
                <button
                    onClick={() => setViewTab('achieved')}
                    style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        backgroundColor: viewTab === 'achieved' ? '#FFF' : 'transparent',
                        color: viewTab === 'achieved' ? '#333' : '#888',
                        fontSize: '14px', cursor: 'pointer', fontWeight: viewTab === 'achieved' ? 'bold' : 'normal',
                        boxShadow: viewTab === 'achieved' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                >
                    達成済み ({achievedGoals.length})
                </button>
            </div>

            {loading && <p style={{ textAlign: 'center', color: '#888' }}>読み込み中...</p>}

            {/* 進行中の目標 */}
            {viewTab === 'active' && (
                activeGoals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎯</div>
                        <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 'bold', color: '#666' }}>
                            まだ目標がありません
                        </p>
                        <p style={{ margin: '0 0 20px', fontSize: '14px' }}>
                            ふたりで達成したい目標を設定しましょう
                        </p>
                        <button
                            onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                            style={{
                                padding: '12px 24px', border: '2px dashed #DDD', borderRadius: '12px',
                                backgroundColor: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer',
                            }}
                        >
                            + 目標を追加する
                        </button>
                    </div>
                ) : (
                    activeGoals.map(goal => {
                        const progress = getProgress(goal);
                        const daysRemaining = getDaysRemaining(goal.deadline);

                        return (
                            <div
                                key={goal.id}
                                style={{
                                    backgroundColor: '#FFF', borderRadius: '16px', padding: '20px',
                                    marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                    transition: 'transform 0.2s',
                                }}
                            >
                                <div
                                    onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer' }}
                                >
                                    <span style={{ fontSize: '36px' }}>{getGoalIcon(goal)}</span>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 'bold' }}>
                                            {goal.title}
                                        </h3>

                                        {/* 期限表示 */}
                                        {goal.deadline && (
                                            <p style={{ margin: '0 0 12px', fontSize: '13px', color: daysRemaining < 7 ? '#E55' : '#888' }}>
                                                📅 {formatDate(goal.deadline)}
                                                {daysRemaining !== null && (
                                                    <span style={{ marginLeft: '8px' }}>
                                                        {daysRemaining < 0 ? '(期限切れ)' :
                                                         daysRemaining === 0 ? '(今日まで)' :
                                                         `(あと${daysRemaining}日)`}
                                                    </span>
                                                )}
                                            </p>
                                        )}

                                        {/* 進捗バー（目標金額がある場合） */}
                                        {progress !== null && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                                    <span style={{ color: '#888' }}>
                                                        ¥{formatAmount(goal.currentAmount)} / ¥{formatAmount(goal.targetAmount)}
                                                    </span>
                                                    <span style={{ fontWeight: 'bold', color: '#FF6B9D' }}>{progress}%</span>
                                                </div>
                                                <div style={{
                                                    height: '8px', backgroundColor: '#F0F0F0', borderRadius: '4px', overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%', width: `${progress}%`,
                                                        background: 'linear-gradient(90deg, #FF6B9D 0%, #4ECDC4 100%)',
                                                        borderRadius: '4px', transition: 'width 0.3s',
                                                    }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* メモ */}
                                        {goal.memo && (
                                            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>
                                                {goal.memo}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 達成ボタン */}
                                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); achieveGoal(goal); }}
                                        style={{
                                            padding: '10px 20px',
                                            border: 'none',
                                            borderRadius: '20px',
                                            background: 'linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%)',
                                            color: '#FFF',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
                                        }}
                                    >
                                        🎉 達成！
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )
            )}

            {/* 達成済みの目標 */}
            {viewTab === 'achieved' && (
                achievedGoals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🏆</div>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            まだ達成した目標がありません
                        </p>
                        <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                            目標を達成すると、ここに表示されます
                        </p>
                    </div>
                ) : (
                    achievedGoals.map(goal => (
                        <div
                            key={goal.id}
                            style={{
                                backgroundColor: '#F8FFF8', borderRadius: '16px', padding: '16px',
                                marginBottom: '12px', border: '2px solid #4ECDC4',
                            }}
                        >
                            <div
                                onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                            >
                                <span style={{ fontSize: '28px' }}>🎉</span>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                                        {goal.title}
                                    </h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#4ECDC4' }}>
                                        {goal.achievedAt ? `${formatDate(goal.achievedAt)} 達成` : '達成済み'}
                                    </p>
                                </div>
                                <span style={{ fontSize: '24px' }}>{getGoalIcon(goal)}</span>
                            </div>
                            {/* 達成取り消しボタン */}
                            <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); unachieveGoal(goal); }}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #CCC',
                                        borderRadius: '12px',
                                        backgroundColor: '#FFF',
                                        color: '#888',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    達成を取り消す
                                </button>
                            </div>
                        </div>
                    ))
                )
            )}
        </div>
    );
};

export default GoalsTab;

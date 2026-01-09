import { CATEGORIES } from '../../constants';
import { formatFullDate } from '../../utils';

// 相対時間を返す
const getRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP');
};

// スタンプ種類から絵文字を取得
const getStampEmoji = (stampType) => {
    const stamps = {
        LOVE: '💝',
        THANKS: '🙏',
        STAR: '⭐',
        MUSCLE: '💪',
        SPARKLE: '✨',
        HEART: '❤️',
    };
    return stamps[stampType?.toUpperCase()] || '💝';
};

const HomeTab = ({
    currentUser,
    partner,
    tasks,
    weeklyStampCount,
    timeline,
    setShowStampSelector,
    thankedTaskIds = new Set(),
    receivedStamps = [],
    onSettingsClick,
}) => {
    // パートナーが担当かどうか判定
    const isPartnerAssignee = (assignee) => {
        if (!partner) return false;
        return assignee === partner.userId ||
               assignee === partner.name ||
               assignee === partner.email;
    };

    // assigneeからニックネームを取得
    const getAssigneeName = (assignee) => {
        if (assignee === currentUser?.userId || assignee === currentUser?.name || assignee === currentUser?.email) {
            return currentUser?.name || currentUser?.email;
        }
        if (partner && (assignee === partner.userId || assignee === partner.name || assignee === partner.email)) {
            return partner.name || partner.email;
        }
        return assignee;
    };

    // assigneeの色を取得
    const getAssigneeColor = (assignee) => {
        if (assignee === currentUser?.userId || assignee === currentUser?.name || assignee === currentUser?.email) {
            return currentUser?.color || '#FF6B9D';
        }
        if (partner && (assignee === partner.userId || assignee === partner.name || assignee === partner.email)) {
            return partner.color || '#4ECDC4';
        }
        return '#888';
    };

    // 完了済みタスク
    const completedTasks = tasks
        .filter(t => t.completed)
        .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));

    // パートナーの最近完了タスク（感謝を送りやすく）- 感謝済みは除外
    const partnerRecentCompletions = completedTasks
        .filter(t => isPartnerAssignee(t.assignee) && !thankedTaskIds.has(t.id))
        .slice(0, 3);

    // 最近の活動（タイムライン）
    const recentActivities = [
        ...timeline.slice(0, 5),
        ...completedTasks.slice(0, 3).map(t => ({
            id: `task-${t.id}`,
            type: 'task_completed',
            timestamp: t.completedAt || t.updatedAt,
            user: getAssigneeName(t.assignee),
            userColor: getAssigneeColor(t.assignee),
            details: `「${t.title}」を完了`,
        })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                        こんにちは、{currentUser?.name || currentUser?.email?.split('@')[0]} さん 👋
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                        {formatFullDate(new Date())}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: currentUser?.color || '#FF6B9D',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FFF', fontWeight: 'bold', fontSize: '14px',
                        }}>
                            {(currentUser?.name || currentUser?.email)?.[0]?.toUpperCase()}
                        </div>
                        {partner && (
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                backgroundColor: partner.color || '#4ECDC4',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#FFF', fontWeight: 'bold', fontSize: '14px',
                                marginLeft: '-12px', border: '2px solid #FFF',
                            }}>
                                {(partner.name || partner.email)?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onSettingsClick}
                        style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            border: 'none', backgroundColor: '#F0F0F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', cursor: 'pointer',
                        }}
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {/* 今週の感謝カード */}
            <div
                onClick={() => partner && setShowStampSelector('general')}
                style={{
                    background: 'linear-gradient(135deg, #FFE66D 0%, #F8B500 100%)',
                    borderRadius: '20px', padding: '20px', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: partner ? 'pointer' : 'default',
                    boxShadow: '0 4px 15px rgba(248, 181, 0, 0.3)',
                }}
            >
                <div>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>💝 今週の感謝</p>
                    <p style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: 'bold' }}>{weeklyStampCount}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '40px' }}>🎉</div>
                    {partner && <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>タップで送る</span>}
                </div>
            </div>

            {/* パートナーへの感謝（未感謝の完了タスク） */}
            {partner && partnerRecentCompletions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 'bold' }}>
                        🙏 {partner.name || partner.email}さんへ感謝
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {partnerRecentCompletions.map(task => {
                            const cat = CATEGORIES.find(c => c.id === task.category?.toLowerCase());
                            return (
                                <div
                                    key={task.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '14px', backgroundColor: '#FFF',
                                        borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>{cat?.icon || '✅'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            margin: 0, fontSize: '15px', fontWeight: '500',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {task.title}
                                        </p>
                                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>
                                            {task.completedAt ? getRelativeTime(task.completedAt) : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowStampSelector(task.id); }}
                                        style={{
                                            padding: '10px 18px', border: 'none', borderRadius: '20px',
                                            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                                            color: '#FFF', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(255,107,157,0.3)',
                                        }}
                                    >
                                        💝 感謝
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 受け取った感謝 */}
            {partner && receivedStamps.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 'bold' }}>
                        💌 もらった感謝
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {receivedStamps.slice(0, 5).map((stamp, idx) => {
                            // タスクに対する感謝の場合、タスク情報を取得
                            const relatedTask = stamp.taskId ? tasks.find(t => t.id === stamp.taskId) : null;
                            const cat = relatedTask ? CATEGORIES.find(c => c.id === relatedTask.category?.toLowerCase()) : null;

                            return (
                                <div
                                    key={stamp.id || idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        backgroundColor: '#FFF',
                                        borderRadius: '16px',
                                        padding: '14px 16px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        backgroundColor: partner.color || '#4ECDC4',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#FFF', fontWeight: 'bold', fontSize: '16px', flexShrink: 0,
                                    }}>
                                        {(partner.name || partner.email)?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                                            <span style={{ fontWeight: 'bold' }}>{partner.name || partner.email}</span>
                                            <span style={{ color: '#888' }}> さんから</span>
                                        </p>
                                        {relatedTask ? (
                                            <p style={{
                                                margin: '4px 0 0', fontSize: '13px', color: '#555',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>
                                                {cat?.icon || '✅'} 「{relatedTask.title}」への感謝
                                            </p>
                                        ) : (
                                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
                                                {getRelativeTime(stamp.timestamp)}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                        <div style={{
                                            fontSize: '32px',
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                        }}>
                                            {getStampEmoji(stamp.stampType)}
                                        </div>
                                        {relatedTask && (
                                            <span style={{ fontSize: '10px', color: '#AAA', marginTop: '2px' }}>
                                                {getRelativeTime(stamp.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {receivedStamps.length > 5 && (
                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#888', textAlign: 'center' }}>
                            他 {receivedStamps.length - 5} 件の感謝があります
                        </p>
                    )}
                </div>
            )}

            {/* パートナー未連携時のメッセージ */}
            {!partner && (
                <div style={{
                    backgroundColor: '#FFF',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    textAlign: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>💑</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>パートナーと連携しよう</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                        設定画面からパートナーを招待して、<br />感謝を送り合いましょう
                    </p>
                </div>
            )}

            {/* 最近のできごと */}
            <div>
                <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 'bold' }}>📜 最近のできごと</h2>
                {recentActivities.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '30px 20px', color: '#888',
                        backgroundColor: '#F8F8F8', borderRadius: '14px',
                    }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>まだ活動履歴がありません</p>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#FFF', borderRadius: '14px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden',
                    }}>
                        {recentActivities.map((activity, idx) => (
                            <div
                                key={activity.id || idx}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 16px',
                                    borderBottom: idx < recentActivities.length - 1 ? '1px solid #F0F0F0' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    backgroundColor: activity.userColor || '#888',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#FFF', fontSize: '14px', fontWeight: 'bold', flexShrink: 0,
                                }}>
                                    {activity.user?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>{activity.user}</span>
                                        {' '}{activity.details}
                                    </p>
                                </div>
                                <span style={{ fontSize: '12px', color: '#AAA' }}>
                                    {activity.timestamp && getRelativeTime(activity.timestamp)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeTab;

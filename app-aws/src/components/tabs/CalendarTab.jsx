import { useState, useRef } from 'react';
import { CATEGORIES, GOAL_ICONS } from '../../constants';
import { formatFullDate } from '../../utils';

const CalendarTab = ({
    tasks,
    goals,
    currentUser,
    partner,
    completeTask,
    uncompleteTask,
    onAddTask,
    onAddGoal,
}) => {
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

    // スワイプ用
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    // assigneeが自分かどうか判定
    const isMyAssignee = (assignee) => {
        return assignee === currentUser?.userId ||
               assignee === currentUser?.name ||
               assignee === currentUser?.email;
    };

    // assigneeからニックネームを取得
    const getAssigneeName = (assignee) => {
        if (isMyAssignee(assignee)) {
            return currentUser?.name || currentUser?.email;
        }
        if (partner && (assignee === partner.userId || assignee === partner.name || assignee === partner.email)) {
            return partner.name || partner.email;
        }
        return assignee;
    };

    // assigneeの色を取得
    const getAssigneeColor = (assignee) => {
        if (isMyAssignee(assignee)) {
            return currentUser?.color || '#FF6B9D';
        }
        if (partner && (assignee === partner.userId || assignee === partner.name || assignee === partner.email)) {
            return partner.color || '#4ECDC4';
        }
        return '#888';
    };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();

    // 月表示用の日配列
    const days = [...Array(startWeekday).fill(null), ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)];

    // 週表示用：現在の週の日付を取得
    const getWeekDays = () => {
        const current = new Date(calendarMonth);
        const dayOfWeek = current.getDay();
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - dayOfWeek);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });
    };

    const weekDays = getWeekDays();

    const getTasksForDay = (day, monthOffset = 0) => {
        if (!day) return [];
        const targetYear = monthOffset === 0 ? year : (monthOffset > 0 ? year : year);
        const targetMonth = month + monthOffset;
        const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(t => t.date === dateStr);
    };

    const getTasksForDate = (dateStr) => {
        return tasks.filter(t => t.date === dateStr);
    };

    const getGoalsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return goals.filter(g => g.deadline === dateStr);
    };

    const getGoalsForDate = (dateStr) => {
        return goals.filter(g => g.deadline === dateStr);
    };

    const getGoalIcon = (goal) => {
        if (typeof goal.icon === 'string') {
            const found = GOAL_ICONS.find(i => i.emoji === goal.icon || i.id === goal.icon);
            return found?.emoji || goal.icon;
        }
        return goal.icon?.emoji || '🎯';
    };

    const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isPastDay = (day) => {
        if (!day) return false;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr < todayStr;
    };

    const isPastDate = (dateStr) => dateStr < todayStr;

    // 今日に戻る
    const goToToday = () => {
        setCalendarMonth(new Date());
    };

    // 月移動
    const prevMonth = () => setCalendarMonth(new Date(year, month - 1));
    const nextMonth = () => setCalendarMonth(new Date(year, month + 1));

    // 週移動
    const prevWeek = () => {
        const newDate = new Date(calendarMonth);
        newDate.setDate(newDate.getDate() - 7);
        setCalendarMonth(newDate);
    };
    const nextWeek = () => {
        const newDate = new Date(calendarMonth);
        newDate.setDate(newDate.getDate() + 7);
        setCalendarMonth(newDate);
    };

    // スワイプ処理
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // 左スワイプ → 次へ
                viewMode === 'month' ? nextMonth() : nextWeek();
            } else {
                // 右スワイプ → 前へ
                viewMode === 'month' ? prevMonth() : prevWeek();
            }
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    // タスク完了/取り消し
    const handleToggleComplete = async (task) => {
        const newCompletedState = !task.completed;

        // 先にローカル状態を更新（即座にUIに反映）
        if (selectedDate) {
            const updatedTasks = selectedDate.tasks.map(t =>
                t.id === task.id ? { ...t, completed: newCompletedState } : t
            );
            setSelectedDate({ ...selectedDate, tasks: updatedTasks });
        }

        // APIを呼び出し
        if (newCompletedState) {
            await completeTask(task.id);
        } else {
            await uncompleteTask(task.id);
        }
    };

    // 週表示のヘッダー
    const getWeekHeader = () => {
        const start = weekDays[0];
        const end = weekDays[6];
        if (start.getMonth() === end.getMonth()) {
            return `${start.getFullYear()}年 ${start.getMonth() + 1}月 ${start.getDate()}日〜${end.getDate()}日`;
        }
        return `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;
    };

    return (
        <div
            style={{ padding: '20px', paddingBottom: '100px', overflow: 'hidden' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                    onClick={viewMode === 'month' ? prevMonth : prevWeek}
                    style={{ padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#F0F0F0', cursor: 'pointer', fontSize: '16px' }}
                >
                    ←
                </button>
                <h2 style={{ margin: 0, fontFamily: "'Zen Maru Gothic', sans-serif", fontSize: '18px' }}>
                    {viewMode === 'month' ? `${year}年 ${month + 1}月` : getWeekHeader()}
                </h2>
                <button
                    onClick={viewMode === 'month' ? nextMonth : nextWeek}
                    style={{ padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#F0F0F0', cursor: 'pointer', fontSize: '16px' }}
                >
                    →
                </button>
            </div>

            {/* 今日ボタン & 表示切替 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                    onClick={goToToday}
                    style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                        color: '#FFF',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    📅 今日
                </button>
                <div style={{ display: 'flex', backgroundColor: '#F0F0F0', borderRadius: '12px', padding: '4px' }}>
                    <button
                        onClick={() => setViewMode('month')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: viewMode === 'month' ? '#FFF' : 'transparent',
                            color: viewMode === 'month' ? '#333' : '#888',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'month' ? 'bold' : 'normal',
                        }}
                    >
                        月
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: viewMode === 'week' ? '#FFF' : 'transparent',
                            color: viewMode === 'week' ? '#333' : '#888',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'week' ? 'bold' : 'normal',
                        }}
                    >
                        週
                    </button>
                </div>
            </div>

            {/* 曜日ヘッダー */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                    <div key={d} style={{
                        textAlign: 'center', padding: '8px', fontSize: '12px',
                        color: i === 0 ? '#E55' : i === 6 ? '#55A' : '#888', fontWeight: 'bold',
                    }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* 月表示 */}
            {viewMode === 'month' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {days.map((day, idx) => {
                        const dayTasks = getTasksForDay(day);
                        const dayGoals = getGoalsForDay(day);
                        const weekday = idx % 7;
                        const past = isPastDay(day);

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (day) {
                                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        setSelectedDate({ date: dateStr, tasks: dayTasks, goals: dayGoals });
                                    }
                                }}
                                style={{
                                    aspectRatio: '1',
                                    backgroundColor: day ? (isToday(day) ? '#FF6B9D' : '#FFF') : 'transparent',
                                    borderRadius: '12px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'flex-start', padding: '8px 4px',
                                    cursor: day ? 'pointer' : 'default',
                                    boxShadow: day ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    opacity: past && !isToday(day) ? 0.4 : 1,
                                }}
                            >
                                {day && (
                                    <>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: isToday(day) ? 'bold' : 'normal',
                                            color: isToday(day) ? '#FFF' : weekday === 0 ? '#E55' : weekday === 6 ? '#55A' : '#333',
                                        }}>
                                            {day}
                                        </span>
                                        <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {dayTasks.slice(0, 3).map((t, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                        backgroundColor: t.completed ? '#4ECDC4' : getAssigneeColor(t.assignee),
                                                    }}
                                                />
                                            ))}
                                            {dayGoals.length > 0 && <span style={{ fontSize: '10px' }}>🚩</span>}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 週表示 */}
            {viewMode === 'week' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '2px',
                    width: '100%',
                    boxSizing: 'border-box',
                }}>
                    {weekDays.map((date, idx) => {
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const dayTasks = getTasksForDate(dateStr);
                        const dayGoals = getGoalsForDate(dateStr);
                        const isTodayDate = dateStr === todayStr;
                        const past = isPastDate(dateStr);

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate({ date: dateStr, tasks: dayTasks, goals: dayGoals })}
                                style={{
                                    minHeight: '80px',
                                    backgroundColor: isTodayDate ? '#FFF0F5' : '#FFF',
                                    borderRadius: '8px',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                    border: isTodayDate ? '2px solid #FF6B9D' : '1px solid #EEE',
                                    opacity: past && !isTodayDate ? 0.5 : 1,
                                    overflow: 'hidden',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <div style={{
                                    textAlign: 'center',
                                    marginBottom: '4px',
                                    fontSize: '14px',
                                    fontWeight: isTodayDate ? 'bold' : 'normal',
                                    color: idx === 0 ? '#E55' : idx === 6 ? '#55A' : '#333',
                                }}>
                                    {date.getDate()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {dayTasks.slice(0, 2).map((t, i) => (
                                        <div key={i} style={{
                                            fontSize: '9px',
                                            padding: '1px 2px',
                                            backgroundColor: t.completed ? '#E8F5E9' : `${getAssigneeColor(t.assignee)}20`,
                                            borderRadius: '3px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textDecoration: t.completed ? 'line-through' : 'none',
                                            color: t.completed ? '#888' : '#333',
                                        }}>
                                            {t.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 2 && (
                                        <div style={{ fontSize: '9px', color: '#888', textAlign: 'center' }}>
                                            +{dayTasks.length - 2}
                                        </div>
                                    )}
                                    {dayGoals.map((g, i) => (
                                        <div key={`goal-${i}`} style={{ fontSize: '9px', textAlign: 'center' }}>
                                            🚩
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 選択日のプレビュー（カレンダー下部） */}
            {selectedDate && (
                <div style={{
                    marginTop: '20px',
                    backgroundColor: '#FFF',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                    {/* ヘッダー */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                            📅 {formatFullDate(selectedDate.date)}
                        </h3>
                        <button
                            onClick={() => setSelectedDate(null)}
                            style={{
                                padding: '4px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: '#F0F0F0',
                                color: '#888',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            閉じる
                        </button>
                    </div>

                    {/* 追加ボタン */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button
                            onClick={() => onAddTask(selectedDate.date)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: '2px dashed #FF6B9D',
                                borderRadius: '10px',
                                backgroundColor: '#FFF',
                                color: '#FF6B9D',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            + タスク
                        </button>
                        <button
                            onClick={() => onAddGoal(selectedDate.date)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: '2px dashed #4ECDC4',
                                borderRadius: '10px',
                                backgroundColor: '#FFF',
                                color: '#4ECDC4',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            + 目標
                        </button>
                    </div>

                    {/* 目標期限 */}
                    {selectedDate.goals.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                            {selectedDate.goals.map(goal => (
                                <div key={goal.id} style={{
                                    padding: '10px',
                                    backgroundColor: goal.achieved ? '#E8F5E9' : '#F0FFF4',
                                    borderRadius: '10px',
                                    marginBottom: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <span>{getGoalIcon(goal)}</span>
                                    <span style={{
                                        flex: 1,
                                        fontSize: '14px',
                                        textDecoration: goal.achieved ? 'line-through' : 'none',
                                    }}>
                                        {goal.title}
                                    </span>
                                    {goal.achieved && <span style={{ color: '#4ECDC4', fontSize: '12px' }}>達成</span>}
                                    <span style={{ fontSize: '10px', color: '#888' }}>🚩期限</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* タスク一覧（未完了を上、完了済みを下に） */}
                    {selectedDate.tasks.length > 0 ? (
                        <div>
                            {[...selectedDate.tasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map(task => {
                                const cat = CATEGORIES.find(c => c.id === task.category?.toLowerCase());
                                return (
                                    <div key={task.id} style={{
                                        padding: '10px',
                                        backgroundColor: task.completed ? '#F8F8F8' : '#FFF',
                                        border: '1px solid #EEE',
                                        borderRadius: '10px',
                                        marginBottom: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }}>
                                        {/* チェックボックス */}
                                        <button
                                            onClick={() => handleToggleComplete(task)}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                border: task.completed ? 'none' : `2px solid ${getAssigneeColor(task.assignee)}`,
                                                backgroundColor: task.completed ? '#4ECDC4' : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#FFF',
                                                fontSize: '12px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {task.completed && '✓'}
                                        </button>
                                        <span style={{ fontSize: '16px' }}>{cat?.icon || '📌'}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                textDecoration: task.completed ? 'line-through' : 'none',
                                                color: task.completed ? '#888' : '#333',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {task.title}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>
                                                👤 {getAssigneeName(task.assignee)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : selectedDate.goals.length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center', padding: '16px', fontSize: '14px' }}>
                            この日の予定はありません
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default CalendarTab;

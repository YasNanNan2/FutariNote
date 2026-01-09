import { useState } from 'react';
import { CATEGORIES } from '../../constants';
import { formatFullDate } from '../../utils';

const CalendarTab = ({ tasks, goals, currentUser, partner }) => {
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();

    const days = [...Array(startWeekday).fill(null), ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)];

    const getTasksForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(t => t.date === dateStr);
    };

    const getGoalsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return goals.filter(g => g.deadline === dateStr);
    };

    const today = new Date();
    const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button
                    onClick={() => setCalendarMonth(new Date(year, month - 1))}
                    style={{ padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#F0F0F0', cursor: 'pointer', fontSize: '16px' }}
                >
                    ←
                </button>
                <h2 style={{ margin: 0, fontFamily: "'Zen Maru Gothic', sans-serif" }}>{year}年 {month + 1}月</h2>
                <button
                    onClick={() => setCalendarMonth(new Date(year, month + 1))}
                    style={{ padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#F0F0F0', cursor: 'pointer', fontSize: '16px' }}
                >
                    →
                </button>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {days.map((day, idx) => {
                    const dayTasks = getTasksForDay(day);
                    const dayGoals = getGoalsForDay(day);
                    const weekday = idx % 7;

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
                                                    backgroundColor: t.completed ? '#4ECDC4' :
                                                        t.assignee === currentUser?.name ? currentUser?.color : partner?.color || '#888',
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

            {selectedDate && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)',
                }} onClick={() => setSelectedDate(null)}>
                    <div style={{
                        backgroundColor: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px',
                        width: '100%', maxWidth: '500px', maxHeight: '60vh', overflowY: 'auto',
                        animation: 'slideUp 0.3s ease-out',
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 16px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                            📅 {formatFullDate(selectedDate.date)}
                        </h3>

                        {selectedDate.goals.length > 0 && (
                            <>
                                <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#888' }}>🚩 目標期限</h4>
                                {selectedDate.goals.map(goal => (
                                    <div key={goal.id} style={{ padding: '12px', backgroundColor: '#F0FFF4', borderRadius: '12px', marginBottom: '8px' }}>
                                        {goal.icon.emoji} {goal.title}
                                    </div>
                                ))}
                            </>
                        )}

                        {selectedDate.tasks.length > 0 ? (
                            selectedDate.tasks.map(task => {
                                const cat = CATEGORIES.find(c => c.id === task.category);
                                return (
                                    <div key={task.id} style={{
                                        padding: '12px',
                                        backgroundColor: task.completed ? '#F0F0F0' : '#FFF',
                                        border: '1px solid #EEE', borderRadius: '12px', marginBottom: '8px',
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                    }}>
                                        <span>{cat?.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#888' : '#333' }}>
                                                {task.title}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>👤 {task.assignee}</p>
                                        </div>
                                        {task.completed && <span style={{ color: '#4ECDC4' }}>✓</span>}
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>この日のタスクはありません</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarTab;

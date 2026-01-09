import { useState, useEffect, useCallback } from 'react';
import { generateId } from './utils';

// Components
import Confetti from './components/common/Confetti';
import StampSelector from './components/common/StampSelector';
import OnboardingScreen from './components/onboarding/OnboardingScreen';
import TaskModal from './components/tasks/TaskModal';
import GoalModal from './components/goals/GoalModal';
import HomeTab from './components/tabs/HomeTab';
import CalendarTab from './components/tabs/CalendarTab';
import TimelineTab from './components/tabs/TimelineTab';
import SettingsTab from './components/tabs/SettingsTab';
import Navigation from './components/layout/Navigation';

import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [thanksCount, setThanksCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStampSelector, setShowStampSelector] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('futariNote');
    if (saved) {
      const data = JSON.parse(saved);
      setCurrentUser(data.currentUser);
      setPartner(data.partner);
      setTasks(data.tasks || []);
      setGoals(data.goals || []);
      setTimeline(data.timeline || []);
      setThanksCount(data.thanksCount || 0);
      if (data.currentUser) setIsOnboarding(false);
    }
  }, []);

  useEffect(() => {
    if (!isOnboarding && currentUser) {
      localStorage.setItem('futariNote', JSON.stringify({
        currentUser, partner, tasks, goals, timeline, thanksCount,
      }));
    }
  }, [currentUser, partner, tasks, goals, timeline, thanksCount, isOnboarding]);

  const showNotificationFn = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addTimelineEntry = useCallback((action, details) => {
    setTimeline(prev => [{
      id: generateId(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name,
      userColor: currentUser?.color,
      action,
      details,
    }, ...prev].slice(0, 100));
  }, [currentUser]);

  const handleOnboardingComplete = (user, partnerData) => {
    setCurrentUser(user);
    setPartner(partnerData);
    setIsOnboarding(false);
    if (partnerData) showNotificationFn('パートナーが参加しました！', 'success');
  };

  const handleTaskSave = (taskData) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
      addTimelineEntry('edit', `「${taskData.title}」を編集しました`);
    } else {
      const newTask = {
        id: generateId(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name,
      };
      setTasks(prev => [...prev, newTask]);
      addTimelineEntry('create', `「${taskData.title}」を追加しました`);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskDelete = () => {
    if (editingTask) {
      setTasks(prev => prev.filter(t => t.id !== editingTask.id));
      addTimelineEntry('delete', `「${editingTask.title}」を削除しました`);
      setShowTaskModal(false);
      setEditingTask(null);
    }
  };

  const handleGoalSave = (goalData) => {
    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g));
    } else {
      setGoals(prev => [...prev, { id: generateId(), ...goalData, createdAt: new Date().toISOString() }]);
      addTimelineEntry('goal', `目標「${goalData.title}」を設定しました`);
    }
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const completeTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
    ));
    if (task) {
      addTimelineEntry('complete', `「${task.title}」を完了しました`);
      setShowConfetti(true);
    }
  };

  const undoComplete = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: false, completedAt: null } : t
    ));
    showNotificationFn('完了を取り消しました');
  };

  const sendStamp = (taskId, stamp) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setThanksCount(prev => prev + 1);
      addTimelineEntry('stamp', `${stamp.emoji} を「${task.title}」に送りました`);
      showNotificationFn(`${stamp.emoji} を送りました！`, 'success');
    }
    setShowStampSelector(null);
  };

  if (isOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} showNotification={showNotificationFn} />;
  }

  return (
    <div className="app-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {showStampSelector && (
        <StampSelector
          onSelect={(stamp) => sendStamp(showStampSelector, stamp)}
          onClose={() => setShowStampSelector(null)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          currentUser={currentUser}
          partner={partner}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        />
      )}

      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          onSave={handleGoalSave}
          onDelete={() => { setGoals(prev => prev.filter(g => g.id !== editingGoal.id)); setShowGoalModal(false); setEditingGoal(null); }}
          onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
        />
      )}

      {activeTab === 'home' && (
        <HomeTab
          currentUser={currentUser}
          partner={partner}
          tasks={tasks}
          goals={goals}
          thanksCount={thanksCount}
          filter={filter}
          setFilter={setFilter}
          setShowGoalModal={setShowGoalModal}
          setShowStampSelector={setShowStampSelector}
          setEditingGoal={setEditingGoal}
          setEditingTask={setEditingTask}
          setShowTaskModal={setShowTaskModal}
          completeTask={completeTask}
          undoComplete={undoComplete}
        />
      )}
      {activeTab === 'calendar' && (
        <CalendarTab
          tasks={tasks}
          goals={goals}
          currentUser={currentUser}
          partner={partner}
        />
      )}
      {activeTab === 'timeline' && (
        <TimelineTab
          timeline={timeline}
          thanksCount={thanksCount}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsTab
          currentUser={currentUser}
          partner={partner}
          onUpdateUser={(updates) => setCurrentUser(prev => ({ ...prev, ...updates }))}
          showNotification={showNotificationFn}
        />
      )}

      {(activeTab === 'home' || activeTab === 'calendar') && (
        <button
          onClick={() => setShowTaskModal(true)}
          className="fab-button"
        >
          +
        </button>
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;

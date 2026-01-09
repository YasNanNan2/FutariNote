import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useGoals } from './hooks/useGoals';
import { useTimeline } from './hooks/useTimeline';
import { useCouple } from './hooks/useCouple';
import { useRealtime } from './hooks/useRealtime';

// Components
import LoginScreen from './components/auth/LoginScreen';
import InitialSetup from './components/onboarding/InitialSetup';
import InviteFlow from './components/onboarding/InviteFlow';
import Confetti from './components/common/Confetti';
import StampSelector from './components/common/StampSelector';
import TaskModal from './components/tasks/TaskModal';
import GoalModal from './components/goals/GoalModal';
import HomeTab from './components/tabs/HomeTab';
import TasksTab from './components/tabs/TasksTab';
import CalendarTab from './components/tabs/CalendarTab';
import GoalsTab from './components/tabs/GoalsTab';
import SettingsTab from './components/tabs/SettingsTab';
import Navigation from './components/layout/Navigation';

import './App.css';

function App() {
  const { user, loading: authLoading, updateCustomAttributes, updateUserProfile, signOut, deleteAccount, refreshAuth } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addTaskToState,
    updateTaskInState,
    removeTaskFromState,
  } = useTasks();
  const {
    goals,
    loading: goalsLoading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalToState,
    updateGoalInState,
    removeGoalFromState,
  } = useGoals();
  const { timeline, loading: timelineLoading, fetchTimeline } = useTimeline();
  const { couple, stampStats, weeklyStampCount, fetchCouple, fetchStampStats, sendStamp, updateStampStats } = useCouple();

  const [colorPickerDismissed, setColorPickerDismissed] = useState(false);
  const [showInviteFlow, setShowInviteFlow] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStampSelector, setShowStampSelector] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [partnerCompletedTask, setPartnerCompletedTask] = useState(null); // パートナーの完了通知用
  const [thankedTaskIds, setThankedTaskIds] = useState(new Set()); // 感謝を送ったタスクID
  const [receivedStamps, setReceivedStamps] = useState([]); // 受け取った感謝
  const [showSettings, setShowSettings] = useState(false); // 設定画面表示

  // 色またはpartnerIdが未設定の場合は色選択画面を表示（セットアップ完了していない）
  const showColorPicker = user && (!user.color || !user.partnerId) && !colorPickerDismissed;
  // 招待フローは設定画面から任意で表示（初回強制しない）

  // パートナー情報
  const partner = couple?.users?.find(u => u.userId !== user?.userId) || null;

  // 初期データ取得（partnerId があればデータ取得）
  // user.partnerId のみに依存（name や color の変更では再取得しない）
  const partnerId = user?.partnerId;
  const userId = user?.userId;
  useEffect(() => {
    if (partnerId) {
      fetchTasks(partnerId);
      fetchGoals(partnerId);
      fetchTimeline(partnerId);
      fetchCouple(partnerId);
      // スタンプ統計と感謝済みタスクID・受け取った感謝を取得
      fetchStampStats(partnerId, userId).then(({ thankedTaskIds: loadedIds, receivedStamps: received }) => {
        if (loadedIds && loadedIds.size > 0) {
          setThankedTaskIds(loadedIds);
        }
        if (received && received.length > 0) {
          setReceivedStamps(received);
        }
      });
    }
  }, [partnerId, userId, fetchTasks, fetchGoals, fetchTimeline, fetchCouple, fetchStampStats]);

  // assigneeをuserIdにマイグレーション（既存データの互換性対応）
  const migrationDone = useRef(false);
  useEffect(() => {
    // 必要な情報が揃うまで待つ（partner情報も必要）
    if (!partnerId || !user?.userId || tasks.length === 0 || !couple) return;
    // 一度だけ実行
    if (migrationDone.current) return;
    migrationDone.current = true;

    const migrateAssignee = async () => {
      let migratedCount = 0;
      for (const task of tasks) {
        let newAssignee = null;

        // 自分のname/emailで保存されている場合 → userIdに更新
        if (task.assignee !== user.userId &&
            (task.assignee === user.name || task.assignee === user.email)) {
          newAssignee = user.userId;
        }
        // パートナーのname/emailで保存されている場合 → partnerのuserIdに更新
        else if (partner &&
                 task.assignee !== partner.userId &&
                 (task.assignee === partner.name || task.assignee === partner.email)) {
          newAssignee = partner.userId;
        }

        // マイグレーションが必要な場合のみ更新
        if (newAssignee) {
          try {
            await updateTask(partnerId, {
              id: task.id,
              title: task.title,
              date: task.date,
              assignee: newAssignee,
              category: task.category,
            });
            console.log(`マイグレーション完了: ${task.title} (${task.assignee} → ${newAssignee})`);
            migratedCount++;
          } catch (err) {
            console.error(`マイグレーション失敗: ${task.title}`, err);
          }
        }
      }
      if (migratedCount > 0) {
        console.log(`合計 ${migratedCount} 件のタスクをマイグレーションしました`);
      }
    };

    migrateAssignee();
  }, [tasks, partnerId, user?.userId, user?.name, user?.email, partner?.userId, partner?.name, partner?.email, couple, updateTask]);

  const showNotificationFn = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // リアルタイム同期（Subscription）
  const handleRealtimeStampReceived = useCallback((stamp) => {
    // スタンプ受信時にstampStatsを更新
    if (updateStampStats) {
      updateStampStats(stamp.stampType);
    }
    showNotificationFn(`スタンプを受け取りました！`, 'success');
  }, [updateStampStats, showNotificationFn]);

  // パートナーのタスク完了を検知して通知
  const handleRealtimeTaskUpdated = useCallback((task) => {
    // まず状態を更新
    updateTaskInState(task);

    // パートナーが完了したタスクかチェック
    if (task.completed && partner) {
      const isPartnerTask = task.assignee === partner.userId ||
                            task.assignee === partner.name ||
                            task.assignee === partner.email;
      if (isPartnerTask) {
        // 感謝送信ボタン付きの通知を表示
        setPartnerCompletedTask(task);
        // 10秒後に自動で閉じる
        setTimeout(() => setPartnerCompletedTask(null), 10000);
      }
    }
  }, [updateTaskInState, partner]);

  useRealtime({
    partnerId,
    onTaskCreated: addTaskToState,
    onTaskUpdated: handleRealtimeTaskUpdated,
    onTaskDeleted: (task) => removeTaskFromState(task.id),
    onGoalCreated: addGoalToState,
    onGoalUpdated: updateGoalInState,
    onGoalDeleted: (goal) => removeGoalFromState(goal.id),
    onStampReceived: handleRealtimeStampReceived,
    enabled: !!partnerId,
  });

  // 初回セットアップ完了時の処理
  const handleSetupComplete = async (color, newPartnerId) => {
    if (color && newPartnerId) {
      // 新規カップル作成の場合: 色とpartnerIdを保存
      const success = await updateCustomAttributes(color, newPartnerId);
      if (success) {
        await refreshAuth();
        setColorPickerDismissed(true);
      }
    } else if (color) {
      // 招待コード参加後の色選択: 色のみ更新（partnerIdは既にjoinCoupleで設定済み）
      const success = await updateUserProfile({ color });
      if (success) {
        await refreshAuth();
        setColorPickerDismissed(true);
      }
    } else {
      // 色なしで完了（通常は発生しない）
      await refreshAuth();
      setColorPickerDismissed(true);
    }
  };

  // 招待フロー完了
  const handleInviteComplete = () => {
    setShowInviteFlow(false);
    showNotificationFn('パートナーと連携しました！', 'success');
    refreshAuth();
  };

  // タスク保存
  const handleTaskSave = async (taskData) => {
    try {
      if (editingTask) {
        await updateTask(partnerId, { id: editingTask.id, ...taskData });
        showNotificationFn('タスクを更新しました', 'success');
      } else {
        await createTask(partnerId, taskData);
        showNotificationFn('タスクを追加しました', 'success');
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch {
      showNotificationFn('エラーが発生しました', 'error');
    }
  };

  // タスク削除
  const handleTaskDelete = async () => {
    if (editingTask) {
      try {
        await deleteTask(partnerId, editingTask.id);
        showNotificationFn('タスクを削除しました', 'success');
        setShowTaskModal(false);
        setEditingTask(null);
      } catch {
        showNotificationFn('削除に失敗しました', 'error');
      }
    }
  };

  // タスク完了
  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(partnerId, taskId);
      setShowConfetti(true);
      showNotificationFn('タスク完了！', 'success');
    } catch {
      showNotificationFn('エラーが発生しました', 'error');
    }
  };

  // タスク完了取り消し
  const handleUndoComplete = async (taskId) => {
    try {
      await uncompleteTask(partnerId, taskId);
      showNotificationFn('完了を取り消しました');
    } catch {
      showNotificationFn('エラーが発生しました', 'error');
    }
  };

  // ゴール保存
  const handleGoalSave = async (goalData) => {
    try {
      if (editingGoal) {
        await updateGoal(partnerId, { id: editingGoal.id, ...goalData });
        showNotificationFn('目標を更新しました', 'success');
      } else {
        await createGoal(partnerId, goalData);
        showNotificationFn('目標を設定しました', 'success');
      }
      setShowGoalModal(false);
      setEditingGoal(null);
    } catch {
      showNotificationFn('エラーが発生しました', 'error');
    }
  };

  // ゴール削除
  const handleGoalDelete = async () => {
    if (editingGoal) {
      try {
        await deleteGoal(partnerId, editingGoal.id);
        showNotificationFn('目標を削除しました', 'success');
        setShowGoalModal(false);
        setEditingGoal(null);
      } catch {
        showNotificationFn('削除に失敗しました', 'error');
      }
    }
  };

  // ゴール達成
  const handleAchieveGoal = async (goal) => {
    try {
      await updateGoal(partnerId, {
        id: goal.id,
        title: goal.title,
        deadline: goal.deadline,
        icon: goal.icon,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        achieved: true,
      });
      setShowConfetti(true);
      showNotificationFn('目標達成おめでとう！', 'success');
    } catch {
      showNotificationFn('エラーが発生しました', 'error');
    }
  };

  // ゴール達成取り消し
  const handleUnachieveGoal = async (goal) => {
    try {
      await updateGoal(partnerId, {
        id: goal.id,
        title: goal.title,
        deadline: goal.deadline,
        icon: goal.icon,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        achieved: false,
      });
      showNotificationFn('達成を取り消しました');
    } catch {
      showNotificationFn('エラーが発生しました', 'error');
    }
  };

  // スタンプ送信
  const handleSendStamp = async (stamp) => {
    if (!showStampSelector) {
      return;
    }

    if (!partner) {
      console.error('スタンプ送信エラー: パートナー情報がありません', { couple, user });
      showNotificationFn('パートナー情報が見つかりません', 'error');
      setShowStampSelector(null);
      return;
    }

    // タスクIDを記録（'general'以外の場合）
    const taskId = showStampSelector !== 'general' ? showStampSelector : null;

    try {
      console.log('スタンプ送信:', { partnerId, to: partner.userId, stampType: stamp.id, taskId });
      await sendStamp(partnerId, partner.userId, stamp.id, taskId);
      showNotificationFn(`${stamp.emoji} を送りました！`, 'success');

      // 感謝を送ったタスクIDをローカルステートにも追加（即時反映用）
      if (taskId) {
        setThankedTaskIds(prev => new Set([...prev, taskId]));
      }
    } catch (err) {
      console.error('スタンプ送信エラー:', err);
      showNotificationFn('送信に失敗しました', 'error');
    }
    setShowStampSelector(null);
  };

  // プロフィール更新
  const handleUpdateUser = async (updates) => {
    return await updateUserProfile(updates);
  };

  // ローディング中
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未認証: ログイン画面
  if (!user) {
    return <LoginScreen>{() => null}</LoginScreen>;
  }

  // 認証済み & 初回セットアップ未完了: セットアップ画面
  if (showColorPicker) {
    return <InitialSetup onComplete={handleSetupComplete} />;
  }

  // 招待フロー（設定画面から明示的に開いた場合のみ表示）
  if (showInviteFlow) {
    return (
      <InviteFlow
        onComplete={handleInviteComplete}
        onSkip={() => setShowInviteFlow(false)}
      />
    );
  }

  // メインアプリ
  return (
    <div className="app-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* パートナーのタスク完了通知（感謝ボタン付き） */}
      {partnerCompletedTask && partner && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFF',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '90%',
          width: '340px',
          animation: 'slideDown 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: partner.color || '#4ECDC4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFF', fontWeight: 'bold', fontSize: '16px',
            }}>
              {(partner.name || partner.email)?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                {partner.name || partner.email}さんがタスク完了!
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>
                「{partnerCompletedTask.title}」
              </p>
            </div>
            <button
              onClick={() => setPartnerCompletedTask(null)}
              style={{
                background: 'none', border: 'none', fontSize: '18px',
                color: '#999', cursor: 'pointer', padding: '4px',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setShowStampSelector(partnerCompletedTask.id);
                setPartnerCompletedTask(null);
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                color: '#FFF',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              💝 感謝を送る
            </button>
            <button
              onClick={() => setPartnerCompletedTask(null)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: '#F0F0F0',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              後で
            </button>
          </div>
        </div>
      )}

      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {showStampSelector && (
        <StampSelector
          onSelect={handleSendStamp}
          onClose={() => setShowStampSelector(null)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          currentUser={user}
          partner={partner}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          loading={tasksLoading}
        />
      )}

      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          onSave={handleGoalSave}
          onDelete={handleGoalDelete}
          onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
          loading={goalsLoading}
        />
      )}

      {activeTab === 'home' && (
        <HomeTab
          currentUser={user}
          partner={partner}
          tasks={tasks}
          weeklyStampCount={weeklyStampCount}
          timeline={timeline}
          setShowStampSelector={setShowStampSelector}
          thankedTaskIds={thankedTaskIds}
          receivedStamps={receivedStamps}
          onSettingsClick={() => setShowSettings(true)}
        />
      )}
      {activeTab === 'tasks' && (
        <TasksTab
          currentUser={user}
          partner={partner}
          tasks={tasks}
          filter={filter}
          setFilter={setFilter}
          setShowStampSelector={setShowStampSelector}
          setEditingTask={setEditingTask}
          setShowTaskModal={setShowTaskModal}
          completeTask={handleCompleteTask}
          undoComplete={handleUndoComplete}
          loading={tasksLoading}
          thankedTaskIds={thankedTaskIds}
        />
      )}
      {activeTab === 'goals' && (
        <GoalsTab
          goals={goals}
          setShowGoalModal={setShowGoalModal}
          setEditingGoal={setEditingGoal}
          achieveGoal={handleAchieveGoal}
          unachieveGoal={handleUnachieveGoal}
          loading={goalsLoading}
        />
      )}
      {activeTab === 'calendar' && (
        <CalendarTab
          tasks={tasks}
          goals={goals}
          currentUser={user}
          partner={partner}
          completeTask={handleCompleteTask}
          uncompleteTask={handleUndoComplete}
          onAddTask={(date) => {
            setEditingTask({ prefillDate: date });
            setShowTaskModal(true);
          }}
          onAddGoal={(date) => {
            setEditingGoal({ prefillDeadline: date });
            setShowGoalModal(true);
          }}
        />
      )}
      {/* 設定画面（フルスクリーン） */}
      {showSettings && (
        <div className="settings-fullscreen">
          <div className="settings-header">
            <button
              onClick={() => setShowSettings(false)}
              className="settings-back-button"
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>設定</h1>
          </div>
          <SettingsTab
            currentUser={user}
            partner={partner}
            onUpdateUser={handleUpdateUser}
            onSignOut={signOut}
            onDeleteAccount={deleteAccount}
            showNotification={showNotificationFn}
            refreshAuth={refreshAuth}
          />
        </div>
      )}

      {activeTab === 'tasks' && (
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

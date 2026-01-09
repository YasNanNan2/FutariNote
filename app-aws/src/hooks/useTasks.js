import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const client = generateClient();

/**
 * useTasks - タスク操作フック
 *
 * 機能:
 * - タスク一覧の取得
 * - タスクの作成/更新/削除
 * - タスクの完了/未完了切り替え
 * - 日付・月別でのフィルタリング
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // タスク一覧取得
  const fetchTasks = useCallback(async (partnerId) => {
    if (!partnerId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getTasks,
        variables: { partnerId, limit: 100 },
      });
      setTasks(result.data.getTasks || []);
    } catch (err) {
      console.error('タスク取得エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 日付でタスク取得
  const fetchTasksByDate = useCallback(async (partnerId, date) => {
    if (!partnerId) return [];
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getTasksByDate,
        variables: { partnerId, date },
      });
      return result.data.getTasksByDate || [];
    } catch (err) {
      console.error('日付別タスク取得エラー:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 月別でタスク取得
  const fetchTasksByMonth = useCallback(async (partnerId, month) => {
    if (!partnerId) return [];
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getTasksByMonth,
        variables: { partnerId, month },
      });
      return result.data.getTasksByMonth || [];
    } catch (err) {
      console.error('月別タスク取得エラー:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // タスク作成
  const createTask = useCallback(async (partnerId, input) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.createTask,
        variables: { input: { partnerId, ...input } },
      });
      const newTask = result.data.createTask;
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('タスク作成エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // タスク更新
  const updateTask = useCallback(async (partnerId, input) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.updateTask,
        variables: { input: { partnerId, ...input } },
      });
      const updatedTask = result.data.updateTask;
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      console.error('タスク更新エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // タスク完了
  const completeTask = useCallback(async (partnerId, taskId) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.completeTask,
        variables: { partnerId, taskId },
      });
      const updatedTask = result.data.completeTask;
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      console.error('タスク完了エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // タスク完了取り消し
  const uncompleteTask = useCallback(async (partnerId, taskId) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.uncompleteTask,
        variables: { partnerId, taskId },
      });
      const updatedTask = result.data.uncompleteTask;
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      console.error('タスク完了取り消しエラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // タスク削除
  const deleteTask = useCallback(async (partnerId, taskId) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.deleteTask,
        variables: { partnerId, taskId },
      });
      // deleteTask は成功時に null を返すため、errors のみをチェック
      if (result.errors && result.errors.length > 0) {
        console.error('タスク削除エラー:', result.errors);
        throw new Error(result.errors[0].message || 'タスク削除に失敗しました');
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('タスク削除エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 完了状態をトグル
  const toggleTaskComplete = useCallback(async (partnerId, taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.completed) {
      return await uncompleteTask(partnerId, taskId);
    } else {
      return await completeTask(partnerId, taskId);
    }
  }, [tasks, completeTask, uncompleteTask]);

  // リアルタイム同期用: タスクを追加（重複チェック付き）
  const addTaskToState = useCallback((task) => {
    setTasks(prev => {
      if (prev.some(t => t.id === task.id)) {
        return prev; // 既に存在する場合は追加しない
      }
      return [...prev, task];
    });
  }, []);

  // リアルタイム同期用: タスクを更新
  const updateTaskInState = useCallback((task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  }, []);

  // リアルタイム同期用: タスクを削除
  const removeTaskFromState = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTasksByDate,
    fetchTasksByMonth,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    toggleTaskComplete,
    // リアルタイム同期用
    addTaskToState,
    updateTaskInState,
    removeTaskFromState,
  };
};

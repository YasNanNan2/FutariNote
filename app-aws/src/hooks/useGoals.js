import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const client = generateClient();

/**
 * useGoals - ゴール操作フック
 *
 * 機能:
 * - ゴール一覧の取得
 * - ゴールの作成/更新/削除
 */
export const useGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ゴール一覧取得
  const fetchGoals = useCallback(async (partnerId) => {
    if (!partnerId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getGoals,
        variables: { partnerId },
      });
      setGoals(result.data.getGoals || []);
    } catch (err) {
      console.error('ゴール取得エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ゴール作成
  const createGoal = useCallback(async (partnerId, input) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.createGoal,
        variables: { input: { partnerId, ...input } },
      });
      const newGoal = result.data.createGoal;
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err) {
      console.error('ゴール作成エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // ゴール更新
  const updateGoal = useCallback(async (partnerId, input) => {
    try {
      setError(null);
      const result = await client.graphql({
        query: mutations.updateGoal,
        variables: { input: { partnerId, ...input } },
      });
      const updatedGoal = result.data.updateGoal;
      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      return updatedGoal;
    } catch (err) {
      console.error('ゴール更新エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // ゴール削除
  const deleteGoal = useCallback(async (partnerId, goalId) => {
    try {
      setError(null);
      await client.graphql({
        query: mutations.deleteGoal,
        variables: { partnerId, goalId },
      });
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      console.error('ゴール削除エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // リアルタイム同期用: ゴールを追加（重複チェック付き）
  const addGoalToState = useCallback((goal) => {
    setGoals(prev => {
      if (prev.some(g => g.id === goal.id)) {
        return prev; // 既に存在する場合は追加しない
      }
      return [...prev, goal];
    });
  }, []);

  // リアルタイム同期用: ゴールを更新
  const updateGoalInState = useCallback((goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  }, []);

  // リアルタイム同期用: ゴールを削除
  const removeGoalFromState = useCallback((goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    // リアルタイム同期用
    addGoalToState,
    updateGoalInState,
    removeGoalFromState,
  };
};

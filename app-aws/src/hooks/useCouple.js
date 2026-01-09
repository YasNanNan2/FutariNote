import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const client = generateClient();

// 今週の開始日（日曜日）を取得
const getWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

/**
 * useCouple - カップル情報管理フック
 *
 * 機能:
 * - カップル全データの取得
 * - スタンプの送信
 * - スタンプ統計の取得（今週分）
 */
export const useCouple = () => {
  const [couple, setCouple] = useState(null);
  const [stampStats, setStampStats] = useState({
    love: 0,
    thanks: 0,
    star: 0,
    muscle: 0,
    sparkle: 0,
    heart: 0,
  });
  const [weeklyStampCount, setWeeklyStampCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // カップル全データ取得
  const fetchCouple = useCallback(async (partnerId) => {
    if (!partnerId) return null;
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getCouple,
        variables: { partnerId },
      });
      const coupleData = result.data.getCouple;
      setCouple(coupleData);
      if (coupleData?.totalStamps) {
        setStampStats(coupleData.totalStamps);
      }
      return coupleData;
    } catch (err) {
      console.error('カップルデータ取得エラー:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // スタンプ統計取得（今週分をカウント + 感謝済みタスクID取得 + 受け取った感謝取得）
  const fetchStampStats = useCallback(async (partnerId, currentUserId = null) => {
    if (!partnerId) return { stats: null, weeklyCount: 0, thankedTaskIds: new Set(), receivedStamps: [] };
    try {
      const result = await client.graphql({
        query: queries.getStamps,
        variables: { partnerId, limit: 500 },
      });
      const stamps = result.data.getStamps || [];
      const weekStart = getWeekStart();

      // 全体統計と今週分を計算
      const stats = {
        love: 0,
        thanks: 0,
        star: 0,
        muscle: 0,
        sparkle: 0,
        heart: 0,
      };
      let weeklyCount = 0;
      const thankedTaskIds = new Set();
      const receivedStamps = [];

      stamps.forEach(stamp => {
        const type = stamp.stampType?.toLowerCase();
        if (type && stats[type] !== undefined) {
          stats[type]++;
        }
        // 今週分かどうかチェック
        if (stamp.timestamp) {
          const stampDate = new Date(stamp.timestamp);
          if (stampDate >= weekStart) {
            weeklyCount++;
          }
        }
        // 自分が送った感謝のタスクIDを収集
        if (stamp.taskId && (!currentUserId || stamp.from === currentUserId)) {
          thankedTaskIds.add(stamp.taskId);
        }
        // 自分が受け取った感謝を収集
        if (currentUserId && stamp.to === currentUserId) {
          receivedStamps.push(stamp);
        }
      });

      // 受け取った感謝を新しい順にソート
      receivedStamps.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setStampStats(stats);
      setWeeklyStampCount(weeklyCount);
      return { stats, weeklyCount, thankedTaskIds, receivedStamps };
    } catch (err) {
      console.error('スタンプ統計取得エラー:', err);
      return { stats: null, weeklyCount: 0, thankedTaskIds: new Set(), receivedStamps: [] };
    }
  }, []);

  // スタンプ送信
  const sendStamp = useCallback(async (partnerId, to, stampType, taskId = null) => {
    try {
      setError(null);
      const input = { partnerId, to, stampType: stampType.toUpperCase() };
      if (taskId) {
        input.taskId = taskId;
      }
      const result = await client.graphql({
        query: mutations.sendStamp,
        variables: { input },
      });
      // ローカルで統計を更新
      const type = stampType.toLowerCase();
      setStampStats(prev => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
      // 今週分もインクリメント
      setWeeklyStampCount(prev => prev + 1);
      return result.data.sendStamp;
    } catch (err) {
      console.error('スタンプ送信エラー:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // パートナー情報を取得
  const getPartner = useCallback(() => {
    if (!couple?.users || couple.users.length < 2) return null;
    // 自分以外のユーザーを返す（実際の実装では currentUser.userId との比較が必要）
    return couple.users[1];
  }, [couple]);

  // リアルタイム同期用: スタンプ統計を更新
  const updateStampStats = useCallback((stampType) => {
    const type = stampType.toLowerCase();
    setStampStats(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    // 今週分もインクリメント
    setWeeklyStampCount(prev => prev + 1);
  }, []);

  return {
    couple,
    stampStats,
    weeklyStampCount,
    loading,
    error,
    fetchCouple,
    fetchStampStats,
    sendStamp,
    getPartner,
    updateStampStats,
  };
};

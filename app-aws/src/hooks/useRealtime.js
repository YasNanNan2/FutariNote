import { useEffect, useRef, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import * as subscriptions from '../graphql/subscriptions';

const client = generateClient();

/**
 * useRealtime - リアルタイム同期フック
 *
 * AppSync Subscriptions を使用して、パートナー間でデータをリアルタイム同期
 *
 * @param {Object} options
 * @param {string} options.partnerId - カップルのパートナーID
 * @param {Function} options.onTaskCreated - タスク作成時のコールバック
 * @param {Function} options.onTaskUpdated - タスク更新時のコールバック
 * @param {Function} options.onTaskDeleted - タスク削除時のコールバック
 * @param {Function} options.onGoalCreated - ゴール作成時のコールバック
 * @param {Function} options.onGoalUpdated - ゴール更新時のコールバック
 * @param {Function} options.onGoalDeleted - ゴール削除時のコールバック
 * @param {Function} options.onStampReceived - スタンプ受信時のコールバック
 * @param {boolean} options.enabled - サブスクリプションを有効にするか
 */
export const useRealtime = ({
  partnerId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onGoalCreated,
  onGoalUpdated,
  onGoalDeleted,
  onStampReceived,
  enabled = true,
}) => {
  const subscriptionsRef = useRef([]);
  const isSetupRef = useRef(false);

  // コールバックをrefに保存（useEffectの依存関係から除外するため）
  const callbacksRef = useRef({
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onGoalCreated,
    onGoalUpdated,
    onGoalDeleted,
    onStampReceived,
  });

  // コールバックを常に最新に保つ
  useEffect(() => {
    callbacksRef.current = {
      onTaskCreated,
      onTaskUpdated,
      onTaskDeleted,
      onGoalCreated,
      onGoalUpdated,
      onGoalDeleted,
      onStampReceived,
    };
  });

  // サブスクリプションのクリーンアップ
  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    subscriptionsRef.current = [];
    isSetupRef.current = false;
  }, []);

  useEffect(() => {
    if (!partnerId || !enabled) {
      cleanup();
      return;
    }

    // 既にセットアップ済みなら何もしない
    if (isSetupRef.current) {
      return;
    }
    isSetupRef.current = true;

    console.log('=== useRealtime: Setting up subscriptions for partnerId:', partnerId);

    const subs = [];

    // Task Subscriptions
    try {
      const sub = client.graphql({
        query: subscriptions.onTaskCreated,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onTaskCreated:', data.onTaskCreated);
          if (data.onTaskCreated && callbacksRef.current.onTaskCreated) {
            callbacksRef.current.onTaskCreated(data.onTaskCreated);
          }
        },
        error: (error) => {
          console.error('onTaskCreated subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onTaskCreated subscription:', error);
    }

    try {
      const sub = client.graphql({
        query: subscriptions.onTaskUpdated,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onTaskUpdated:', data.onTaskUpdated);
          if (data.onTaskUpdated && callbacksRef.current.onTaskUpdated) {
            callbacksRef.current.onTaskUpdated(data.onTaskUpdated);
          }
        },
        error: (error) => {
          console.error('onTaskUpdated subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onTaskUpdated subscription:', error);
    }

    try {
      const sub = client.graphql({
        query: subscriptions.onTaskDeleted,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onTaskDeleted:', data.onTaskDeleted);
          if (data.onTaskDeleted && callbacksRef.current.onTaskDeleted) {
            callbacksRef.current.onTaskDeleted(data.onTaskDeleted);
          }
        },
        error: (error) => {
          console.error('onTaskDeleted subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onTaskDeleted subscription:', error);
    }

    // Goal Subscriptions
    try {
      const sub = client.graphql({
        query: subscriptions.onGoalCreated,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onGoalCreated:', data.onGoalCreated);
          if (data.onGoalCreated && callbacksRef.current.onGoalCreated) {
            callbacksRef.current.onGoalCreated(data.onGoalCreated);
          }
        },
        error: (error) => {
          console.error('onGoalCreated subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onGoalCreated subscription:', error);
    }

    try {
      const sub = client.graphql({
        query: subscriptions.onGoalUpdated,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onGoalUpdated:', data.onGoalUpdated);
          if (data.onGoalUpdated && callbacksRef.current.onGoalUpdated) {
            callbacksRef.current.onGoalUpdated(data.onGoalUpdated);
          }
        },
        error: (error) => {
          console.error('onGoalUpdated subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onGoalUpdated subscription:', error);
    }

    try {
      const sub = client.graphql({
        query: subscriptions.onGoalDeleted,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onGoalDeleted:', data.onGoalDeleted);
          if (data.onGoalDeleted && callbacksRef.current.onGoalDeleted) {
            callbacksRef.current.onGoalDeleted(data.onGoalDeleted);
          }
        },
        error: (error) => {
          console.error('onGoalDeleted subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onGoalDeleted subscription:', error);
    }

    // Stamp Subscription
    try {
      const sub = client.graphql({
        query: subscriptions.onStampReceived,
        variables: { partnerId },
      }).subscribe({
        next: ({ data }) => {
          console.log('=== onStampReceived:', data.onStampReceived);
          if (data.onStampReceived && callbacksRef.current.onStampReceived) {
            callbacksRef.current.onStampReceived(data.onStampReceived);
          }
        },
        error: (error) => {
          console.error('onStampReceived subscription error:', error);
        },
      });
      subs.push(sub);
    } catch (error) {
      console.error('Failed to setup onStampReceived subscription:', error);
    }

    subscriptionsRef.current = subs;

    return cleanup;
  }, [partnerId, enabled, cleanup]);

  return {
    cleanup,
  };
};

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';

const client = generateClient();

/**
 * useTimeline - タイムライン取得フック
 *
 * 機能:
 * - タイムライン一覧の取得
 * - ページネーション対応
 */
export const useTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextToken, setNextToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // タイムライン取得
  const fetchTimeline = useCallback(async (partnerId, limit = 50) => {
    if (!partnerId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getTimeline,
        variables: { partnerId, limit },
      });
      const data = result.data.getTimeline;
      setTimeline(data.items || data || []);
      setNextToken(data.nextToken || null);
      setHasMore(!!data.nextToken);
    } catch (err) {
      console.error('タイムライン取得エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 追加読み込み（ページネーション）
  const fetchMore = useCallback(async (partnerId, limit = 50) => {
    if (!partnerId || !nextToken || loading) return;

    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.getTimeline,
        variables: { partnerId, limit, nextToken },
      });
      const data = result.data.getTimeline;
      setTimeline(prev => [...prev, ...(data.items || data || [])]);
      setNextToken(data.nextToken || null);
      setHasMore(!!data.nextToken);
    } catch (err) {
      console.error('タイムライン追加取得エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [nextToken, loading]);

  // タイムラインを先頭に追加（新規アイテム用）
  const addTimelineItem = useCallback((item) => {
    setTimeline(prev => [item, ...prev]);
  }, []);

  return {
    timeline,
    loading,
    error,
    hasMore,
    fetchTimeline,
    fetchMore,
    addTimelineItem,
  };
};

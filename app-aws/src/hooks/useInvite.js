import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const client = generateClient();

/**
 * useInvite - 招待コード機能フック
 *
 * 機能:
 * - 招待コードの生成
 * - 招待コードの検証
 * - カップルへの参加
 */
export const useInvite = () => {
  const [inviteCode, setInviteCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 招待コード生成
  const createInviteCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: mutations.createInviteCode,
      });
      const code = result.data.createInviteCode;
      setInviteCode(code);
      return code;
    } catch (err) {
      console.error('招待コード生成エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 招待コード検証
  const validateCode = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: queries.validateInviteCode,
        variables: { code },
      });
      return result.data.validateInviteCode;
    } catch (err) {
      console.error('招待コード検証エラー:', err);
      setError('無効な招待コードです');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // カップルに参加
  const joinCouple = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.graphql({
        query: mutations.joinCouple,
        variables: { code },
      });
      return result.data.joinCouple;
    } catch (err) {
      console.error('カップル参加エラー:', err);
      setError(err.message || 'カップルへの参加に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // カップルから離脱
  const leaveCouple = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await client.graphql({
        query: mutations.leaveCouple,
      });
      setInviteCode(null);
    } catch (err) {
      console.error('カップル離脱エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    inviteCode,
    loading,
    error,
    createInviteCode,
    validateCode,
    joinCouple,
    leaveCouple,
    clearError,
  };
};

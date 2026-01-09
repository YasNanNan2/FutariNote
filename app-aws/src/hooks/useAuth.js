import { useState, useEffect } from 'react';
import { getCurrentUser, signOut, updateUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const client = generateClient();

/**
 * useAuth - Cognito 認証状態管理フック
 *
 * 機能:
 * - 認証状態の監視
 * - ユーザー情報の取得
 * - カスタム属性（partnerId, color）の管理
 * - ログアウト
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 認証状態の確認
  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // 現在のユーザーを取得（認証確認）
      const currentUser = await getCurrentUser();
      console.log('=== DEBUG: currentUser ===', currentUser);

      // GraphQL getMe クエリでユーザー属性を取得（Cognito AdminGetUser 経由）
      const result = await client.graphql({
        query: queries.getMe,
      });
      const userData = result.data.getMe;
      console.log('=== DEBUG: getMe result ===', userData);

      setUser({
        userId: userData.userId,
        username: currentUser.username,
        email: userData.email,
        name: userData.name || '',
        color: userData.color || null,
        partnerId: userData.partnerId || null,
      });
    } catch (err) {
      console.error('認証チェックエラー:', err);
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ユーザー属性の更新（name, color）- GraphQL経由でCognitoとDynamoDB両方を更新
  const updateUserProfile = async ({ name, color, partnerId } = {}) => {
    try {
      // partnerIdの更新はAmplify Auth APIを使用（updateUser Lambdaは対応していない）
      if (partnerId !== undefined) {
        await updateUserAttributes({
          userAttributes: { 'custom:partnerId': partnerId },
        });
        setUser(prev => ({ ...prev, partnerId }));
      }

      // name/colorの更新はGraphQL updateUser mutation経由（Cognito + DynamoDB両方を更新）
      if (name !== undefined || color !== undefined) {
        const input = {};
        if (name !== undefined) input.name = name;
        if (color !== undefined) input.color = color;

        const result = await client.graphql({
          query: mutations.updateUser,
          variables: { input },
        });

        const updatedUser = result.data.updateUser;
        console.log('=== updateUser result ===', updatedUser);

        // ローカル状態を更新
        setUser(prev => ({
          ...prev,
          ...(name !== undefined && { name: updatedUser.name }),
          ...(color !== undefined && { color: updatedUser.color }),
        }));
      }

      return true;
    } catch (err) {
      console.error('ユーザー属性更新エラー:', err);
      setError(err.message);
      return false;
    }
  };

  // 後方互換性のためのエイリアス
  const updateCustomAttributes = async (color, partnerId = null) => {
    return updateUserProfile({ color, partnerId: partnerId || undefined });
  };

  // ログアウト
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('ログアウトエラー:', err);
      setError(err.message);
    }
  };

  // アカウント削除（Lambda経由でDynamoDBデータもクリーンアップ）
  const handleDeleteAccount = async () => {
    try {
      console.log('アカウント削除を開始...');

      // GraphQL mutation を呼び出し（Lambda で処理）
      const result = await client.graphql({
        query: mutations.deleteAccount,
      });

      console.log('アカウント削除結果:', result.data.deleteAccount);

      // ローカル状態をクリア
      setUser(null);

      // サインアウト（セッションをクリア）
      try {
        await signOut();
      } catch (signOutErr) {
        // すでにサインアウト状態の場合は無視
        console.log('サインアウト処理:', signOutErr);
      }

      return true;
    } catch (err) {
      console.error('アカウント削除エラー:', err);
      console.error('エラー詳細:', JSON.stringify(err, null, 2));
      setError(err.message);
      return false;
    }
  };

  // マウント時に認証状態を確認
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    updateCustomAttributes,
    updateUserProfile,
    signOut: handleSignOut,
    deleteAccount: handleDeleteAccount,
    refreshAuth: checkAuth,
  };
};

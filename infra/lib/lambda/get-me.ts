import { AppSyncResolverHandler } from 'aws-lambda';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProvider({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

interface User {
  userId: string;
  name: string | null;
  email: string;
  color: string | null;
  partnerId: string | null;
  createdAt: string;
}

/**
 * getMe - 現在のユーザー情報を Cognito から取得
 *
 * フェデレーション認証（Google OAuth）では fetchUserAttributes が
 * カスタム属性を返さないため、AdminGetUser API を使用
 */
export const handler: AppSyncResolverHandler<{}, User> = async (event) => {
  const identity = event.identity as any;
  const username = identity?.username;
  const sub = identity?.sub;

  console.log('=== getMe: identity ===', JSON.stringify(identity, null, 2));

  if (!username) {
    throw new Error('Unauthorized: username not found');
  }

  try {
    // Cognito からユーザー属性を取得
    const result = await cognito.adminGetUser({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    console.log('=== getMe: Cognito user attributes ===', JSON.stringify(result.UserAttributes, null, 2));

    // 属性をマップに変換
    const attributes: Record<string, string> = {};
    result.UserAttributes?.forEach(attr => {
      if (attr.Name && attr.Value) {
        attributes[attr.Name] = attr.Value;
      }
    });

    const user: User = {
      userId: sub || attributes['sub'] || '',
      name: attributes['name'] || null,
      email: attributes['email'] || '',
      color: attributes['custom:color'] || null,
      partnerId: attributes['custom:partnerId'] || null,
      createdAt: result.UserCreateDate?.toISOString() || new Date().toISOString(),
    };

    console.log('=== getMe: returning user ===', JSON.stringify(user, null, 2));

    return user;
  } catch (error) {
    console.error('getMe error:', error);
    throw new Error('Failed to get user information');
  }
};

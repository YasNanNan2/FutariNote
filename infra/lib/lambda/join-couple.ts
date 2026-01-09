import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = DynamoDBDocument.from(new DynamoDB({}));
const cognito = new CognitoIdentityProvider({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

interface JoinCoupleInput {
  code: string;
}

interface CoupleResponse {
  id: string;
  createdAt: string;
}

/**
 * joinCouple - カップル参加
 *
 * 招待コードを検証し、2人のユーザーにpartnerId を設定
 * カップルドキュメントを作成
 */
export const handler: AppSyncResolverHandler<JoinCoupleInput, CoupleResponse> = async (event) => {
  // Cognito認証のidentityを取得
  const identity = event.identity as any;
  const username = identity?.username;
  const userId = identity?.sub;
  const code = event.arguments?.code;

  console.log('=== joinCouple: identity ===', JSON.stringify(identity, null, 2));

  if (!username || !userId) {
    throw new Error('Unauthorized');
  }

  if (!code) {
    throw new Error('Invite code is required');
  }

  // Cognito からユーザー情報を取得
  let userEmail = '';
  let userName = '';
  let userColor = '';
  try {
    const userResult = await cognito.adminGetUser({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });
    const attrs: Record<string, string> = {};
    userResult.UserAttributes?.forEach(attr => {
      if (attr.Name && attr.Value) {
        attrs[attr.Name] = attr.Value;
      }
    });
    userEmail = attrs['email'] || '';
    userName = attrs['name'] || '';
    userColor = attrs['custom:color'] || '';
  } catch (error) {
    console.error('Failed to get user from Cognito:', error);
    throw new Error('Failed to get user information');
  }

  // 1. 招待コードを検証
  const inviteResult = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: {
      PK: `INVITE#${code}`,
      SK: 'METADATA',
    },
  });

  if (!inviteResult.Item) {
    throw new Error('Invalid invite code');
  }

  const invite = inviteResult.Item;

  // 有効期限チェック
  if (new Date(invite.expiresAt) < new Date()) {
    throw new Error('Invite code has expired');
  }

  // 自分自身の招待コードではチェック
  if (invite.userId === userId) {
    throw new Error('Cannot join with your own invite code');
  }

  // 2. partnerId を決定（ホストの既存partnerIdがあれば使用、なければ新規生成）
  const partnerId = invite.partnerId || uuidv4();

  // 3. Cognito で両ユーザーの custom:partnerId を更新
  try {
    // ホストユーザー（招待コード作成者）
    await cognito.adminUpdateUserAttributes({
      UserPoolId: USER_POOL_ID,
      Username: invite.userId,
      UserAttributes: [
        {
          Name: 'custom:partnerId',
          Value: partnerId,
        },
      ],
    });

    // ゲストユーザー（参加者）
    await cognito.adminUpdateUserAttributes({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      UserAttributes: [
        {
          Name: 'custom:partnerId',
          Value: partnerId,
        },
      ],
    });
  } catch (error) {
    console.error('Failed to update Cognito attributes:', error);
    throw new Error('Failed to update user attributes');
  }

  // 4. カップルドキュメントを作成
  const createdAt = new Date().toISOString();

  await dynamodb.put({
    TableName: TABLE_NAME,
    Item: {
      PK: `COUPLE#${partnerId}`,
      SK: 'COUPLE#METADATA',
      id: partnerId,
      users: [
        {
          userId: invite.userId,
          name: invite.userName || 'User 1',
          email: invite.userEmail || '',
          color: invite.userColor || '#FF6B9D',
        },
        {
          userId,
          name: userName || 'User 2',
          email: userEmail,
          color: userColor || '#4ECDC4',
        },
      ],
      totalStamps: {
        love: 0,
        thanks: 0,
        star: 0,
        muscle: 0,
        sparkle: 0,
        heart: 0,
      },
      createdAt,
    },
  });

  // 5. 招待コードを削除（使用済み）
  await dynamodb.delete({
    TableName: TABLE_NAME,
    Key: {
      PK: `INVITE#${code}`,
      SK: 'METADATA',
    },
  });

  // シンプルなレスポンスを返す
  return {
    id: partnerId,
    createdAt,
  };
};

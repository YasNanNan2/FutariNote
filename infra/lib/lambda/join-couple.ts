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

interface UserInfo {
  userId: string;
  name: string;
  email: string;
  color: string;
}

/**
 * joinCouple - グループ参加
 *
 * 招待コードを検証し、新メンバーをグループに追加
 * - 既存メンバーを保持しつつ新メンバーを追加（3人以上対応）
 * - 重複参加を防止
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
  let existingPartnerId = '';
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
    existingPartnerId = attrs['custom:partnerId'] || '';
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

  // 3. 既に別のグループに所属しているかチェック
  if (existingPartnerId && existingPartnerId !== partnerId) {
    throw new Error('ALREADY_IN_ANOTHER_GROUP');
  }

  // 4. 既存のCoupleドキュメントを取得
  let existingUsers: UserInfo[] = [];
  let existingTotalStamps = {
    love: 0,
    thanks: 0,
    star: 0,
    muscle: 0,
    sparkle: 0,
    heart: 0,
  };
  let existingCreatedAt: string | null = null;

  const existingCouple = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: {
      PK: `COUPLE#${partnerId}`,
      SK: 'COUPLE#METADATA',
    },
  });

  if (existingCouple.Item) {
    existingUsers = (existingCouple.Item.users as UserInfo[]) || [];
    existingTotalStamps = existingCouple.Item.totalStamps || existingTotalStamps;
    existingCreatedAt = existingCouple.Item.createdAt as string;
    console.log(`既存グループ発見: ${existingUsers.length}人のメンバー`);
  }

  // 5. 既にこのグループのメンバーかチェック → 成功扱いで返す
  const alreadyMemberById = existingUsers.some(u => u.userId === userId);
  if (alreadyMemberById) {
    console.log('既にこのグループのメンバーです:', userId);
    // エラーではなく成功として返す（フロントでホーム画面へ遷移）
    throw new Error('ALREADY_MEMBER');
  }

  // 6. ホストが既存メンバーにいなければ追加
  const hostExists = existingUsers.some(u => u.userId === invite.userId);
  const updatedUsers: UserInfo[] = hostExists
    ? [...existingUsers]
    : [
        ...existingUsers,
        {
          userId: invite.userId,
          name: invite.userName || 'User',
          email: invite.userEmail || '',
          color: invite.userColor || '#FF6B9D',
        },
      ];

  // 7. 新メンバーを追加
  updatedUsers.push({
    userId,
    name: userName || 'User',
    email: userEmail,
    color: userColor || '#4ECDC4',
  });

  console.log(`グループ更新: ${updatedUsers.length}人のメンバー`);

  // 8. Cognito で新メンバーの custom:partnerId を更新
  try {
    // ホストユーザー（招待コード作成者）- partnerIdがまだ設定されていない場合のみ
    if (!invite.partnerId) {
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
    }

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

  // 9. Coupleドキュメントを更新（既存データを保持）
  const createdAt = existingCreatedAt || new Date().toISOString();

  await dynamodb.put({
    TableName: TABLE_NAME,
    Item: {
      PK: `COUPLE#${partnerId}`,
      SK: 'COUPLE#METADATA',
      id: partnerId,
      users: updatedUsers,
      totalStamps: existingTotalStamps,
      createdAt,
    },
  });

  // 10. 招待コードは削除しない（複数人招待を可能にする）
  // 有効期限（24時間）で自動的に無効化される

  // シンプルなレスポンスを返す
  return {
    id: partnerId,
    createdAt,
  };
};

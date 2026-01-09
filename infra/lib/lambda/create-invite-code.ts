import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';

const dynamodb = DynamoDBDocument.from(new DynamoDB({}));
const cognito = new CognitoIdentityProvider({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

interface InviteCode {
  code: string;
  userId: string;
  partnerId: string | null;
  expiresAt: string;
}

/**
 * createInviteCode - 招待コード生成
 *
 * ランダムな6桁英数字コードを生成し、DynamoDBに保存
 * 重複チェックを行い、重複していれば再生成
 */
export const handler: AppSyncResolverHandler<null, InviteCode> = async (event) => {
  // Cognito認証のidentityを取得
  const identity = event.identity as any;
  const username = identity?.username;
  const userId = identity?.sub;

  console.log('=== createInviteCode: identity ===', JSON.stringify(identity, null, 2));

  if (!username || !userId) {
    throw new Error('Unauthorized');
  }

  // Cognito からユーザー情報を取得（access tokenにはcustom属性がないため）
  let partnerId: string | null = null;
  let userName = '';
  let userEmail = '';
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
    partnerId = attrs['custom:partnerId'] || null;
    userName = attrs['name'] || '';
    userEmail = attrs['email'] || '';
    userColor = attrs['custom:color'] || '';
    console.log('=== createInviteCode: Cognito user ===', { partnerId, userName, userEmail, userColor });
  } catch (error) {
    console.error('Failed to get user from Cognito:', error);
    throw new Error('Failed to get user information');
  }

  // 招待コード生成（6桁英数字）
  const generateCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字を除外
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // 重複チェックと保存（最大10回試行）
  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode();

    // 有効期限24時間後
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      // 条件付き書き込み（inviteCodeが存在しない場合のみ）
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          PK: `INVITE#${code}`,
          SK: 'METADATA',
          inviteCode: code,
          userId,
          partnerId: partnerId || null,
          userName,
          userEmail,
          userColor,
          expiresAt,
          createdAt: new Date().toISOString(),
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      });

      // 成功
      return {
        code,
        userId,
        partnerId: partnerId || null,
        expiresAt,
      };
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        // 重複している場合は再試行
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique invite code after 10 attempts');
};

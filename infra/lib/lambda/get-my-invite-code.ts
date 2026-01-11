import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamodb = DynamoDBDocument.from(new DynamoDB({}));
const TABLE_NAME = process.env.TABLE_NAME!;

interface InviteCode {
  code: string;
  userId: string;
  partnerId: string | null;
  expiresAt: string;
}

/**
 * getMyInviteCode - 自分の有効な招待コードを取得
 *
 * 同じユーザーが作成した招待コードをDynamoDBから検索し、
 * 有効期限内のものがあれば返す
 */
export const handler: AppSyncResolverHandler<null, InviteCode | null> = async (event) => {
  // Cognito認証のidentityを取得
  const identity = event.identity as any;
  const userId = identity?.sub;

  console.log('=== getMyInviteCode: identity ===', JSON.stringify(identity, null, 2));

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // INVITE#で始まるアイテムをスキャンして、userIdが一致するものを探す
    const scanResult = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(PK, :pk) AND userId = :userId',
      ExpressionAttributeValues: {
        ':pk': 'INVITE#',
        ':userId': userId,
      },
    });

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('No invite code found for user:', userId);
      return null;
    }

    // 有効期限内のコードを探す
    const now = new Date().toISOString();
    const validCode = scanResult.Items.find(item => item.expiresAt > now);

    if (!validCode) {
      console.log('No valid invite code found for user:', userId);
      // 期限切れのコードを削除
      for (const item of scanResult.Items) {
        await dynamodb.delete({
          TableName: TABLE_NAME,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        });
      }
      return null;
    }

    console.log('Found valid invite code:', validCode.inviteCode);

    return {
      code: validCode.inviteCode,
      userId: validCode.userId,
      partnerId: validCode.partnerId || null,
      expiresAt: validCode.expiresAt,
    };
  } catch (error) {
    console.error('Failed to get invite code:', error);
    throw new Error('Failed to get invite code');
  }
};

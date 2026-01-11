import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';

const dynamodb = DynamoDBDocument.from(new DynamoDB({}));
const cognito = new CognitoIdentityProvider({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

interface DeleteAccountResult {
  success: boolean;
  deletedItems: number;
}

/**
 * deleteAccount - アカウント削除
 *
 * partnerId は個人に属さない（カップル/スペースの ID）
 * - パートナーがいる場合: Cognito のみ削除、DynamoDB は保持
 * - ソロの場合: Cognito + DynamoDB 両方削除
 */
export const handler: AppSyncResolverHandler<{}, DeleteAccountResult> = async (event) => {
  const identity = event.identity as any;
  const userId = identity?.sub;
  const username = identity?.username;
  const partnerId = identity?.claims?.['custom:partnerId'];

  if (!userId) {
    throw new Error('Unauthorized');
  }

  console.log('アカウント削除開始:', { userId, username, partnerId });

  let deletedItems = 0;
  let hasPartner = false;

  // 1. パートナーがいるか確認
  if (partnerId) {
    try {
      // カップルメタデータを取得
      const coupleResult = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: {
          PK: `COUPLE#${partnerId}`,
          SK: 'COUPLE#METADATA',
        },
      });

      if (coupleResult.Item?.users) {
        const users = coupleResult.Item.users as Array<{ userId: string }>;
        // 自分以外のユーザーがいるかチェック
        hasPartner = users.some(u => u.userId !== userId);
        console.log('パートナー有無:', hasPartner);
      }
    } catch (error) {
      console.error('カップル情報取得エラー:', error);
    }
  }

  // 2. パートナーがいない場合のみ DynamoDB データを削除
  if (partnerId && !hasPartner) {
    try {
      // COUPLE#{partnerId} の全アイテムを取得
      const queryResult = await dynamodb.query({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `COUPLE#${partnerId}`,
        },
      });

      const items = queryResult.Items || [];
      console.log(`削除対象アイテム数: ${items.length}`);

      // バッチ削除（25件ずつ）
      const batchSize = 25;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              PK: item.PK,
              SK: item.SK,
            },
          },
        }));

        if (deleteRequests.length > 0) {
          await dynamodb.batchWrite({
            RequestItems: {
              [TABLE_NAME]: deleteRequests,
            },
          });
          deletedItems += deleteRequests.length;
        }
      }

      console.log(`DynamoDB データ削除完了: ${deletedItems} 件`);
    } catch (error) {
      console.error('DynamoDB データ削除エラー:', error);
    }
  } else if (partnerId && hasPartner) {
    // パートナーがいる場合、カップルメタデータから自分を削除
    try {
      const coupleResult = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: {
          PK: `COUPLE#${partnerId}`,
          SK: 'COUPLE#METADATA',
        },
      });

      if (coupleResult.Item?.users) {
        const users = coupleResult.Item.users as Array<{ userId: string }>;
        const updatedUsers = users.filter(u => u.userId !== userId);

        await dynamodb.update({
          TableName: TABLE_NAME,
          Key: {
            PK: `COUPLE#${partnerId}`,
            SK: 'COUPLE#METADATA',
          },
          UpdateExpression: 'SET #users = :users',
          ExpressionAttributeNames: {
            '#users': 'users',
          },
          ExpressionAttributeValues: {
            ':users': updatedUsers,
          },
        });

        console.log('カップルメタデータから自分を削除');
      }
    } catch (error) {
      console.error('カップルメタデータ更新エラー:', error);
      throw new Error('Failed to update couple metadata');
    }
  }

  // 3. Cognito ユーザーを削除
  try {
    const targetUsername = username || userId;

    await cognito.adminDeleteUser({
      UserPoolId: USER_POOL_ID,
      Username: targetUsername,
    });

    console.log('Cognito ユーザー削除完了:', targetUsername);
  } catch (error) {
    console.error('Cognito ユーザー削除エラー:', error);
    throw new Error('Failed to delete Cognito user');
  }

  return {
    success: true,
    deletedItems,
  };
};

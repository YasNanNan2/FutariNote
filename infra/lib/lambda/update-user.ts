import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';

const dynamodb = DynamoDBDocument.from(new DynamoDB({}));
const cognito = new CognitoIdentityProvider({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

interface UpdateUserInput {
  name?: string;
  color?: string;
}

interface UserResponse {
  userId: string;
  name: string;
  email: string;
  color: string;
  partnerId: string | null;
  createdAt: string;
}

/**
 * updateUser - ユーザー情報を更新
 *
 * Cognito と DynamoDB (COUPLE#METADATA) の両方を更新
 */
export const handler: AppSyncResolverHandler<{ input: UpdateUserInput }, UserResponse> = async (event) => {
  const identity = event.identity as any;
  const username = identity?.username;
  const userId = identity?.sub;
  const input = event.arguments?.input;

  console.log('=== updateUser: identity ===', JSON.stringify(identity, null, 2));
  console.log('=== updateUser: input ===', JSON.stringify(input, null, 2));

  if (!username || !userId) {
    throw new Error('Unauthorized');
  }

  // 1. Cognito からユーザー情報を取得
  let userEmail = '';
  let userName = '';
  let userColor = '';
  let partnerId: string | null = null;

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
    partnerId = attrs['custom:partnerId'] || null;
  } catch (error) {
    console.error('Failed to get user from Cognito:', error);
    throw new Error('Failed to get user information');
  }

  // 2. Cognito の属性を更新
  const attributesToUpdate: { Name: string; Value: string }[] = [];

  if (input?.name !== undefined) {
    attributesToUpdate.push({ Name: 'name', Value: input.name });
    userName = input.name;
  }
  if (input?.color !== undefined) {
    attributesToUpdate.push({ Name: 'custom:color', Value: input.color });
    userColor = input.color;
  }

  if (attributesToUpdate.length > 0) {
    try {
      await cognito.adminUpdateUserAttributes({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: attributesToUpdate,
      });
      console.log('Cognito attributes updated successfully');
    } catch (error) {
      console.error('Failed to update Cognito attributes:', error);
      throw new Error('Failed to update user attributes');
    }
  }

  // 3. DynamoDB の COUPLE#METADATA を更新（partnerId がある場合）
  if (partnerId) {
    try {
      // 現在のカップル情報を取得
      const coupleResult = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: {
          PK: `COUPLE#${partnerId}`,
          SK: 'COUPLE#METADATA',
        },
      });

      if (coupleResult.Item && coupleResult.Item.users) {
        // users 配列内の該当ユーザーを更新
        const updatedUsers = coupleResult.Item.users.map((user: any) => {
          if (user.userId === userId) {
            return {
              ...user,
              name: userName,
              color: userColor,
            };
          }
          return user;
        });

        // 更新を保存
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
        console.log('DynamoDB COUPLE#METADATA updated successfully');
      }
    } catch (error) {
      console.error('Failed to update DynamoDB:', error);
      // DynamoDB の更新に失敗しても、Cognito は更新済みなのでエラーにはしない
      console.warn('Continuing despite DynamoDB update failure');
    }
  }

  return {
    userId,
    name: userName,
    email: userEmail,
    color: userColor,
    partnerId,
    createdAt: new Date().toISOString(),
  };
};

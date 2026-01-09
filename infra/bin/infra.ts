#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { HostingStack } from '../lib/hosting-stack';

const app = new cdk.App();

// 環境を取得 (-c env=dev or -c env=prod)
const environment = app.node.tryGetContext('env') || 'dev';
if (environment !== 'dev' && environment !== 'prod') {
  throw new Error(`Invalid environment: ${environment}. Must be 'dev' or 'prod'`);
}

// 共通設定
const envConfig = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'ap-northeast-1', // 東京リージョン固定
};

// スタックプレフィックス
const prefix = `futarinote-${environment}`;

// AuthStack
const authStack = new AuthStack(app, `${prefix}-AuthStack`, {
  env: envConfig,
  environment,
  description: `ふたりノート ${environment} - 認証基盤 (Cognito)`,
});

// ApiStack (AuthStack に依存)
const apiStack = new ApiStack(app, `${prefix}-ApiStack`, {
  env: envConfig,
  environment,
  userPool: authStack.userPool,
  description: `ふたりノート ${environment} - API基盤 (AppSync/DynamoDB)`,
});
apiStack.addDependency(authStack);

// HostingStack (独立)
new HostingStack(app, `${prefix}-HostingStack`, {
  env: envConfig,
  environment,
  description: `ふたりノート ${environment} - ホスティング (CloudFront/S3)`,
});

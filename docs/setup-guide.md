# ふたりノート AWS版 セットアップガイド

本ドキュメントでは、ふたりノートAWS版の詳細なセットアップ手順を説明します。

## 目次

1. [環境準備](#環境準備)
2. [AWS設定](#aws設定)
3. [プロジェクトセットアップ](#プロジェクトセットアップ)
4. [Amplify初期化](#amplify初期化)
5. [認証設定（Cognito + Google OAuth）](#認証設定)
6. [API設定（AppSync + DynamoDB）](#api設定)
7. [ホスティング設定](#ホスティング設定)
8. [デプロイ](#デプロイ)
9. [検証](#検証)
10. [トラブルシューティング](#トラブルシューティング)

---

## 環境準備

### 必要なツール

| ツール | バージョン | インストール方法 |
|-------|----------|---------------|
| Node.js | 18.x以上 | [nodejs.org](https://nodejs.org/) |
| npm | 9.x以上 | Node.jsに同梱 |
| Git | 最新版 | [git-scm.com](https://git-scm.com/) |
| AWS CLI | 2.x | [AWS CLI](https://aws.amazon.com/cli/) |

### インストール確認

```bash
node --version  # v18.x.x 以上
npm --version   # 9.x.x 以上
git --version   # git version 2.x.x
aws --version   # aws-cli/2.x.x
```

---

## AWS設定

### 1. AWSアカウント作成

1. [AWS公式サイト](https://aws.amazon.com/) にアクセス
2. 「AWSアカウントを作成」をクリック
3. メールアドレス、パスワード、アカウント名を入力
4. 支払い情報を登録（クレジットカード）
5. 本人確認（電話認証）
6. サポートプラン選択（基本プランは無料）

### 2. IAMユーザー作成

**セキュリティのため、ルートユーザーではなくIAMユーザーを使用します。**

1. [IAMコンソール](https://console.aws.amazon.com/iam/) にアクセス
2. 左メニュー「ユーザー」→「ユーザーを追加」
3. ユーザー名: `amplify-admin`
4. アクセスの種類:
   - ✅ プログラムによるアクセス
   - ✅ AWS Management Consoleへのアクセス
5. アクセス許可:
   - 「既存のポリシーを直接アタッチ」
   - `AdministratorAccess-Amplify` を選択
   - または `AdministratorAccess`（開発環境の場合）
6. タグ追加（オプション）
7. 確認して作成
8. **アクセスキーIDとシークレットアクセスキーを保存**（後で使用）

### 3. AWS CLI設定

```bash
aws configure
```

以下を入力：
- **AWS Access Key ID**: （上記で保存したアクセスキーID）
- **AWS Secret Access Key**: （上記で保存したシークレットアクセスキー）
- **Default region name**: `ap-northeast-1`（東京リージョン）
- **Default output format**: `json`

確認：
```bash
aws sts get-caller-identity
```

---

## プロジェクトセットアップ

### 1. リポジトリ移動

```bash
cd /Users/yasnan/futari_note/app-aws
```

### 2. 依存関係確認

```bash
npm install
```

既にインストール済みの場合はスキップ。

---

## Amplify初期化

### 1. Amplify CLI インストール

```bash
npm install -g @aws-amplify/cli
amplify --version  # 確認
```

### 2. Amplify 設定

```bash
amplify configure
```

ブラウザが開き、AWSコンソールへのログインを求められます。

1. IAMユーザーでログイン
2. 新しいIAMユーザー作成画面が表示される
3. デフォルト設定のまま「次へ」
4. アクセスキーを作成
5. ターミナルに戻り、アクセスキー情報を入力

### 3. プロジェクト初期化

```bash
amplify init
```

質問に回答：

```
? Enter a name for the project: futarinote
? Initialize the project with the above configuration? No
? Enter a name for the environment: dev
? Choose your default editor: Visual Studio Code (or お好みのエディタ)
? Choose the type of app that you're building: javascript
? What javascript framework are you using: react
? Source Directory Path: src
? Distribution Directory Path: dist
? Build Command: npm run build
? Start Command: npm run dev
? Do you want to use an AWS profile? Yes
? Please choose the profile you want to use: default
```

初期化完了後、以下のファイルが生成されます：
- `amplify/` ディレクトリ
- `src/aws-exports.js`（自動生成）
- `.amplifyrc`

---

## 認証設定

### 1. Google Cloud Consoleでプロジェクト作成

**Google OAuthを使用するため、先にGoogle側の設定を行います。**

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクト作成:
   - プロジェクト名: `futari-note`
   - 組織: なし
3. プロジェクトを選択
4. 左メニュー「APIとサービス」→「OAuth同意画面」
5. ユーザータイプ: 「外部」を選択
6. アプリ情報:
   - アプリ名: `ふたりノート`
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
7. スコープ: デフォルト（`email`, `profile`, `openid`）
8. テストユーザー: あなたのGmailアドレスを追加
9. 「認証情報」→「認証情報を作成」→「OAuthクライアントID」
10. アプリケーションの種類: 「ウェブアプリケーション」
11. 名前: `futari-note-web`
12. 承認済みのリダイレクトURI: **一旦空欄（Amplify設定後に追加）**
13. 作成
14. **クライアントIDとクライアントシークレットを保存**

### 2. Cognito認証追加

```bash
amplify add auth
```

質問に回答：

```
? Do you want to use the default authentication and security configuration?
  → Default configuration with Social Provider (Federation)

? How do you want users to be able to sign in?
  → Email

? Do you want to configure advanced settings?
  → Yes, I want to make some additional changes.

? What attributes are required for signing up?
  → Email

? Do you want to enable any of the following capabilities?
  → (スペースキーで選択)
  ✅ Add Google OAuth Provider

? Enter your Google Web Client ID:
  → （上記で保存したGoogleクライアントID）

? Enter your Google Web Client Secret:
  → （上記で保存したGoogleクライアントシークレット）

? Do you want to add User Pool Groups?
  → No

? Do you want to add an admin queries API?
  → No
```

### 3. カスタム属性追加

`amplify/backend/auth/futarinoteXXXX/cli-inputs.json` を編集：

```json
{
  "userPoolGroups": false,
  "adminQueries": false,
  "thirdPartyAuth": true,
  "authProviders": ["accounts.google.com"],
  "googleClientId": "your-google-client-id",
  "googleClientSecret": "your-google-client-secret",
  "customAttributes": [
    {
      "name": "partnerId",
      "type": "String",
      "mutable": true
    },
    {
      "name": "color",
      "type": "String",
      "mutable": true
    }
  ]
}
```

### 4. リダイレクトURI設定

```bash
amplify push
```

デプロイ後、Amplify Consoleに表示されるCognitoユーザープールのURLをコピーし、Google Cloud Consoleの「承認済みのリダイレクトURI」に追加：

```
https://<your-user-pool-domain>.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse
```

---

## API設定

### 1. GraphQL API追加

```bash
amplify add api
```

質問に回答：

```
? Select from one of the below mentioned services:
  → GraphQL

? Here is the GraphQL API that we will create. Select a setting to edit or continue
  → Continue

? Choose a schema template:
  → Blank Schema

? Do you want to edit the schema now?
  → Yes
```

エディタが開いたら、既存の `amplify/backend/api/futarinote/schema.graphql` の内容をそのまま使用（既に作成済み）。

### 2. 認証設定

`amplify/backend/api/futarinote/cli-inputs.json` を編集：

```json
{
  "version": 1,
  "serviceConfiguration": {
    "apiName": "futarinote",
    "serviceName": "AppSync",
    "defaultAuthType": {
      "mode": "AMAZON_COGNITO_USER_POOLS"
    },
    "conflictResolution": {
      "defaultResolutionStrategy": {
        "type": "AUTOMERGE"
      }
    }
  }
}
```

### 3. Resolver設定

DynamoDBとの連携は、AppSyncが自動生成します。カスタムResolverが必要な場合は、`amplify/backend/api/futarinote/resolvers/` に追加。

---

## ホスティング設定

### 1. ホスティング追加

```bash
amplify add hosting
```

質問に回答：

```
? Select the plugin module to execute:
  → Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)

? Choose a type:
  → Manual deployment
```

### 2. ビルド設定確認

`amplify.yml` が自動生成されます：

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## デプロイ

### 1. 全リソースデプロイ

```bash
amplify push
```

確認メッセージ:

```
? Are you sure you want to continue? Yes
? Do you want to generate code for your newly created GraphQL API? Yes
? Choose the code generation language target: javascript
? Enter the file name pattern of graphql queries, mutations and subscriptions: src/graphql/**/*.js
? Do you want to generate/update all possible GraphQL operations? Yes
? Enter maximum statement depth: 2
```

デプロイには5〜10分かかります。

### 2. ホスティングにデプロイ

```bash
amplify publish
```

ビルドとデプロイが完了すると、URLが表示されます：

```
✔ Deployment complete!
https://dev.xxxxx.amplifyapp.com
```

---

## 検証

### 1. ローカルで動作確認

```bash
npm run dev
```

`http://localhost:5173` にアクセス。

### 2. Google OAuth動作確認

1. 「Googleでログイン」ボタンクリック
2. Googleアカウント選択
3. 権限の許可
4. アプリにリダイレクト
5. ユーザー情報が表示されることを確認

### 3. API動作確認

AppSync コンソールで GraphQL クエリを実行：

```graphql
query GetMe {
  getMe {
    userId
    name
    email
    color
  }
}
```

---

## トラブルシューティング

### エラー: "Amplify init failed"

**原因**: AWS認証情報が正しくない

**解決策**:
```bash
aws configure
amplify delete
amplify init
```

### エラー: "Google OAuth redirect mismatch"

**原因**: リダイレクトURIが一致していない

**解決策**:
1. Amplify Consoleで正しいリダイレクトURIを確認
2. Google Cloud Consoleで設定を更新

### エラー: "GraphQL schema validation failed"

**原因**: スキーマに構文エラー

**解決策**:
```bash
amplify api gql-compile
```

エラーメッセージを確認し、スキーマを修正。

### エラー: "DynamoDB access denied"

**原因**: IAMロールの権限不足

**解決策**:
1. Amplify Consoleで生成されたIAMロールを確認
2. DynamoDBへの読み書き権限を追加

---

## 次のステップ

1. [既存コンポーネントの移植](./migration-guide.md)
2. [カスタムフックの実装](./custom-hooks.md)
3. [リアルタイム同期の実装](./realtime-sync.md)
4. [テストの追加](./testing.md)
5. [本番デプロイ](./production-deployment.md)

---

## 参考リンク

- [AWS Amplify公式ドキュメント](https://docs.amplify.aws/)
- [AWS AppSync Developer Guide](https://docs.aws.amazon.com/appsync/)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

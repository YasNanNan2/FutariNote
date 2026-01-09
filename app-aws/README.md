# ふたりノート - AWS版

カップル向けタスク管理・感謝の記録アプリケーション（AWS フルマネージド版）

## 概要

「ふたりノート」は、カップルが日々の家事タスクを共有し、お互いに感謝の気持ちを伝え合うためのWebアプリケーションです。

### 主な機能

- ✅ **タスク管理**: 家事の担当者・カテゴリ・期日を管理
- 💑 **カップル共有**: リアルタイムでパートナーと同期
- 💖 **スタンプ機能**: 感謝の気持ちを絵文字で伝える
- 🎯 **ゴール設定**: 二人の目標を共有
- 📅 **カレンダー表示**: 月間タスクを一覧
- 📝 **タイムライン**: 活動履歴を記録
- 🔐 **Google OAuth**: Gmail アカウントでログイン
- 📱 **複数デバイス対応**: スマホ・PC・タブレットで同期
- 🌐 **オフライン対応**: ネットワーク切断時も動作

## 技術スタック

### フロントエンド
- **React 19.2.0** - UI フレームワーク
- **Vite 7.2.4** - ビルドツール
- **AWS Amplify 6.x** - AWS統合SDK
- **@aws-amplify/ui-react** - Amplify UIコンポーネント

### バックエンド（AWS）
- **Amazon Cognito** - 認証・認可（Google OAuth 2.0）
- **AWS AppSync** - GraphQL API（リアルタイム同期）
- **Amazon DynamoDB** - NoSQLデータベース
- **AWS Lambda** - サーバーレス処理
- **Amazon S3** - 静的ホスティング
- **Amazon CloudFront** - CDN

## プロジェクト構成

```
app-aws/
├── amplify/                    # AWS Amplify設定
│   └── backend/
│       └── api/futarinote/
│           └── schema.graphql  # GraphQLスキーマ
├── src/
│   ├── components/             # Reactコンポーネント
│   │   ├── auth/              # 認証関連
│   │   ├── common/            # 共通コンポーネント
│   │   ├── goals/             # ゴール管理
│   │   ├── layout/            # レイアウト
│   │   ├── onboarding/        # オンボーディング
│   │   ├── tabs/              # タブ画面
│   │   └── tasks/             # タスク管理
│   ├── graphql/               # GraphQL定義
│   │   ├── queries.js         # クエリ
│   │   ├── mutations.js       # ミューテーション
│   │   └── subscriptions.js   # サブスクリプション
│   ├── hooks/                 # カスタムフック
│   ├── constants/             # 定数定義
│   ├── utils/                 # ユーティリティ
│   ├── App.jsx                # メインアプリ
│   └── main.jsx               # エントリーポイント
├── docs/                      # ドキュメント（ルートディレクトリ）
│   └── aws-basic-design.md    # AWS基本設計書
├── package.json
├── vite.config.js
└── README.md
```

## セットアップ手順

### 前提条件

- Node.js 18.x 以上
- npm 9.x 以上
- AWS アカウント
- AWS CLI インストール済み
- Git

### 1. 依存関係インストール

```bash
npm install
```

### 2. AWS Amplify CLI のインストール

```bash
npm install -g @aws-amplify/cli
```

### 3. AWS Amplify の初期化

```bash
amplify init
```

以下の質問に回答：
- **プロジェクト名**: futarinote
- **環境名**: dev
- **エディタ**: お好みのエディタ
- **アプリタイプ**: javascript
- **フレームワーク**: react
- **ソースディレクトリ**: src
- **ビルドディレクトリ**: dist
- **ビルドコマンド**: npm run build
- **開始コマンド**: npm run dev
- **AWS プロファイル**: デフォルト（または作成済みプロファイル）

### 4. 認証の追加（Amazon Cognito）

```bash
amplify add auth
```

設定：
- **認証方式**: Default configuration with Social Provider
- **ソーシャルプロバイダー**: Google
- **ユーザー属性**: Email（必須）
- **カスタム属性**:
  - `partnerId` (String)
  - `color` (String)

**Google OAuth設定:**
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. OAuth 2.0 クライアントID作成
3. 認証情報（Client ID、Client Secret）を Amplify に設定

### 5. API の追加（AWS AppSync）

```bash
amplify add api
```

設定：
- **API タイプ**: GraphQL
- **API 名**: futarinote
- **認証タイプ**: Amazon Cognito User Pool
- **追加の認証**: なし
- **競合検出**: 有効化（Auto Merge）
- **スキーマ**: `amplify/backend/api/futarinote/schema.graphql` を使用

### 6. ホスティングの追加（S3 + CloudFront）

```bash
amplify add hosting
```

設定：
- **ホスティングタイプ**: Hosting with Amplify Console
- **継続的デプロイ**: Manual deployment

### 7. AWS リソースのデプロイ

```bash
amplify push
```

- GraphQL APIのコード生成: Yes
- 言語: JavaScript
- ファイル名パターン: デフォルト
- すべてのクエリ・ミューテーション・サブスクリプション生成: Yes

### 8. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

## 開発

### ローカル開発

```bash
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run preview    # ビルド結果のプレビュー
npm run lint       # ESLint実行
```

### 環境の切り替え

```bash
amplify env list              # 環境一覧表示
amplify env checkout dev      # dev環境に切り替え
amplify env add staging       # staging環境追加
```

### GraphQLスキーマの更新

1. `amplify/backend/api/futarinote/schema.graphql` を編集
2. `amplify push` でデプロイ
3. 自動生成されるGraphQL操作を確認

## デプロイ

### 手動デプロイ

```bash
npm run build
amplify publish
```

### CI/CD（GitHub Actions）

`.github/workflows/deploy.yml` を参照

## データモデル

### カップル（Couple）
- 2人のユーザーで構成
- 招待コード方式でペアリング
- すべてのデータは `partnerId` で分離

### タスク（Task）
- タイトル、日付、担当者、カテゴリ
- 完了/未完了ステータス
- リアルタイム同期

### ゴール（Goal）
- 二人の目標
- 期限とアイコン設定

### タイムライン（Timeline）
- タスク作成・完了などの活動履歴
- 自動生成

### スタンプ（Stamp）
- 感謝の気持ちを伝える絵文字
- 6種類（love, thanks, star, muscle, sparkle, heart）

## セキュリティ

- **認証**: Amazon Cognito（Google OAuth 2.0）
- **認可**: AppSync IAM認証、partnerId検証
- **通信**: HTTPS強制（CloudFront）
- **データ**: DynamoDB暗号化
- **監査**: CloudTrail有効化

## コスト

- **初期（100カップル）**: 約 $10/月
- **スケール時（10,000カップル）**: 約 $1,700/月

詳細は `/docs/aws-basic-design.md` を参照

## トラブルシューティング

### Amplify初期化エラー

```bash
amplify delete     # 既存設定削除
amplify init       # 再初期化
```

### GraphQL APIエラー

```bash
amplify api gql-compile    # スキーマ検証
amplify push --force       # 強制デプロイ
```

### 認証エラー

- Google Cloud Consoleの設定を確認
- リダイレクトURI設定を確認
- Cognitoユーザープールの設定を確認

## ドキュメント

- [AWS基本設計書](../docs/aws-basic-design.md)
- [GraphQLスキーマ](amplify/backend/api/futarinote/schema.graphql)
- [AWS Amplify公式ドキュメント](https://docs.amplify.aws/)

## ライセンス

プライベートプロジェクト

## 作者

Yasnan

## バージョン履歴

- **v2.0.0** (2026-01-05): AWS版リリース
  - フルマネージドAWSインフラ
  - リアルタイム同期実装
  - Google OAuth実装
  - 複数デバイス対応

- **v1.0.0** (2025-01-05): 初回リリース
  - localStorageベース
  - Vercelデプロイ

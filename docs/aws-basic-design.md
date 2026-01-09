# ふたりノート AWS基本設計書

## 1. システム全体アーキテクチャ

### 1.1 アーキテクチャ概要
```
[クライアント（Web/PWA）]
    ↓ HTTPS
[Amazon CloudFront（CDN）]
    ↓
[S3（静的ホスティング）] ← フロントエンド
    ↓ GraphQL/REST
[AWS AppSync（GraphQL API）] ← リアルタイム同期
    ↓
[Amazon Cognito（認証）] ← Google OAuth 2.0
    ↓
[AWS Lambda（ビジネスロジック）]
    ↓
[Amazon DynamoDB（NoSQLデータベース）]
    ↓
[Amazon S3（添付ファイル保存）]

[監視・ログ]
- CloudWatch（ログ・メトリクス）
- X-Ray（トレーシング）

[CI/CD]
- AWS Amplify（デプロイパイプライン）
- GitHub Actions（テスト自動化）
```

### 1.2 採用AWSサービス

| サービス | 用途 | 理由 |
|---------|------|------|
| **AWS Amplify** | フルスタック開発基盤 | フロントエンド・バックエンド統合管理、CI/CD自動化 |
| **Amazon Cognito** | ユーザー認証・認可 | Google OAuth対応、セキュアなユーザー管理 |
| **AWS AppSync** | GraphQL API | リアルタイムデータ同期、オフライン対応 |
| **Amazon DynamoDB** | NoSQLデータベース | 高速アクセス、自動スケーリング、低コスト |
| **Amazon S3** | 静的ファイル・添付保存 | 高可用性、低コスト |
| **Amazon CloudFront** | CDN | 低レイテンシ、グローバル配信 |
| **AWS Lambda** | サーバーレス処理 | カスタムビジネスロジック実行 |
| **Amazon CloudWatch** | 監視・ログ | システム監視、エラー追跡 |
| **AWS X-Ray** | 分散トレーシング | パフォーマンス分析 |

### 1.3 Resolver 方式（VTL vs Lambda）

**基本方針**: シンプルな CRUD は VTL Resolver、複雑なロジックは Lambda Resolver

| 操作 | Resolver | 理由 |
|------|----------|------|
| Task CRUD | VTL | DynamoDB への単純な CRUD |
| Goal CRUD | VTL | DynamoDB への単純な CRUD |
| Timeline 取得 | VTL | DynamoDB クエリのみ |
| Stamp 送信 | VTL | DynamoDB への単純な書き込み |
| **createInviteCode** | **Lambda** | ランダムコード生成 + 重複チェックロジック |
| **joinCouple** | **Lambda** | Cognito カスタム属性更新 + DynamoDB トランザクション |

**Lambda が必要な理由**:
- `createInviteCode`: 6桁ランダムコード生成と重複チェック→再生成のループ処理
- `joinCouple`: Cognito のカスタム属性（partnerId）を2ユーザー分更新する必要があり、VTL では Cognito 操作不可

## 2. 認証・認可設計

### 2.1 認証フロー（Amazon Cognito）

**ユーザープール構成:**
```
[ユーザープール]
- ユーザー属性:
  - email（必須・主キー）
  - name（表示名）
  - custom:partnerId（カップルID）
  - custom:color（アバター色）

- 認証プロバイダー:
  1. Google OAuth 2.0（推奨）
  2. メール・パスワード（オプション）
```

**カップリング仕組み:**
1. ユーザーAが招待コード生成（6桁英数字）
2. DynamoDBに招待コード保存（有効期限24時間）
3. ユーザーBが招待コード入力
4. 両ユーザーに同じ `partnerId`（UUID）を付与
5. カップルドキュメント作成（DynamoDB）

### 2.2 認可モデル（IAM + AppSync）

**データアクセスルール:**
- ユーザーは自分の `partnerId` が一致するデータのみアクセス可能
- AppSync Resolver で以下をチェック:
  ```javascript
  $util.unauthorized() if partnerId != ctx.identity.claims.custom:partnerId
  ```

---

## 3. データモデル設計（DynamoDB）

### 3.1 テーブル構成

**シングルテーブル設計（推奨）**

| PK | SK | 属性 | 説明 |
|----|----|----|------|
| `COUPLE#<partnerId>` | `COUPLE#METADATA` | users[], createdAt | カップル情報 |
| `COUPLE#<partnerId>` | `TASK#<taskId>` | title, date, assignee, category, completed, createdBy, createdAt | タスク |
| `COUPLE#<partnerId>` | `GOAL#<goalId>` | title, deadline, icon, createdAt | ゴール |
| `COUPLE#<partnerId>` | `TIMELINE#<timestamp>#<id>` | user, action, details | タイムライン |
| `COUPLE#<partnerId>` | `STAMP#<timestamp>#<id>` | from, to, stampType, timestamp | スタンプ履歴 |
| `INVITE#<code>` | `METADATA` | userId, partnerId, expiresAt | 招待コード |

**GSI（Global Secondary Index）:**
- GSI1: `assignee-date-index` → タスクの日付検索用
- GSI2: `invite-code-index` → 招待コード検索用

### 3.2 データ例

**カップル情報:**
```json
{
  "PK": "COUPLE#uuid-1234",
  "SK": "COUPLE#METADATA",
  "users": [
    { "userId": "user-1", "name": "太郎", "email": "taro@example.com", "color": "blue" },
    { "userId": "user-2", "name": "花子", "email": "hanako@example.com", "color": "pink" }
  ],
  "createdAt": "2025-01-05T10:00:00Z",
  "totalStamps": { "love": 10, "thanks": 25, "star": 5 }
}
```

**タスク:**
```json
{
  "PK": "COUPLE#uuid-1234",
  "SK": "TASK#task-5678",
  "title": "食器洗い",
  "date": "2025-01-05",
  "assignee": "user-1",
  "category": "cleaning",
  "completed": false,
  "createdBy": "user-2",
  "createdAt": "2025-01-05T09:00:00Z"
}
```

---

## 4. API設計（AWS AppSync GraphQL）

### 4.1 GraphQL スキーマ概要

**主要な型定義:**
```graphql
type Couple {
  id: ID!
  users: [User!]!
  tasks: [Task!]!
  goals: [Goal!]!
  timeline: [TimelineEntry!]!
  totalStamps: StampCount!
}

type Task {
  id: ID!
  title: String!
  date: AWSDate!
  assignee: String!
  category: Category!
  completed: Boolean!
  createdBy: String!
  createdAt: AWSDateTime!
  completedAt: AWSDateTime
}

type Goal {
  id: ID!
  title: String!
  deadline: AWSDate!
  icon: String!
  createdAt: AWSDateTime!
}

type TimelineEntry {
  id: ID!
  timestamp: AWSDateTime!
  user: String!
  userColor: String!
  action: String!
  details: String!
}

enum Category {
  CLEANING
  COOKING
  SHOPPING
  CHILDCARE
  PET
  OTHER
}
```

### 4.2 クエリ・ミューテーション一覧

> **注**: 詳細な定義は `app-aws/src/graphql/queries.js`, `mutations.js` を参照

**クエリ:**
| クエリ | 説明 | 引数 |
|--------|------|------|
| `getCouple` | カップル全データ取得 | - |
| `getMe` | 自分のユーザー情報取得 | - |
| `getTasks` | タスク一覧取得 | limit, nextToken |
| `getTasksByMonth` | 月別タスク取得 | month |
| `getTasksByDate` | 日付指定タスク取得 | date |
| `getTask` | 単一タスク取得 | id |
| `getGoals` | ゴール一覧取得 | - |
| `getGoal` | 単一ゴール取得 | id |
| `getTimeline` | タイムライン取得 | limit, nextToken |
| `getStamps` | スタンプ履歴取得 | limit, nextToken |
| `validateInviteCode` | 招待コード検証 | code |

**ミューテーション:**
| ミューテーション | 説明 | 引数 |
|------------------|------|------|
| `createTask` | タスク作成 | input (title, date, assignee, category) |
| `updateTask` | タスク更新 | input (id, title, date, ...) |
| `completeTask` | タスク完了（Timeline 追加） | taskId |
| `uncompleteTask` | 完了取り消し（Timeline 削除） | taskId |
| `deleteTask` | タスク削除 | taskId |
| `createGoal` | ゴール作成 | input (title, deadline, icon) |
| `updateGoal` | ゴール更新 | input (id, title, deadline, icon) |
| `deleteGoal` | ゴール削除 | goalId |
| `sendStamp` | スタンプ送信 | input (to, stampType) |
| `updateUser` | ユーザー情報更新 | input (name, color) |
| `createInviteCode` | 招待コード生成【Lambda】 | - |
| `joinCouple` | カップル参加【Lambda】 | code |
| `leaveCouple` | カップル解消 | - |

### 4.3 リアルタイム購読（Subscription）

```graphql
# タスク更新をリアルタイム受信
subscription OnTaskUpdated {
  onTaskUpdated {
    id
    title
    completed
    completedAt
  }
}

# スタンプ受信をリアルタイム通知
subscription OnStampReceived {
  onStampReceived {
    from
    stampType
    timestamp
  }
}

# タイムライン更新
subscription OnTimelineAdded {
  onTimelineAdded {
    timestamp
    user
    action
    details
  }
}
```

---

## 5. フロントエンド変更設計

### 5.1 追加ライブラリ

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@aws-amplify/ui-react": "^6.0.0",
    "aws-amplify": "^6.0.0",
    "@aws-amplify/ui-react-storage": "^3.0.0"
  }
}
```

### 5.2 主要な変更ポイント

**1. 認証周り（OnboardingScreen.jsx）**
- localStorage → Cognito User Pool
- Google OAuth ボタン追加
- 招待コード機能実装

**2. データ管理（App.jsx）**
- `useState` → AppSync GraphQL クエリ
- `useLocalStorage` → Amplify DataStore
- リアルタイムサブスクリプション追加

**3. オフライン対応**
- Amplify DataStore の自動同期機能利用
- オフライン時の楽観的更新（Optimistic UI）

**4. PWA機能追加**
- Service Worker 設定
- Web App Manifest
- プッシュ通知（オプション）

### 5.3 フォルダ構成

```
app-aws/src/
├── main.jsx                  # Amplify初期化追加
├── App.jsx                   # GraphQL統合
├── components/
│   ├── auth/                 # 新規追加
│   │   ├── LoginScreen.jsx
│   │   └── InviteFlow.jsx
│   ├── common/
│   │   ├── Confetti.jsx
│   │   └── StampSelector.jsx
│   ├── goals/
│   │   └── GoalModal.jsx
│   ├── layout/
│   │   └── Navigation.jsx
│   ├── onboarding/
│   │   └── OnboardingScreen.jsx
│   ├── tabs/
│   │   ├── HomeTab.jsx
│   │   ├── CalendarTab.jsx
│   │   ├── TimelineTab.jsx
│   │   └── SettingsTab.jsx
│   └── tasks/
│       └── TaskModal.jsx
├── graphql/                  # 新規追加
│   ├── queries.js
│   ├── mutations.js
│   └── subscriptions.js
├── hooks/
│   ├── useCouple.js          # 新規追加
│   ├── useTasks.js           # 新規追加
│   ├── useRealtime.js        # 新規追加
│   └── useLocalStorage.js    # 削除予定
├── constants/
│   └── index.js
└── utils/
    └── index.js
```

---

## 6. インフラ構成（IaC）

### 6.1 AWS CDK による管理

> **注**: 当初 Amplify CLI を検討したが、インフラコード管理のため CDK を採用

**スタック構成:**

| スタック | リソース | 依存関係 |
|---------|---------|---------|
| **AuthStack** | Cognito User Pool, Google Identity Provider | なし |
| **ApiStack** | AppSync API, DynamoDB, Lambda（招待機能） | AuthStack |
| **HostingStack** | S3, CloudFront | なし |

**ディレクトリ構成:**
```
infra/
├── bin/futarinote.ts          # エントリポイント
├── lib/
│   ├── auth-stack.ts          # Cognito
│   ├── api-stack.ts           # AppSync + DynamoDB + Lambda
│   └── hosting-stack.ts       # S3 + CloudFront
├── graphql/
│   └── schema.graphql
└── cdk.json
```

**基本コマンド:**
```bash
cdk synth              # CloudFormation 生成
cdk diff               # 差分確認
cdk deploy -c env=dev  # dev 環境デプロイ
cdk deploy -c env=prod # prod 環境デプロイ
```

### 6.2 環境戦略

**2環境構成（dev / prod）**

| 環境 | 用途 | スタック名 |
|-----|------|-----------|
| **dev** | 開発・テスト | futarinote-dev-* |
| **prod** | 本番 | futarinote-prod-* |

**dev と prod は完全に分離。データは共有されない。**

**開発フロー:**
1. ローカルでコード修正
2. `cdk deploy -c env=dev` で dev にデプロイ
3. dev 環境で動作確認
4. `cdk deploy -c env=prod` で prod にデプロイ

## 7. デプロイ戦略

### 7.1 CDK による手動デプロイ

```bash
# テスト
npm run test
npm run lint

# CDK 差分確認
cdk diff -c env=dev

# dev デプロイ
cdk deploy --all -c env=dev

# 動作確認後、prod デプロイ
cdk diff -c env=prod
cdk deploy --all -c env=prod
```

### 7.2 CI/CD（GitHub Actions）

**dev 環境**: main ブランチへの push で自動デプロイ
**prod 環境**: 手動実行（Actions の「Run workflow」）

> 詳細は `docs/implementation-plan.md` の CI/CD セクション参照

---

## 8. セキュリティ設計

### 8.1 セキュリティ対策

| レイヤー | 対策 |
|---------|------|
| **認証** | Cognito MFA（多要素認証）オプション提供 |
| **通信** | CloudFront HTTPS強制、TLS 1.2以上 |
| **API** | AppSync IAM認証、リクエストレート制限 |
| **データ** | DynamoDB暗号化（保存時）、バックアップ有効化 |
| **アクセス制御** | IAMロール最小権限原則、partnerId厳密チェック |
| **CORS** | CloudFront Origins制限、特定ドメインのみ許可 |
| **監査** | CloudTrail有効化、すべてのAPI呼び出しログ記録 |

### 8.2 プライバシー保護

- ユーザーデータは完全分離（partnerId単位）
- 他カップルのデータは一切アクセス不可
- データ削除機能実装（アカウント削除時に完全削除）

---

## 9. コスト見積もり

### 9.1 月間想定コスト（100カップル = 200ユーザー想定）

| サービス | 想定使用量 | 月額費用（USD） |
|---------|-----------|----------------|
| **Cognito** | 200 MAU | $0（無料枠内） |
| **AppSync** | 100万リクエスト/月 | $4 |
| **DynamoDB** | 読取100万、書込50万 | $1.25（オンデマンド） |
| **S3** | 1GB保存、10GBトラフィック | $0.50 |
| **CloudFront** | 10GB転送 | $1 |
| **Lambda** | 10万リクエスト | $0（無料枠内） |
| **CloudWatch** | ログ5GB/月 | $2.50 |
| **合計** | - | **約 $10/月** |

### 9.2 スケール時のコスト（10,000カップル想定）

| サービス | 想定使用量 | 月額費用（USD） |
|---------|-----------|----------------|
| **Cognito** | 20,000 MAU | $1,000 |
| **AppSync** | 1億リクエスト/月 | $400 |
| **DynamoDB** | 読取1億、書込5000万 | $125 |
| **S3** | 100GB保存、1TB転送 | $50 |
| **CloudFront** | 1TB転送 | $85 |
| **Lambda** | 1000万リクエスト | $20 |
| **CloudWatch** | ログ50GB/月 | $25 |
| **合計** | - | **約 $1,700/月** |

---

## 10. 移行ステップ（段階的アプローチ）

### Phase 1: インフラ準備（1週間）
1. AWSアカウント設定、IAM設定
2. Amplify CLIセットアップ
3. Amplify Mock でローカル開発環境構築
4. 本番環境初期化（prod環境）
5. Cognito User Pool + Google OAuth設定
6. AppSync APIスキーマ設計
7. 認証機能のみ先行デプロイ（動作確認）

### Phase 2: 認証機能実装（1週間）
1. フロントエンド：Amplify SDK統合
2. Google OAuth連携実装
3. 招待コード機能実装
4. カップリング機能実装
5. 認証フロー動作確認

### Phase 3: データ移行機能実装（2週間）
1. GraphQL API実装（CRUD操作）
2. フロントエンド：localStorage → AppSync移行
3. リアルタイムサブスクリプション実装
4. オフライン対応（DataStore）
5. データ移行ツール作成（既存localStorageデータインポート）

### Phase 4: 機能追加・改善（1週間）
1. タイムライン機能強化
2. スタンプ機能のリアルタイム化
3. プッシュ通知実装（オプション）
4. PWA機能追加

### Phase 5: テスト・QA（1週間）
1. ローカル（Amplify Mock）での単体テスト
2. 本番環境での統合テスト
3. セキュリティ監査
4. パフォーマンステスト
5. ユーザビリティテスト

### Phase 6: 本番運用準備（3日）
1. 監視・アラート設定（CloudWatch）
2. バックアップ設定（DynamoDB PITR）
3. 運用ドキュメント整備
4. ロールバック手順確認
5. 本番リリース

**総期間: 約7週間**（本番環境のみのため短縮）

---

## 11. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| Google OAuth設定ミス | ログイン不可 | Amplify Mock で十分テスト、メール認証も併用 |
| DynamoDB設計ミス | パフォーマンス低下 | シングルテーブル設計パターン採用、GSI適切設計 |
| 本番環境での不具合 | サービス停止 | Amplify Mock での徹底的なテスト、段階的デプロイ |
| コスト超過 | 予算オーバー | CloudWatch Budget Alert設定（$50/月） |
| データ移行失敗 | ユーザーデータ損失 | 移行ツールの十分なテスト、DynamoDB PITR有効化 |
| リアルタイム同期不具合 | UX低下 | エラーハンドリング強化、楽観的更新でカバー |

---

## 付録

### A. 参考リンク

- [AWS Amplify ドキュメント](https://docs.amplify.aws/)
- [AWS AppSync Developer Guide](https://docs.aws.amazon.com/appsync/)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)
- [DynamoDB Single Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)

### B. 用語集

| 用語 | 説明 |
|-----|------|
| **partnerId** | カップルを一意に識別するUUID |
| **MAU** | Monthly Active Users（月間アクティブユーザー数） |
| **GSI** | Global Secondary Index（DynamoDBのセカンダリインデックス） |
| **Resolver** | AppSyncでGraphQLクエリをデータソースに変換する関数 |
| **DataStore** | Amplifyのオフライン対応データ同期ライブラリ |

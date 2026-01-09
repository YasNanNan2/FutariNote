# ふたりノート AWS版 実装計画書

**バージョン**: 2.1
**作成日**: 2026-01-05
**更新日**: 2026-01-06
**対象**: app-aws プロジェクト
**Phase 2 完了日**: 2026-01-06
**Phase 3 完了日**: 2026-01-06
**Phase 4 完了日**: 2026-01-06
**Phase 5 完了日**: 2026-01-06

---

## 概要

既存の localStorage ベースアプリを AWS フルマネージド環境に移行し、以下を実現する：
- 複数デバイス間でのデータ同期
- カップル間のリアルタイム共有
- Google OAuth による認証

**総期間**: 約6〜7週間

---

## 参照資源

| 資源 | パス | 用途 |
|------|------|------|
| 修正対象コード | `app-aws/src/` | フロントエンド（コピー済み、これをAWS対応に修正） |
| GraphQL 定義 | `app-aws/src/graphql/` | クエリ/ミューテーション/サブスクリプション |
| AWS 基本設計 | `docs/aws-basic-design.md` | スキーマ、テーブル設計 |
| 元アプリ | `app/src/` | 動作確認用の参考 |

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| **インフラ管理** | AWS CDK（TypeScript） |
| **認証** | Amazon Cognito |
| **API** | AWS AppSync（GraphQL） |
| **データベース** | Amazon DynamoDB |
| **フロントエンド** | React + Amplify SDK |
| **ホスティング** | CloudFront + S3（CDK管理） |
| **CI/CD** | GitHub Actions |

---

## CDK スタック構成

| スタック | リソース | 依存関係 |
|---------|---------|---------|
| **AuthStack** | Cognito User Pool, Identity Provider | なし |
| **ApiStack** | AppSync, DynamoDB, Resolvers | AuthStack |
| **HostingStack** | S3, CloudFront | なし |

---

## 環境戦略

### 2環境構成（dev / prod）

| 環境 | 用途 | リソース | URL |
|------|------|----------|----------|
| **dev** | 開発・テスト | 全て dev 専用 | ※TBD（CloudFront 発行の URL） |
| **prod** | 本番 | 全て prod 専用 | ※TBD（カスタムドメイン検討） |

---

## CI/CD

| 環境 | トリガー | 方法 |
|------|---------|------|
| dev | main に push | 自動 |
| prod | 手動実行 | GitHub Actions の「Run workflow」ボタン |

---

## Phase 1: インフラ構築（3〜5日）

**対象環境**: 共通（dev/prod 両方で使用するコード）  
**目標**: CDK プロジェクトとAWS環境のセットアップ

### 1.1 AWS環境準備 ✅
- [x] AWSアカウント作成/確認
- [x] IAMユーザー作成
- [x] AWS CLI設定・MFA設定
- [x] 予算アラート設定

### 1.2 CDK プロジェクト初期化

**インプット**: なし（新規作成）

- [x] `cdk init app --language typescript` 実行
- [x] CDK Bootstrap（`cdk bootstrap`）← 確認済み
- [x] 環境切り替え設定（`-c env=dev/prod`）
- [x] 3スタックのスケルトン作成:
  - [x] `auth-stack.ts`
  - [x] `api-stack.ts`
  - [x] `hosting-stack.ts`

### 1.3 Google OAuth 設定（AuthStack 用）

**インプット**: なし（GCP Console で設定）

- [x] GCPプロジェクト作成
- [x] OAuth 2.0 クライアントID作成
- [x] OAuth同意画面設定
- [x] クライアントID/シークレット保存

### 1.4 リージョン・タグ設定

**インプット**: なし

- [x] リージョン決定: `ap-northeast-1`（infra.ts で設定済み）
- [x] タグ戦略定義（各スタックで Project, Environment タグ設定済み）

**完了基準**: `cdk synth` 成功、Google OAuth設定完了 ✅

---

## Phase 2: 認証基盤実装（1週間）

**対象環境**: dev  
**目標**: Google OAuth ログインが動作する

### 2.1 AuthStack 実装【CDK: AuthStack】

**インプット**:
- `docs/aws-basic-design.md` → Cognito 設計（カスタム属性定義）
- Phase 1.3 の Google OAuth クライアントID/シークレット

- [x] Cognito User Pool 作成
- [x] Google Identity Provider 設定
- [x] カスタム属性追加: `partnerId`, `color`
- [x] App Client 作成
- [x] Hosted UI ドメイン設定

### 2.2 AuthStack デプロイ【CDK: AuthStack】

**インプット**: 2.1 の完成した AuthStack コード

**実装後の確認**:
- [x] `aws-basic-design.md` 2.1節 と Cognito 設定が一致
- [x] カスタム属性（partnerId, color）が定義されている

**事前チェック**:
- [x] `cdk synth` 成功
- [x] `cdk diff futarinote-dev-AuthStack` で変更内容確認

**デプロイ**:
- [x] `cdk deploy futarinote-dev-AuthStack`
- [x] Cognito リソース作成確認
- [x] GCP Console でリダイレクト URI 更新（デプロイ出力の URL を追加）
- [x] OAuth スコープ追加（`aws.cognito.signin.user.admin`）
- [x] AuthStack 再デプロイ（スコープ更新）

### 2.3 フロントエンド認証統合【Frontend】

**インプット**:
- 2.2 の CDK 出力（User Pool ID, Client ID, Domain）
- `app-aws/src/main.jsx`（修正対象）

- [x] `aws-amplify` および `@aws-amplify/ui-react` インストール
- [x] 環境別設定ファイル作成（`aws-config.js`）
- [x] `main.jsx` に Amplify 初期化コード追加

### 2.4 認証UI実装【Frontend】

**インプット**:
- `app-aws/src/components/auth/`（作成）
- `app-aws/src/components/onboarding/`（作成）

- [x] `LoginScreen.jsx` 作成
- [x] Amplify UI Authenticator 使用
- [x] ログアウト機能実装

### 2.5 カスタム属性管理【Frontend】

**インプット**:
- `docs/aws-basic-design.md` → カスタム属性仕様
- `app-aws/src/constants/index.js` → 色定数

- [x] 初回登録時の色選択UI（`ColorPicker.jsx`）
- [x] `useAuth` カスタムフック作成
- [x] App.jsx を認証フローに統合

**完了基準**: dev 環境でGoogle OAuth認証が動作 ✅

---

## Phase 3: データレイヤー実装（2週間）

**対象環境**: dev  
**目標**: タスク・ゴールのCRUD操作ができる

### 3.1 ApiStack 実装【CDK: ApiStack】✅

**インプット**:
- `docs/aws-basic-design.md` → DynamoDB テーブル設計、GSI 設計
- `docs/aws-basic-design.md` → GraphQL スキーマ
- `docs/aws-basic-design.md` → Resolver 方式（1.3 節）

**Resolver 方式**:
| 操作 | 方式 | 理由 |
|------|------|------|
| Task/Goal CRUD | VTL | 単純な DynamoDB 操作 |
| Timeline 取得 | VTL | クエリのみ |
| createInviteCode | **Lambda** | ランダムコード生成 + 重複チェック |
| joinCouple | **Lambda** | Cognito 属性更新 + トランザクション |

- [x] DynamoDB テーブル作成（PITR有効化）
- [x] GSI 作成（assignee-date-index, invite-code-index）
- [x] AppSync API 作成
- [x] VTL Resolver 実装（Task, Goal, Timeline, Stamp）
- [x] Lambda Resolver 実装（createInviteCode, joinCouple）

### 3.2 ApiStack デプロイ【CDK: ApiStack】✅

**インプット**: 3.1 の完成した ApiStack コード

**実装後の確認**:
- [x] `aws-basic-design.md` 3.1節 と DynamoDB テーブル設計が一致
- [x] `aws-basic-design.md` 4.1節 と GraphQL スキーマが一致
- [x] `aws-basic-design.md` 1.3節 と Resolver 方式が一致

**事前チェック**:
- [x] `cdk synth` 成功
- [x] `cdk diff futarinote-dev-ApiStack` で変更内容確認
- [x] TypeScript エラーなし

**デプロイ**:
- [x] `cdk deploy futarinote-dev-ApiStack`
- [x] AppSync/DynamoDB リソース作成確認

### 3.3 フロントエンド API 統合【Frontend】✅

**インプット**:
- 3.2 の CDK 出力（AppSync Endpoint, API Key/認証設定）
- `app-aws/src/graphql/`（既存の queries.js, mutations.js）

- [x] `aws-amplify` インストール済み（v6.15.9）
- [x] GraphQL クエリ/ミューテーション定義済み
- [x] 環境別設定ファイル更新（`aws-config.js` に API 設定追加）

### 3.4 カスタムフック実装【Frontend】✅

**インプット**:
- `app-aws/src/graphql/queries.js` → 使用するクエリ
- `app-aws/src/graphql/mutations.js` → 使用するミューテーション
- `app/src/hooks/` → 既存フックの参考

- [x] `useCouple.js` - カップル情報管理
- [x] `useTasks.js` - タスク操作
- [x] `useGoals.js` - ゴール操作
- [x] `useTimeline.js` - タイムライン取得

### 3.5 招待コード機能実装【Frontend】✅

**インプット**:
- `docs/aws-basic-design.md` → 招待コード仕様
- `app-aws/src/graphql/mutations.js` → createInviteCode, joinCouple

- [x] `InviteFlow.jsx` 作成
- [x] `useInvite.js` 作成

**完了基準**: dev 環境でCRUD動作 ⏳ Phase 4 で UI 統合後に確認

---

## Phase 4: 既存コードのAWS対応修正（2週間）【Frontend】✅

**対象環境**: dev
**対象コード**: `app-aws/src/`（コピー済みのコードを修正）
**目標**: localStorage 依存のコードを AWS（Cognito/AppSync）対応に修正

### 4.1 認証統合修正（Week 1）✅

**インプット**:
- `app-aws/src/components/layout/Navigation.jsx`
- `app-aws/src/components/tasks/TaskModal.jsx`
- `app-aws/src/components/tabs/HomeTab.jsx`
- Phase 2.5 で作成した `useAuth` フック
- Phase 3.4 で作成した `useTasks` フック

- [x] `Navigation.jsx` - タブ切り替えナビゲーション実装
- [x] `TaskModal.jsx` - useTasks フックに接続（props経由）
- [x] `HomeTab.jsx` - GraphQL 経由でタスク取得（props経由）
- [x] `Confetti.jsx` - 共通コンポーネント作成
- [x] `StampSelector.jsx` - スタンプ選択モーダル作成

### 4.2 各タブ修正（Week 2）✅

**インプット**:
- `app-aws/src/components/tabs/` 内の各コンポーネント
- Phase 3.4 で作成したカスタムフック群

- [x] `CalendarTab.jsx` - タスク・ゴール表示対応
- [x] `TimelineTab.jsx` - timeline/stampStats props 対応
- [x] `GoalModal.jsx` - useGoals フックに接続（props経由）
- [x] `SettingsTab.jsx` - Cognito ユーザー情報編集、InviteFlow 統合
- [x] `utils/index.js` - ユーティリティ関数作成

### 4.3 App.jsx 修正 ✅

**インプット**:
- `app-aws/src/App.jsx`
- 全カスタムフック

- [x] localStorage 削除 → GraphQL フックに置き換え
- [x] 認証状態管理追加（useAuth）
- [x] 全フック統合（useTasks, useGoals, useTimeline, useCouple）
- [x] オンボーディングフロー統合（ColorPicker, InviteFlow）
- [x] 各タブ・モーダルの統合

### 4.4 エラーハンドリング

**インプット**:
- `docs/aws-basic-design.md` → エラーメッセージ仕様（あれば）

- [ ] `ErrorBoundary.jsx` 作成（Phase 6 で対応予定）
- [x] 各操作で日本語エラーメッセージ表示（notification機能）

**完了基準**: すべての画面が AWS 経由で動作 ✅

---

## Phase 5: リアルタイム機能実装（1週間）✅

**対象環境**: dev
**目標**: カップル間でリアルタイム同期

### 5.1 Subscription 追加【CDK: ApiStack】✅

**インプット**:
- `docs/aws-basic-design.md` → Subscription 仕様（4.3節）
- `app-aws/src/graphql/subscriptions.js` → 既存定義

- [x] GraphQL スキーマに Subscription 追加（partnerId フィルタリング付き）
- [x] Goal 用 Subscription 追加（onGoalCreated, onGoalUpdated, onGoalDeleted）
- [x] deleteTask/deleteGoal の返り値を Task/Goal に変更（Subscription用）

**実装後の確認**:
- [x] `aws-basic-design.md` 4.3節 と Subscription 定義が一致

**事前チェック**:
- [x] `cdk synth` 成功
- [x] `cdk diff futarinote-dev-ApiStack` で変更内容確認

**デプロイ**:
- [x] `cdk deploy futarinote-dev-ApiStack`（更新）

### 5.2 フロントエンド Subscription 実装【Frontend】✅

**インプット**:
- 5.1 で更新した GraphQL スキーマ
- `app-aws/src/graphql/subscriptions.js`

- [x] `onTaskCreated` / `onTaskUpdated` / `onTaskDeleted`
- [x] `onGoalCreated` / `onGoalUpdated` / `onGoalDeleted`
- [x] `onStampReceived`
- [x] `useRealtime.js` フック作成
- [x] useTasks/useGoals にリアルタイム同期用関数追加

### 5.3 楽観的更新（Optimistic UI）【Frontend】✅

**インプット**:
- Phase 3.4 のカスタムフック

- [x] 即時UI更新（ローカル状態更新）
- [x] Subscription で他デバイスからの更新を反映

### 5.4 オンボーディングフロー改善【Frontend】✅

**追加実装**（Phase 5 中に対応）:
- [x] `InitialSetup.jsx` 作成（新規作成 or 招待コード参加を選択）
- [x] partnerId 競合問題を解消
- [x] create-invite-code Lambda の access token 問題修正
- [x] join-couple Lambda の access token 問題修正
- [x] ホストの既存 partnerId を使用するよう修正

**完了基準**: デバイス間でリアルタイム同期が動作 ✅

---

## Phase 6: 開発環境ホスティングとテスト（1週間）

**対象環境**: dev
**目標**: dev 環境でフロントエンドをホスティングし、全機能をテスト

### 6.1 HostingStack 実装【CDK: HostingStack】

**インプット**: なし（新規作成）

- [ ] S3 バケット作成
- [ ] CloudFront ディストリビューション作成
- [ ] OAC（Origin Access Control）設定
- [ ] `cdk deploy futarinote-dev-HostingStack`
- [ ] フロントエンドを S3 にデプロイ

**完了基準**: CloudFront URL でアプリにアクセス可能

### 6.2 dev 環境での統合テスト

**インプット**: デプロイ済み dev 環境（CloudFront URL）

- [ ] Google OAuth ログイン動作確認
- [ ] タスク CRUD 動作確認
- [ ] ゴール CRUD 動作確認
- [ ] リアルタイム同期動作確認（2デバイスで確認）
- [ ] 招待コード機能動作確認
- [ ] スタンプ送信動作確認

### 6.3 パフォーマンス・セキュリティ

**インプット**: デプロイ済み dev 環境

- [x] `npm audit` 実行（脆弱性なし）
- [ ] Lighthouse スコア確認（本番ビルドで再確認）
- [ ] IAM 権限の最小権限確認

### 6.4 ブラウザ・デバイス互換性テスト

**インプット**: デプロイ済み dev 環境

- [ ] PC（Chrome / Safari / Firefox / Edge）
- [ ] スマートフォン（iOS Safari / Android Chrome）
- [ ] レスポンシブデザイン確認

### 6.5 UI 修正 ✅

- [x] PC 表示時のレスポンシブ対応
- [x] FAB ボタンの位置修正

**完了基準**: dev 環境で全機能が正常動作

---

## Phase 7: 本番リリースと運用準備（2〜3日）

**対象環境**: prod ← Phase 6 完了後に本番環境にデプロイ
**目標**: prod 環境へのリリースと運用体制整備

### 7.1 prod 環境デプロイ【CDK: 全スタック】

**インプット**: dev 環境で検証済みの全スタックコード

**事前確認**:
- [ ] Phase 6 の統合テストが完了
- [ ] dev 環境で全機能が動作確認済み
- [ ] `cdk diff futarinote-prod-*` で変更内容確認

**デプロイ**:
- [ ] `cdk deploy futarinote-prod-AuthStack`
- [ ] `cdk deploy futarinote-prod-ApiStack`
- [ ] `cdk deploy futarinote-prod-HostingStack`
- [ ] フロントエンドを prod S3 にデプロイ

**デプロイ後確認**:
- [ ] prod 環境で Google ログイン成功
- [ ] prod 環境でタスク CRUD 動作

### 7.2 CI/CD 設定【GitHub Actions】

**インプット**:
- CDK 出力（各環境の S3 バケット名、CloudFront ID）
- デプロイコマンド

- [ ] `.github/workflows/deploy-dev.yml` 作成
- [ ] `.github/workflows/deploy-prod.yml` 作成

### 7.3 監視・アラート設定【CDK or AWS Console】

**インプット**: 監視対象リソース一覧

- [ ] CloudWatch ダッシュボード作成
- [ ] エラーアラート設定

### 7.4 運用ドキュメント

**インプット**: 全実装内容

- [ ] 運用マニュアル作成
- [ ] ロールバック手順文書化

### 7.5 データ移行ツール【Frontend】（任意）

**インプット**:
- `app/` の localStorage データ構造
- `app-aws/src/graphql/mutations.js`

- [ ] localStorage → DynamoDB 移行ツール

**完了基準**: prod 環境で動作、CI/CD 稼働

---

## マイルストーン

| マイルストーン | 期日 | 完了条件 | ステータス |
|-------------|------|---------|-----------|
| M1: インフラ完成 | 3〜5日 | CDK プロジェクト作成完了 | ✅ 完了 |
| M2: 認証動作 | Week 1 | dev で Google ログイン成功 | ✅ 完了 (2026-01-06) |
| M3: CRUD動作 | Week 3 | dev でタスクCRUD成功 | ✅ 完了 (2026-01-06) |
| M4: UI完成 | Week 5 | すべての画面が動作 | ✅ 完了 (2026-01-06) |
| M5: リアルタイム同期 | Week 6 | デバイス間同期成功 | ✅ 完了 (2026-01-06) |
| M6: dev ホスティング | Week 6.5 | CloudFront URL でアクセス可能 | ⏳ 次のステップ |
| M7: dev テスト完了 | Week 7 | dev 環境で全機能動作確認 | 未着手 |
| M8: 本番リリース | Week 7.5 | prod 環境で動作 | 未着手 |

---

## リスク管理

| リスク | 影響度 | 対策 |
|-------|-------|------|
| Google OAuth 設定ミス | 高 | dev 環境で十分テスト |
| DynamoDB 設計ミス | 高 | シングルテーブル設計採用 |
| CDK デプロイ失敗 | 中 | スタック分割、段階的デプロイ |
| 本番環境での不具合 | 高 | PITR有効化、ロールバック手順準備 |

---

## 次のアクション

**Phase 5 完了** - 次は Phase 6（開発環境ホスティングとテスト）

### Phase 6.1: HostingStack 実装
1. S3 バケット作成（静的ウェブホスティング）
2. CloudFront ディストリビューション作成
3. OAC（Origin Access Control）設定
4. `cdk deploy futarinote-dev-HostingStack`
5. フロントエンドを S3 にアップロード

### Phase 6.2〜6.4: dev 環境での統合テスト
1. CloudFront URL での動作確認
2. 全機能の統合テスト
3. ブラウザ・デバイス互換性テスト

### Phase 7: 本番リリース（Phase 6 完了後）
- dev 環境での全機能テスト完了後に実施

---

**作成者**: Claude  
**承認者**: Yasnan  
**最終更新**: 2026-01-06

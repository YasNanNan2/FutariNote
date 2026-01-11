# 3人以上利用対応 改善計画

## 1. 目標

「ふたりノート」を**2人以上のグループ**で利用できるよう拡張する。
- カップル、家族、シェアハウス、友人グループなど多様なユースケースに対応
- 既存の2人利用は引き続きサポート

---

## 2. 現状の問題点

### 2.1 バックエンド

| 箇所 | ファイル | 問題 |
|------|----------|------|
| **joinCouple Lambda** | `join-couple.ts:128-158` | `users`配列を2人固定で上書き。3人目が既存メンバーを消す |
| **招待コード削除** | `join-couple.ts:161-167` | 使用後に削除される（複数人招待には複数コード必要） |

### 2.2 フロントエンド

| 箇所 | ファイル | 問題 |
|------|----------|------|
| **partner変数** | `App.jsx:76` | 1人しか取得しない |
| **担当者選択** | `TaskModal.jsx:123-126` | 「自分」「パートナー」の2択 |
| **感謝送信** | `HomeTab.jsx` | 単一partnerにのみ送信 |
| **アバター表示** | `HomeTab.jsx:120-130` | 2人分のみ |
| **設定画面** | `SettingsTab.jsx:160-184` | 1人のパートナーのみ表示 |

### 2.3 GraphQL / データモデル

| 項目 | 現状 | 対応方針 |
|------|------|----------|
| `Couple.users` | `[User!]!` | ✅ そのまま利用可能 |
| `Task.assignee` | `String!` | 維持（1タスク1担当者） |
| `Stamp.to` | `String!` | 維持（1スタンプ1宛先） |

---

## 3. 改善設計

### 3.1 バックエンド変更

#### 3.1.1 joinCouple Lambda 修正

**変更内容:** 既存メンバーを保持しつつ新メンバーを追加

```typescript
// infra/lib/lambda/join-couple.ts

// 現在のコード（問題あり）
await dynamodb.put({
  Item: {
    users: [hostUser, newUser],  // 2人固定で上書き
  },
});

// 修正後
// 1. 既存のCoupleドキュメントを取得
const existingCouple = await dynamodb.get({
  TableName: TABLE_NAME,
  Key: {
    PK: `COUPLE#${partnerId}`,
    SK: 'COUPLE#METADATA',
  },
});

// 2. 既存メンバーを取得（なければ空配列）
const existingUsers = existingCouple.Item?.users || [];

// 3. 新メンバーが既に存在するかチェック（重複防止）
const alreadyMember = existingUsers.some(u => u.userId === userId);
if (alreadyMember) {
  throw new Error('既にこのグループのメンバーです');
}

// 4. ホストが既存メンバーにいなければ追加
const hostExists = existingUsers.some(u => u.userId === invite.userId);
const updatedUsers = hostExists
  ? existingUsers
  : [...existingUsers, {
      userId: invite.userId,
      name: invite.userName || 'User',
      email: invite.userEmail || '',
      color: invite.userColor || '#FF6B9D',
    }];

// 5. 新メンバーを追加
updatedUsers.push({
  userId,
  name: userName || 'User',
  email: userEmail,
  color: userColor || '#4ECDC4',
});

// 6. Coupleドキュメントを更新
await dynamodb.put({
  TableName: TABLE_NAME,
  Item: {
    PK: `COUPLE#${partnerId}`,
    SK: 'COUPLE#METADATA',
    id: partnerId,
    users: updatedUsers,
    totalStamps: existingCouple.Item?.totalStamps || { ... },
    createdAt: existingCouple.Item?.createdAt || new Date().toISOString(),
  },
});
```

#### 3.1.2 招待コード仕様変更（オプション）

| 現在 | 変更案 |
|------|--------|
| 使用後削除 | **削除しない**（同じコードで複数人招待可能） |
| 24時間有効 | 維持 |

```typescript
// 招待コード削除を削除（またはオプション化）
// await dynamodb.delete({ ... });  // コメントアウト
```

### 3.2 フロントエンド変更

#### 3.2.1 App.jsx - メンバー管理

```jsx
// 変更前
const partner = couple?.users?.find(u => u.userId !== user?.userId) || null;

// 変更後
const members = couple?.users || [];
const otherMembers = members.filter(u => u.userId !== user?.userId);
// 後方互換のため partner も維持（最初の1人）
const partner = otherMembers[0] || null;
```

#### 3.2.2 TaskModal.jsx - 担当者選択

```jsx
// 変更前
{partner && (
  <option value={partner.userId}>
    {partner.name || partner.email}
  </option>
)}

// 変更後
{otherMembers.map(member => (
  <option key={member.userId} value={member.userId}>
    {member.name || member.email}
  </option>
))}
```

#### 3.2.3 HomeTab.jsx - ヘッダーアバター

```jsx
// 変更前: 自分 + パートナー1人

// 変更後: 全メンバー表示（最大表示数制限）
<div style={{ display: 'flex' }}>
  {members.slice(0, 4).map((member, index) => (
    <div
      key={member.userId}
      style={{
        width: '36px', height: '36px', borderRadius: '50%',
        backgroundColor: member.color || '#888',
        marginLeft: index > 0 ? '-12px' : 0,
        border: '2px solid #FFF',
        zIndex: members.length - index,
      }}
    >
      {member.name?.[0]?.toUpperCase()}
    </div>
  ))}
  {members.length > 4 && (
    <div style={{ ... }}>+{members.length - 4}</div>
  )}
</div>
```

#### 3.2.4 HomeTab.jsx - 感謝送信

```jsx
// 変更前: 単一パートナーに自動送信

// 変更後: 2人以上いる場合は宛先選択
const handleSendStamp = () => {
  if (otherMembers.length === 1) {
    // 2人グループ: 従来通り
    setShowStampSelector('general');
  } else {
    // 3人以上: 宛先選択UI表示
    setShowRecipientSelector(true);
  }
};

// 宛先選択モーダル
{showRecipientSelector && (
  <RecipientSelector
    members={otherMembers}
    onSelect={(memberId) => {
      setSelectedRecipient(memberId);
      setShowStampSelector('general');
      setShowRecipientSelector(false);
    }}
    onClose={() => setShowRecipientSelector(false)}
  />
)}
```

#### 3.2.5 HomeTab.jsx - 「〇〇さんへ感謝」セクション

```jsx
// 変更前: パートナーの完了タスクのみ

// 変更後: 他メンバー全員の完了タスク
const othersRecentCompletions = completedTasks
  .filter(t =>
    otherMembers.some(m =>
      t.assignee === m.userId || t.assignee === m.name || t.assignee === m.email
    ) && !thankedTaskIds.has(t.id)
  )
  .slice(0, 5);

// 表示
<h2>🙏 メンバーへ感謝</h2>
{othersRecentCompletions.map(task => {
  const assignee = otherMembers.find(m =>
    task.assignee === m.userId || task.assignee === m.name
  );
  return (
    <div key={task.id}>
      <span style={{ color: assignee?.color }}>{assignee?.name}</span>
      が「{task.title}」を完了
      <button onClick={() => setShowStampSelector(task.id)}>
        💝 感謝
      </button>
    </div>
  );
})}
```

#### 3.2.6 SettingsTab.jsx - メンバー一覧

```jsx
// 変更前: 単一パートナー表示

// 変更後: メンバー一覧
<h3>👥 メンバー ({members.length}人)</h3>
<div>
  {members.map(member => (
    <div key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        backgroundColor: member.color,
      }}>
        {member.name?.[0]?.toUpperCase()}
      </div>
      <div>
        <p style={{ fontWeight: 'bold' }}>
          {member.name || member.email}
          {member.userId === currentUser.userId && ' (自分)'}
        </p>
        <p style={{ color: '#888', fontSize: '12px' }}>{member.email}</p>
      </div>
    </div>
  ))}
</div>

{/* 招待ボタンは常に表示 */}
<button onClick={() => setShowInviteFlow(true)}>
  + メンバーを招待
</button>
```

#### 3.2.7 新規コンポーネント: RecipientSelector.jsx

```jsx
// app-aws/src/components/common/RecipientSelector.jsx
const RecipientSelector = ({ members, onSelect, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>誰に感謝を送りますか？</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {members.map(member => (
            <button
              key={member.userId}
              onClick={() => onSelect(member.userId)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px', borderRadius: '12px',
                border: '2px solid #EEE', background: '#FFF',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: member.color,
              }}>
                {member.name?.[0]?.toUpperCase()}
              </div>
              <span>{member.name || member.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipientSelector;
```

---

## 4. 変更ファイル一覧

### バックエンド

| ファイル | 変更内容 |
|----------|----------|
| `infra/lib/lambda/join-couple.ts` | メンバー追加ロジックを修正 |
| `infra/lib/lambda/delete-account.ts` | メンバー削除時の処理確認 |

### フロントエンド

| ファイル | 変更内容 |
|----------|----------|
| `App.jsx` | `members`, `otherMembers` 追加 |
| `HomeTab.jsx` | アバター複数表示、感謝セクション修正 |
| `TasksTab.jsx` | 担当者表示を複数対応 |
| `CalendarTab.jsx` | 担当者表示を複数対応 |
| `TaskModal.jsx` | 担当者選択を複数対応 |
| `SettingsTab.jsx` | メンバー一覧表示 |
| `RecipientSelector.jsx` | 新規作成 |

---

## 5. 実装フェーズ

### Phase 1: バックエンド対応（優先）

| タスク | 工数 |
|--------|------|
| joinCouple Lambda 修正 | 2時間 |
| テスト（3人参加シナリオ） | 1時間 |
| CDK デプロイ | 30分 |
| **小計** | **約3.5時間** |

### Phase 2: フロントエンド基本対応

| タスク | 工数 |
|--------|------|
| App.jsx members対応 | 1時間 |
| TaskModal 担当者選択 | 1時間 |
| TasksTab/CalendarTab 表示修正 | 2時間 |
| **小計** | **約4時間** |

### Phase 3: フロントエンド感謝機能

| タスク | 工数 |
|--------|------|
| RecipientSelector 新規作成 | 1時間 |
| HomeTab 感謝送信対応 | 2時間 |
| HomeTab 「〇〇さんへ感謝」修正 | 1時間 |
| **小計** | **約4時間** |

### Phase 4: 設定・仕上げ

| タスク | 工数 |
|--------|------|
| SettingsTab メンバー一覧 | 1時間 |
| HomeTab ヘッダーアバター | 1時間 |
| 全体テスト | 2時間 |
| **小計** | **約4時間** |

---

## 6. 総工数

| フェーズ | 工数 |
|----------|------|
| Phase 1: バックエンド | 3.5時間 |
| Phase 2: フロントエンド基本 | 4時間 |
| Phase 3: 感謝機能 | 4時間 |
| Phase 4: 設定・仕上げ | 4時間 |
| **合計** | **約15.5時間（2日程度）** |

---

## 7. テストシナリオ

| # | シナリオ | 期待結果 |
|---|----------|----------|
| 1 | A→B の2人ペアリング | 成功、従来通り動作 |
| 2 | A-B 済み、A が招待、C が参加 | 3人グループ成立 |
| 3 | A-B-C 済み、タスク作成、担当者選択 | 3人から選択可能 |
| 4 | A-B-C 済み、感謝送信 | 宛先選択UI表示 |
| 5 | 3人グループ、設定画面 | 3人のメンバー一覧表示 |
| 6 | C がアカウント削除 | A-B の2人グループに戻る |

---

## 8. 後方互換性

| 項目 | 対応 |
|------|------|
| 既存2人カップル | そのまま動作（`partner`変数維持） |
| 既存タスクデータ | 変更不要 |
| 既存スタンプデータ | 変更不要 |

---

## 9. 将来の拡張ポイント

- **グループ名設定**: 「〇〇家」「シェアハウス△△」など
- **メンバー上限設定**: 無制限 or 有料プランで拡張
- **ロール機能**: 管理者/メンバーの権限分け
- **サブグループ**: 大家族での小グループ分け

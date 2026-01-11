import { useState, useEffect } from 'react';
import { useInvite } from '../../hooks/useInvite';
import './InviteFlow.css';

/**
 * InviteFlow - カップル招待・参加フロー
 *
 * 機能:
 * - 招待コードの生成（招待する側）
 * - 招待コードの入力・参加（招待される側）
 *
 * Props:
 * - inviteOnly: trueの場合、招待コード発行のみ表示（設定画面用）
 */
const InviteFlow = ({ onComplete, onSkip, inviteOnly = false }) => {
  const [mode, setMode] = useState(inviteOnly ? 'invite' : null); // 'invite' | 'join'
  const [inputCode, setInputCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // コードをハイフン区切りで表示（ABC123 → ABC-123）
  const formatCode = (code) => {
    if (!code || code.length !== 6) return code;
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  // 招待リンクを生成
  const getInviteLink = (code) => {
    const origin = window.location.origin;
    return `${origin}?invite=${code}`;
  };

  const { loading, error, getMyInviteCode, createInviteCode, joinCouple, clearError } = useInvite();
  const [initialLoading, setInitialLoading] = useState(true);

  // 招待モードの場合、既存のコードを取得
  useEffect(() => {
    const fetchExistingCode = async () => {
      if (mode === 'invite') {
        try {
          const existingCode = await getMyInviteCode();
          if (existingCode) {
            setGeneratedCode(existingCode.code);
          }
        } catch (err) {
          console.error('既存コード取得エラー:', err);
        }
      }
      setInitialLoading(false);
    };
    fetchExistingCode();
  }, [mode, getMyInviteCode]);

  // 招待コード生成
  const handleGenerateCode = async () => {
    try {
      const result = await createInviteCode();
      setGeneratedCode(result.code);
    } catch {
      // エラーはフックで処理済み
    }
  };

  // 招待リンクをクリップボードにコピー
  const handleCopyLink = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(getInviteLink(generatedCode));
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error('コピー失敗:', err);
      }
    }
  };

  // 招待コードをクリップボードにコピー
  const handleCopyCode = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('コピー失敗:', err);
      }
    }
  };

  // カップルに参加
  const handleJoinCouple = async () => {
    if (!inputCode.trim()) return;
    try {
      await joinCouple(inputCode.trim().toUpperCase());
      onComplete?.();
    } catch {
      // エラーはフックで処理済み
    }
  };

  // モード選択に戻る
  const handleBack = () => {
    setMode(null);
    setGeneratedCode(null);
    setInputCode('');
    clearError();
  };

  // モード選択画面
  if (!mode) {
    return (
      <div className="invite-flow-container">
        <div className="invite-flow-card">
          <h2>パートナーと一緒に使う</h2>
          <p className="invite-flow-description">
            招待コードを使ってパートナーとつながりましょう
          </p>

          <div className="invite-options">
            <button
              className="invite-option-button invite"
              onClick={() => setMode('invite')}
            >
              <span className="option-icon">📤</span>
              <span className="option-title">招待する</span>
              <span className="option-desc">招待コードを作成</span>
            </button>

            <button
              className="invite-option-button join"
              onClick={() => setMode('join')}
            >
              <span className="option-icon">📥</span>
              <span className="option-title">参加する</span>
              <span className="option-desc">コードを入力</span>
            </button>
          </div>

          {onSkip && (
            <button className="skip-button" onClick={onSkip}>
              あとで設定する
            </button>
          )}
        </div>
      </div>
    );
  }

  // 招待コード生成画面
  if (mode === 'invite') {
    return (
      <div className="invite-flow-container">
        <div className="invite-flow-card">
          {!inviteOnly && (
            <button className="back-button" onClick={handleBack}>
              ← 戻る
            </button>
          )}

          <h2>メンバーを招待</h2>
          <p className="invite-flow-description">
            リンクまたはコードを共有してください
          </p>

          {initialLoading && mode === 'invite' ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#888' }}>読み込み中...</p>
            </div>
          ) : !generatedCode ? (
            <button
              className="generate-button"
              onClick={handleGenerateCode}
              disabled={loading}
            >
              {loading ? '生成中...' : '招待リンク・コードを作成'}
            </button>
          ) : (
            <div className="code-display">
              {/* 招待リンク */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  🌐 招待リンク（Webで利用する方向け）
                </p>
                <div style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  color: '#333',
                  wordBreak: 'break-all',
                  marginBottom: '8px',
                }}>
                  {getInviteLink(generatedCode)}
                </div>
                <button
                  className="copy-button"
                  onClick={handleCopyLink}
                  style={{ width: '100%' }}
                >
                  {copiedLink ? 'コピーしました！' : 'リンクをコピー'}
                </button>
              </div>

              {/* 招待コード */}
              <div style={{
                borderTop: '1px solid #EEE',
                paddingTop: '20px',
              }}>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  📱 招待コード（アプリで利用する方向け）
                </p>
                <div className="invite-code" style={{ letterSpacing: '4px' }}>
                  {formatCode(generatedCode)}
                </div>
                <button
                  className="copy-button secondary"
                  onClick={handleCopyCode}
                  style={{
                    width: '100%',
                    backgroundColor: '#F0F0F0',
                    color: '#666',
                  }}
                >
                  {copiedCode ? 'コピーしました！' : 'コードをコピー'}
                </button>
              </div>

              <p className="code-note" style={{ marginTop: '16px' }}>
                ⏰ 有効期限: 24時間
              </p>

              <button
                className="regenerate-button"
                onClick={handleGenerateCode}
                disabled={loading}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: '#888',
                  backgroundColor: 'transparent',
                  border: '1px solid #DDD',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {loading ? '生成中...' : '🔄 新しいコードを生成'}
              </button>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button className="done-button" onClick={onComplete}>
            完了
          </button>
        </div>
      </div>
    );
  }

  // 招待コード入力画面
  return (
    <div className="invite-flow-container">
      <div className="invite-flow-card">
        <button className="back-button" onClick={handleBack}>
          ← 戻る
        </button>

        <h2>招待コードを入力</h2>
        <p className="invite-flow-description">
          パートナーから受け取ったコードを入力してください
        </p>

        <input
          type="text"
          className="code-input"
          placeholder="例: ABC123"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          maxLength={6}
        />

        {error && <p className="error-message">{error}</p>}

        <button
          className="join-button"
          onClick={handleJoinCouple}
          disabled={loading || !inputCode.trim()}
        >
          {loading ? '参加中...' : '参加する'}
        </button>
      </div>
    </div>
  );
};

export default InviteFlow;

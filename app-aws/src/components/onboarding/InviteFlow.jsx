import { useState } from 'react';
import { useInvite } from '../../hooks/useInvite';
import './InviteFlow.css';

/**
 * InviteFlow - カップル招待・参加フロー
 *
 * 機能:
 * - 招待コードの生成（招待する側）
 * - 招待コードの入力・参加（招待される側）
 */
const InviteFlow = ({ onComplete, onSkip }) => {
  const [mode, setMode] = useState(null); // 'invite' | 'join'
  const [inputCode, setInputCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const { loading, error, createInviteCode, joinCouple, clearError } = useInvite();

  // 招待コード生成
  const handleGenerateCode = async () => {
    try {
      const result = await createInviteCode();
      setGeneratedCode(result.code);
    } catch {
      // エラーはフックで処理済み
    }
  };

  // コードをクリップボードにコピー
  const handleCopyCode = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
          <button className="back-button" onClick={handleBack}>
            ← 戻る
          </button>

          <h2>招待コードを作成</h2>
          <p className="invite-flow-description">
            パートナーにこのコードを共有してください
          </p>

          {!generatedCode ? (
            <button
              className="generate-button"
              onClick={handleGenerateCode}
              disabled={loading}
            >
              {loading ? '生成中...' : 'コードを生成'}
            </button>
          ) : (
            <div className="code-display">
              <div className="invite-code">{generatedCode}</div>
              <button
                className="copy-button"
                onClick={handleCopyCode}
              >
                {copied ? 'コピーしました！' : 'コピー'}
              </button>
              <p className="code-note">
                このコードは24時間有効です
              </p>
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

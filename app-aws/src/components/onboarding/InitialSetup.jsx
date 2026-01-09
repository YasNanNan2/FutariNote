import { useState } from 'react';
import { useInvite } from '../../hooks/useInvite';
import ColorPicker from './ColorPicker';
import './InitialSetup.css';

/**
 * InitialSetup - 初回セットアップフロー
 *
 * 新規ユーザーが最初にpartnerIdを決定する
 * - 新規カップル作成: 新しいpartnerIdを採番
 * - 既存カップル参加: 招待コードからpartnerIdを取得
 */
const InitialSetup = ({ onComplete }) => {
  const [step, setStep] = useState('choice'); // 'choice' | 'join' | 'color'
  const [partnerId, setPartnerId] = useState(null);
  const [inputCode, setInputCode] = useState('');

  const { loading, error, joinCouple, clearError } = useInvite();

  // 新規カップル作成を選択
  const handleCreateNew = () => {
    // 新しいpartnerIdを採番
    const newPartnerId = crypto.randomUUID();
    setPartnerId(newPartnerId);
    setStep('color');
  };

  // 招待コードで参加を選択
  const handleJoinExisting = () => {
    setStep('join');
  };

  // 招待コードを検証して参加
  const handleSubmitCode = async () => {
    if (!inputCode.trim()) return;

    try {
      const result = await joinCouple(inputCode.trim().toUpperCase());
      // joinCoupleが成功したら、色を選択する画面へ
      // partnerIdはjoinCoupleで既に設定済み
      setPartnerId(result.id); // カップルIDをpartnerIdとして使用
      setStep('color-after-join');
    } catch {
      // エラーはフックで処理済み
    }
  };

  // 色選択完了（新規作成の場合）
  const handleColorComplete = async (color) => {
    // partnerIdと色をセットしてonCompleteを呼ぶ
    onComplete?.(color, partnerId);
  };

  // 色選択完了（参加後の場合）
  const handleColorCompleteAfterJoin = async (color) => {
    // 参加時はpartnerIdは既にjoinCoupleで設定済み
    // 色のみを設定してonCompleteを呼ぶ
    onComplete?.(color, null); // partnerIdをnullで渡すと、色のみ更新
  };

  // 選択画面
  if (step === 'choice') {
    return (
      <div className="initial-setup-container">
        <div className="initial-setup-card">
          <div className="setup-icon">💑</div>
          <h2>ふたりノートへようこそ</h2>
          <p className="setup-description">
            パートナーとタスクを共有して<br />
            一緒に家事を管理しましょう
          </p>

          <div className="setup-options">
            <button
              className="setup-option-button primary"
              onClick={handleCreateNew}
            >
              <span className="option-icon">✨</span>
              <span className="option-title">新しく始める</span>
              <span className="option-desc">カップルを作成して招待コードを発行</span>
            </button>

            <button
              className="setup-option-button secondary"
              onClick={handleJoinExisting}
            >
              <span className="option-icon">📥</span>
              <span className="option-title">招待コードがある</span>
              <span className="option-desc">パートナーから受け取ったコードで参加</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 招待コード入力画面
  if (step === 'join') {
    return (
      <div className="initial-setup-container">
        <div className="initial-setup-card">
          <button className="back-button" onClick={() => { setStep('choice'); clearError(); }}>
            ← 戻る
          </button>

          <div className="setup-icon">📥</div>
          <h2>招待コードを入力</h2>
          <p className="setup-description">
            パートナーから受け取った<br />
            6桁のコードを入力してください
          </p>

          <input
            type="text"
            className="code-input"
            placeholder="例: ABC123"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
          />

          {error && <p className="error-message">{error}</p>}

          <button
            className="submit-button"
            onClick={handleSubmitCode}
            disabled={loading || inputCode.length < 6}
          >
            {loading ? '参加中...' : '参加する'}
          </button>
        </div>
      </div>
    );
  }

  // 色選択画面（新規作成）
  if (step === 'color') {
    return <ColorPicker onComplete={handleColorComplete} />;
  }

  // 色選択画面（参加後）
  if (step === 'color-after-join') {
    return <ColorPicker onComplete={handleColorCompleteAfterJoin} />;
  }

  return null;
};

export default InitialSetup;

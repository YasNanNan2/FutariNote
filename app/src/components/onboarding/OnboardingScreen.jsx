import { useState } from 'react';
import { COLORS } from '../../constants';

const OnboardingScreen = ({ onComplete, showNotification }) => {
    const [step, setStep] = useState('welcome');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [selectedColor, setSelectedColor] = useState('#FF6B9D');
    const [inviteCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
    const [tempUser, setTempUser] = useState(null);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #FFF5F7 0%, #F0F9FF 50%, #FFF5F7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Zen Maru Gothic', sans-serif",
        }}>
            <div style={{
                backgroundColor: '#FFF',
                borderRadius: '32px',
                padding: '48px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(255, 107, 157, 0.15)',
                animation: 'fadeSlideUp 0.6s ease-out',
            }}>
                {step === 'welcome' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💑</div>
                            <h1 style={{
                                fontSize: '28px',
                                margin: '0 0 8px',
                                background: 'linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Futari Note</h1>
                            <p style={{ color: '#888', margin: 0, lineHeight: 1.6 }}>
                                夫婦の「言った言わない」をなくし、<br />感謝を循環させるタスク管理アプリ
                            </p>
                        </div>
                        <button
                            onClick={() => setStep('register')}
                            style={{
                                width: '100%',
                                padding: '16px',
                                border: 'none',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                                color: '#FFF',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 8px 24px rgba(255, 107, 157, 0.3)',
                            }}
                        >
                            はじめる ✨
                        </button>
                    </>
                )}

                {step === 'register' && (
                    <>
                        <h2 style={{ textAlign: 'center', margin: '0 0 32px', color: '#333' }}>
                            👋 アカウント作成
                        </h2>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                                ニックネーム
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                placeholder="例: ゆうこ"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #EEE',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #EEE',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                                テーマカラー
                            </label>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            border: selectedColor === color ? '3px solid #333' : '3px solid transparent',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (nickname && email) {
                                    setTempUser({ name: nickname, email, color: selectedColor });
                                    setStep('invite');
                                }
                            }}
                            disabled={!nickname || !email}
                            style={{
                                width: '100%',
                                padding: '16px',
                                border: 'none',
                                borderRadius: '16px',
                                background: nickname && email
                                    ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)' : '#EEE',
                                color: nickname && email ? '#FFF' : '#999',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: nickname && email ? 'pointer' : 'not-allowed',
                            }}
                        >
                            次へ →
                        </button>
                    </>
                )}

                {step === 'invite' && (
                    <>
                        <h2 style={{ textAlign: 'center', margin: '0 0 16px', color: '#333' }}>
                            💌 パートナーを招待
                        </h2>
                        <p style={{ textAlign: 'center', color: '#888', marginBottom: '24px', fontSize: '14px' }}>
                            招待コードを共有して、パートナーを招待しましょう
                        </p>
                        <div style={{
                            backgroundColor: '#F8F8F8',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'center',
                            marginBottom: '20px',
                        }}>
                            <p style={{ margin: '0 0 8px', color: '#666', fontSize: '12px' }}>招待コード</p>
                            <p style={{
                                margin: 0,
                                fontSize: '32px',
                                fontWeight: 'bold',
                                letterSpacing: '4px',
                                color: '#FF6B9D',
                            }}>{inviteCode}</p>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard?.writeText(`Futari Noteに招待されました！\n招待コード: ${inviteCode}`);
                                showNotification('コピーしました！');
                            }}
                            style={{
                                width: '100%',
                                padding: '14px',
                                border: '2px solid #FF6B9D',
                                borderRadius: '12px',
                                background: 'transparent',
                                color: '#FF6B9D',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginBottom: '12px',
                            }}
                        >
                            📋 招待コードをコピー
                        </button>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => onComplete(tempUser, { name: 'パートナー', color: '#4ECDC4' })}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: '#F0F0F0',
                                    color: '#666',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                デモモードで開始
                            </button>
                            <button
                                onClick={() => onComplete(tempUser, null)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
                                    color: '#FFF',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                あとで招待
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OnboardingScreen;

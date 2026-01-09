import React, { useState, useEffect, useCallback } from 'react';

// ===== UTILITY FUNCTIONS =====
const generateId = () => Math.random().toString(36).substring(2, 15);

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
};

const formatFullDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ===== CONSTANTS =====
const STAMPS = [
  { id: 'love', emoji: '💕', label: 'Love' },
  { id: 'thanks', emoji: '🙏', label: 'ありがとう' },
  { id: 'star', emoji: '⭐', label: 'すごい！' },
  { id: 'muscle', emoji: '💪', label: 'お疲れ様' },
  { id: 'sparkle', emoji: '✨', label: 'キラキラ' },
  { id: 'heart', emoji: '❤️', label: '大好き' },
];

const CATEGORIES = [
  { id: 'cleaning', label: '掃除', icon: '🧹', color: '#4ECDC4' },
  { id: 'cooking', label: '料理', icon: '🍳', color: '#FF6B9D' },
  { id: 'shopping', label: '買い物', icon: '🛒', color: '#FFE66D' },
  { id: 'childcare', label: '育児', icon: '👶', color: '#95E1D3' },
  { id: 'pet', label: 'ペット', icon: '🐕', color: '#F8B500' },
  { id: 'other', label: 'その他', icon: '📌', color: '#B8B8D1' },
];

const GOAL_ICONS = [
  { id: 'travel', emoji: '✈️', label: '旅行' },
  { id: 'house', emoji: '🏠', label: 'マイホーム' },
  { id: 'car', emoji: '🚗', label: '車' },
  { id: 'baby', emoji: '👶', label: '子育て' },
  { id: 'ring', emoji: '💍', label: '記念日' },
  { id: 'gift', emoji: '🎁', label: 'プレゼント' },
  { id: 'savings', emoji: '🐷', label: '貯金' },
  { id: 'celebrate', emoji: '🎉', label: 'お祝い' },
];

const COLORS = ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3', '#F8B500', '#B8B8D1'];

// ===== CONFETTI COMPONENT =====
const Confetti = ({ show, onComplete }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (show) {
      const colors = ['#FF6B9D', '#FFE66D', '#4ECDC4', '#95E1D3', '#F8B500', '#FF8C94'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      setParticles(newParticles);
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);
    }
  }, [show, onComplete]);

  if (!show && particles.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall 2s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ===== STAMP SELECTOR COMPONENT =====
const StampSelector = ({ onSelect, onClose }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  }} onClick={onClose}>
    <div style={{
      backgroundColor: '#FFF',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      animation: 'popIn 0.3s ease-out',
    }} onClick={e => e.stopPropagation()}>
      <h3 style={{ 
        margin: '0 0 16px', 
        fontFamily: "'Zen Maru Gothic', sans-serif",
        color: '#333',
        textAlign: 'center',
      }}>感謝を伝える 💝</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>
        {STAMPS.map(stamp => (
          <button
            key={stamp.id}
            onClick={() => onSelect(stamp)}
            style={{
              padding: '16px',
              border: 'none',
              borderRadius: '16px',
              backgroundColor: '#FFF5F7',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '32px' }}>{stamp.emoji}</span>
            <span style={{ fontSize: '10px', color: '#666' }}>{stamp.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ===== ONBOARDING COMPONENT =====
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
                夫婦の「言った言わない」をなくし、<br/>感謝を循環させるタスク管理アプリ
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
      
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ===== TASK MODAL COMPONENT =====
const TaskModal = ({ task, currentUser, partner, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [date, setDate] = useState(task?.date || new Date().toISOString().split('T')[0]);
  const [assignee, setAssignee] = useState(task?.assignee || currentUser?.name);
  const [category, setCategory] = useState(task?.category || 'other');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: '24px 24px 0 0',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        animation: 'slideUp 0.3s ease-out',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
          {task ? '📝 タスクを編集' : '✨ 新しいタスク'}
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タスク名を入力..."
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #EEE',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
              📅 日付
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #EEE',
                borderRadius: '12px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
              👤 担当
            </label>
            <select
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #EEE',
                borderRadius: '12px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option value={currentUser?.name}>{currentUser?.name}</option>
              {partner && <option value={partner.name}>{partner.name}</option>}
            </select>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
            🏷️ カテゴリ
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  border: category === cat.id ? `2px solid ${cat.color}` : '2px solid #EEE',
                  borderRadius: '20px',
                  backgroundColor: category === cat.id ? `${cat.color}20` : '#FFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {task && (
            <button
              onClick={onDelete}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: '#FEE',
                color: '#E55',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              🗑️ 削除
            </button>
          )}
          <button
            onClick={() => title && onSave({ title, date, assignee, category })}
            disabled={!title}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              background: title ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)' : '#EEE',
              color: title ? '#FFF' : '#999',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: title ? 'pointer' : 'not-allowed',
            }}
          >
            {task ? '更新する' : '追加する'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ===== GOAL MODAL COMPONENT =====
const GoalModal = ({ goal, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [amount, setAmount] = useState(goal?.amount || '');
  const [current, setCurrent] = useState(goal?.current || 0);
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [icon, setIcon] = useState(goal?.icon || GOAL_ICONS[0]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: '24px',
        padding: '24px',
        width: '100%',
        maxWidth: '400px',
        animation: 'popIn 0.3s ease-out',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
          {goal ? '🎯 目標を編集' : '🎯 新しい目標'}
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
            アイコン
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {GOAL_ICONS.map(i => (
              <button
                key={i.id}
                onClick={() => setIcon(i)}
                style={{
                  width: '44px',
                  height: '44px',
                  border: icon.id === i.id ? '2px solid #FF6B9D' : '2px solid #EEE',
                  borderRadius: '12px',
                  backgroundColor: icon.id === i.id ? '#FFF5F7' : '#FFF',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                {i.emoji}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
            目標タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例: 沖縄旅行"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #EEE',
              borderRadius: '12px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
              目標金額 (円)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="100000"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #EEE',
                borderRadius: '12px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
              現在の金額 (円)
            </label>
            <input
              type="number"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #EEE',
                borderRadius: '12px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
            期限
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #EEE',
              borderRadius: '12px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {goal && (
            <button
              onClick={onDelete}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: '#FEE',
                color: '#E55',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => title && amount && onSave({ 
              title, 
              amount: Number(amount), 
              current: Number(current), 
              deadline, 
              icon 
            })}
            disabled={!title || !amount}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              background: title && amount ? 'linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%)' : '#EEE',
              color: title && amount ? '#FFF' : '#999',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: title && amount ? 'pointer' : 'not-allowed',
            }}
          >
            {goal ? '更新する' : '設定する'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// ===== SETTINGS COMPONENT =====
const SettingsTab = ({ currentUser, partner, onUpdateUser, showNotification }) => {
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editColor, setEditColor] = useState(currentUser?.color || '#FF6B9D');
  const [notifications, setNotifications] = useState(true);
  
  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <h2 style={{ margin: '0 0 24px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
        ⚙️ 設定
      </h2>
      
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>👤 プロフィール</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
            ニックネーム
          </label>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #EEE',
              borderRadius: '12px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
            テーマカラー
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => setEditColor(color)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: editColor === color ? '3px solid #333' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={() => {
            onUpdateUser({ name: editName, color: editColor });
            showNotification('プロフィールを更新しました', 'success');
          }}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
            color: '#FFF',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          保存
        </button>
      </div>
      
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>🔔 通知設定</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>プッシュ通知</span>
          <button
            onClick={() => setNotifications(!notifications)}
            style={{
              width: '50px',
              height: '28px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: notifications ? '#4ECDC4' : '#DDD',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#FFF',
              position: 'absolute',
              top: '2px',
              left: notifications ? '24px' : '2px',
              transition: 'left 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </div>
      
      {partner && (
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>💑 連携情報</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#F8F8F8',
            borderRadius: '12px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: partner.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 'bold',
            }}>
              {partner.name[0]}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{partner.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>連携中</p>
            </div>
          </div>
        </div>
      )}
      
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#E55' }}>⚠️ 危険な操作</h3>
        <button
          onClick={() => {
            if (window.confirm('本当にすべてのデータを削除しますか？')) {
              localStorage.removeItem('futariNote');
              window.location.reload();
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #E55',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            color: '#E55',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          アカウントを削除
        </button>
      </div>
    </div>
  );
};

// ===== MAIN APP =====
export default function FutariNote() {
  const [currentUser, setCurrentUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [thanksCount, setThanksCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStampSelector, setShowStampSelector] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('futariNote');
    if (saved) {
      const data = JSON.parse(saved);
      setCurrentUser(data.currentUser);
      setPartner(data.partner);
      setTasks(data.tasks || []);
      setGoals(data.goals || []);
      setTimeline(data.timeline || []);
      setThanksCount(data.thanksCount || 0);
      if (data.currentUser) setIsOnboarding(false);
    }
  }, []);

  useEffect(() => {
    if (!isOnboarding && currentUser) {
      localStorage.setItem('futariNote', JSON.stringify({
        currentUser, partner, tasks, goals, timeline, thanksCount,
      }));
    }
  }, [currentUser, partner, tasks, goals, timeline, thanksCount, isOnboarding]);

  const showNotificationFn = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addTimelineEntry = useCallback((action, details) => {
    setTimeline(prev => [{
      id: generateId(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name,
      userColor: currentUser?.color,
      action,
      details,
    }, ...prev].slice(0, 100));
  }, [currentUser]);

  const handleOnboardingComplete = (user, partnerData) => {
    setCurrentUser(user);
    setPartner(partnerData);
    setIsOnboarding(false);
    if (partnerData) showNotificationFn('パートナーが参加しました！', 'success');
  };

  const handleTaskSave = (taskData) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
      addTimelineEntry('edit', `「${taskData.title}」を編集しました`);
    } else {
      const newTask = {
        id: generateId(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name,
      };
      setTasks(prev => [...prev, newTask]);
      addTimelineEntry('create', `「${taskData.title}」を追加しました`);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskDelete = () => {
    if (editingTask) {
      setTasks(prev => prev.filter(t => t.id !== editingTask.id));
      addTimelineEntry('delete', `「${editingTask.title}」を削除しました`);
      setShowTaskModal(false);
      setEditingTask(null);
    }
  };

  const handleGoalSave = (goalData) => {
    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g));
    } else {
      setGoals(prev => [...prev, { id: generateId(), ...goalData, createdAt: new Date().toISOString() }]);
      addTimelineEntry('goal', `目標「${goalData.title}」を設定しました`);
    }
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const completeTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
    ));
    if (task) {
      addTimelineEntry('complete', `「${task.title}」を完了しました`);
      setShowConfetti(true);
    }
  };

  const undoComplete = (taskId) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: false, completedAt: null } : t
    ));
    showNotificationFn('完了を取り消しました');
  };

  const sendStamp = (taskId, stamp) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setThanksCount(prev => prev + 1);
      addTimelineEntry('stamp', `${stamp.emoji} を「${task.title}」に送りました`);
      showNotificationFn(`${stamp.emoji} を送りました！`, 'success');
    }
    setShowStampSelector(null);
  };

  // ===== HOME TAB =====
  const renderHome = () => {
    const myTasks = filter === 'mine' 
      ? tasks.filter(t => !t.completed && t.assignee === currentUser?.name)
      : tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed).slice(0, 5);
    
    return (
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
              こんにちは、{currentUser?.name} さん 👋
            </h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>
              {formatFullDate(new Date())}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: currentUser?.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFF', fontWeight: 'bold',
            }}>
              {currentUser?.name?.[0]}
            </div>
            {partner && (
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: partner.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFF', fontWeight: 'bold',
                marginLeft: '-16px', border: '2px solid #FFF',
              }}>
                {partner.name?.[0]}
              </div>
            )}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #FFE66D 0%, #F8B500 100%)',
          borderRadius: '20px', padding: '20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(248, 181, 0, 0.2)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>💝 Thanks Count</p>
            <p style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: 'bold' }}>{thanksCount}</p>
          </div>
          <div style={{ fontSize: '48px' }}>🎉</div>
        </div>
        
        {goals.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '16px' }}>🎯 目標</h2>
              <button
                onClick={() => setShowGoalModal(true)}
                style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#F0F0F0', fontSize: '12px', cursor: 'pointer' }}
              >
                + 追加
              </button>
            </div>
            {goals.map(goal => {
              const progress = Math.min((goal.current / goal.amount) * 100, 100);
              return (
                <div
                  key={goal.id}
                  onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                  style={{
                    backgroundColor: '#FFF', borderRadius: '16px', padding: '16px',
                    marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{goal.icon.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '16px' }}>{goal.title}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                        {goal.deadline && `期限: ${formatDate(goal.deadline)}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#4ECDC4' }}>
                        {goal.current.toLocaleString()}円
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        / {goal.amount.toLocaleString()}円
                      </p>
                    </div>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`, height: '100%',
                      background: 'linear-gradient(90deg, #4ECDC4 0%, #95E1D3 100%)',
                      borderRadius: '4px', transition: 'width 0.5s ease-out',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {goals.length === 0 && (
          <button
            onClick={() => setShowGoalModal(true)}
            style={{
              width: '100%', padding: '20px', border: '2px dashed #DDD', borderRadius: '16px',
              backgroundColor: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '24px',
            }}
          >
            🎯 共通の目標を設定する
          </button>
        )}
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['all', 'mine'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '20px',
                backgroundColor: filter === f ? '#FF6B9D' : '#F0F0F0',
                color: filter === f ? '#FFF' : '#666', fontSize: '13px', cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'すべて' : '自分の担当'}
            </button>
          ))}
        </div>
        
        <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>📋 未完了タスク ({myTasks.length})</h2>
        
        {myTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎊</div>
            <p>すべてのタスクが完了しました！</p>
          </div>
        ) : (
          myTasks.map(task => {
            const cat = CATEGORIES.find(c => c.id === task.category);
            const isMyTask = task.assignee === currentUser?.name;
            return (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#FFF', borderRadius: '16px', padding: '16px',
                  marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  borderLeft: `4px solid ${isMyTask ? currentUser?.color : partner?.color || '#888'}`,
                }}
              >
                <button
                  onClick={() => completeTask(task.id)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: '2px solid #DDD', backgroundColor: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  ✓
                </button>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{cat?.icon}</span>
                    <h3 style={{ margin: 0, fontSize: '15px' }}>{task.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: '#888' }}>
                    <span>📅 {formatDate(task.date)}</span>
                    <span>👤 {task.assignee}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {completedTasks.length > 0 && (
          <>
            <h2 style={{ margin: '24px 0 12px', fontSize: '16px' }}>✅ 完了済み</h2>
            {completedTasks.map(task => {
              const cat = CATEGORIES.find(c => c.id === task.category);
              return (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: '#F8F8F8', borderRadius: '16px', padding: '16px',
                    marginBottom: '12px', display: 'flex', alignItems: 'center',
                    gap: '12px', opacity: 0.7,
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#4ECDC4', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#FFF', flexShrink: 0,
                  }}>
                    ✓
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{cat?.icon}</span>
                      <h3 style={{ margin: 0, fontSize: '15px', textDecoration: 'line-through', color: '#888' }}>
                        {task.title}
                      </h3>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowStampSelector(task.id)}
                      style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#FFE4EC', fontSize: '14px', cursor: 'pointer' }}
                    >
                      💝
                    </button>
                    <button
                      onClick={() => undoComplete(task.id)}
                      style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#EEE', fontSize: '12px', cursor: 'pointer' }}
                    >
                      ↩️
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  };

  // ===== CALENDAR TAB =====
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    
    const days = [...Array(startWeekday).fill(null), ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)];
    
    const getTasksForDay = (day) => {
      if (!day) return [];
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return tasks.filter(t => t.date === dateStr);
    };
    
    const getGoalsForDay = (day) => {
      if (!day) return [];
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return goals.filter(g => g.deadline === dateStr);
    };
    
    const today = new Date();
    const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    
    return (
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setCalendarMonth(new Date(year, month - 1))}
            style={{ padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#F0F0F0', cursor: 'pointer', fontSize: '16px' }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, fontFamily: "'Zen Maru Gothic', sans-serif" }}>{year}年 {month + 1}月</h2>
          <button
            onClick={() => setCalendarMonth(new Date(year, month + 1))}
            style={{ padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#F0F0F0', cursor: 'pointer', fontSize: '16px' }}
          >
            →
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', padding: '8px', fontSize: '12px',
              color: i === 0 ? '#E55' : i === 6 ? '#55A' : '#888', fontWeight: 'bold',
            }}>
              {d}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {days.map((day, idx) => {
            const dayTasks = getTasksForDay(day);
            const dayGoals = getGoalsForDay(day);
            const weekday = idx % 7;
            
            return (
              <div
                key={idx}
                onClick={() => {
                  if (day) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    setSelectedDate({ date: dateStr, tasks: dayTasks, goals: dayGoals });
                  }
                }}
                style={{
                  aspectRatio: '1',
                  backgroundColor: day ? (isToday(day) ? '#FF6B9D' : '#FFF') : 'transparent',
                  borderRadius: '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'flex-start', padding: '8px 4px',
                  cursor: day ? 'pointer' : 'default',
                  boxShadow: day ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {day && (
                  <>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isToday(day) ? 'bold' : 'normal',
                      color: isToday(day) ? '#FFF' : weekday === 0 ? '#E55' : weekday === 6 ? '#55A' : '#333',
                    }}>
                      {day}
                    </span>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {dayTasks.slice(0, 3).map((t, i) => (
                        <div
                          key={i}
                          style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: t.completed ? '#4ECDC4' : 
                              t.assignee === currentUser?.name ? currentUser?.color : partner?.color || '#888',
                          }}
                        />
                      ))}
                      {dayGoals.length > 0 && <span style={{ fontSize: '10px' }}>🚩</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {selectedDate && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 100, backdropFilter: 'blur(4px)',
          }} onClick={() => setSelectedDate(null)}>
            <div style={{
              backgroundColor: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px',
              width: '100%', maxWidth: '500px', maxHeight: '60vh', overflowY: 'auto',
              animation: 'slideUp 0.3s ease-out',
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                📅 {formatFullDate(selectedDate.date)}
              </h3>
              
              {selectedDate.goals.length > 0 && (
                <>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#888' }}>🚩 目標期限</h4>
                  {selectedDate.goals.map(goal => (
                    <div key={goal.id} style={{ padding: '12px', backgroundColor: '#F0FFF4', borderRadius: '12px', marginBottom: '8px' }}>
                      {goal.icon.emoji} {goal.title}
                    </div>
                  ))}
                </>
              )}
              
              {selectedDate.tasks.length > 0 ? (
                selectedDate.tasks.map(task => {
                  const cat = CATEGORIES.find(c => c.id === task.category);
                  return (
                    <div key={task.id} style={{
                      padding: '12px',
                      backgroundColor: task.completed ? '#F0F0F0' : '#FFF',
                      border: '1px solid #EEE', borderRadius: '12px', marginBottom: '8px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <span>{cat?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#888' : '#333' }}>
                          {task.title}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>👤 {task.assignee}</p>
                      </div>
                      {task.completed && <span style={{ color: '#4ECDC4' }}>✓</span>}
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>この日のタスクはありません</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== TIMELINE TAB =====
  const renderTimeline = () => (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <h2 style={{ margin: '0 0 20px', fontFamily: "'Zen Maru Gothic', sans-serif" }}>📜 タイムライン</h2>
      
      <div style={{
        background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
        borderRadius: '20px', padding: '20px', marginBottom: '24px',
        color: '#FFF', textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>感謝の総数</p>
        <p style={{ margin: '8px 0', fontSize: '48px', fontWeight: 'bold' }}>💝 {thanksCount}</p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>これまでに送った「ありがとう」</p>
      </div>
      
      {timeline.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <p>まだ履歴がありません</p>
          <p style={{ fontSize: '14px' }}>タスクを追加・完了すると履歴が表示されます</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '2px', backgroundColor: '#EEE' }} />
          {timeline.map((entry, idx) => (
            <div key={entry.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both` }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: entry.userColor || '#FF6B9D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFF', fontWeight: 'bold', fontSize: '14px',
                flexShrink: 0, zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {entry.user?.[0] || '?'}
              </div>
              <div style={{
                flex: 1, backgroundColor: '#FFF', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{entry.user}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>{entry.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );

  // ===== MAIN RENDER =====
  if (isOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} showNotification={showNotificationFn} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: "'Zen Maru Gothic', sans-serif" }}>
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: notification.type === 'success' ? '#4ECDC4' : '#333',
          color: '#FFF', padding: '12px 24px', borderRadius: '12px',
          zIndex: 1000, animation: 'fadeSlideDown 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {notification.message}
        </div>
      )}
      
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {showStampSelector && (
        <StampSelector
          onSelect={(stamp) => sendStamp(showStampSelector, stamp)}
          onClose={() => setShowStampSelector(null)}
        />
      )}
      
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          currentUser={currentUser}
          partner={partner}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        />
      )}
      
      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          onSave={handleGoalSave}
          onDelete={() => { setGoals(prev => prev.filter(g => g.id !== editingGoal.id)); setShowGoalModal(false); setEditingGoal(null); }}
          onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
        />
      )}
      
      {activeTab === 'home' && renderHome()}
      {activeTab === 'calendar' && renderCalendar()}
      {activeTab === 'timeline' && renderTimeline()}
      {activeTab === 'settings' && (
        <SettingsTab
          currentUser={currentUser}
          partner={partner}
          onUpdateUser={(updates) => setCurrentUser(prev => ({ ...prev, ...updates }))}
          showNotification={showNotificationFn}
        />
      )}
      
      {(activeTab === 'home' || activeTab === 'calendar') && (
        <button
          onClick={() => setShowTaskModal(true)}
          style={{
            position: 'fixed', right: '20px', bottom: '100px',
            width: '60px', height: '60px', borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C94 100%)',
            color: '#FFF', fontSize: '28px', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(255, 107, 157, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50,
          }}
        >
          +
        </button>
      )}
      
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF', borderTop: '1px solid #EEE',
        display: 'flex', justifyContent: 'space-around',
        padding: '12px 0 20px', zIndex: 50,
      }}>
        {[
          { id: 'home', icon: '🏠', label: 'ホーム' },
          { id: 'calendar', icon: '📅', label: 'カレンダー' },
          { id: 'timeline', icon: '📜', label: '履歴' },
          { id: 'settings', icon: '⚙️', label: '設定' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              border: 'none', background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', cursor: 'pointer',
              opacity: activeTab === tab.id ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: '24px' }}>{tab.icon}</span>
            <span style={{
              fontSize: '10px',
              color: activeTab === tab.id ? '#FF6B9D' : '#888',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

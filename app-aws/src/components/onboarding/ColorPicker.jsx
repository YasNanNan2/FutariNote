import { useState } from 'react';
import { COLORS } from '../../constants';
import './ColorPicker.css';

/**
 * ColorPicker - ユーザーカラー選択コンポーネント
 *
 * 初回登録時にユーザーが自分のテーマカラーを選択
 * カスタム属性 'custom:color' として Cognito に保存
 */
const ColorPicker = ({ onColorSelect, onComplete }) => {
  const [selectedColor, setSelectedColor] = useState(null);

  const handleColorClick = (color) => {
    setSelectedColor(color);
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  const handleComplete = () => {
    if (selectedColor && onComplete) {
      onComplete(selectedColor);
    }
  };

  return (
    <div className="color-picker-container">
      <div className="color-picker-card">
        <h2>あなたのテーマカラーを選んでください</h2>
        <p className="color-picker-description">
          選んだ色は、アプリ内であなたを識別するために使用されます
        </p>

        <div className="color-options">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-button ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              aria-label={`色 ${color} を選択`}
            >
              {selectedColor === color && (
                <span className="check-icon">✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          className="complete-button"
          onClick={handleComplete}
          disabled={!selectedColor}
        >
          完了
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;

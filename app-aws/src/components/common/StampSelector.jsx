import { STAMPS } from '../../constants';

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
            }}>感謝を伝える</h3>
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

export default StampSelector;

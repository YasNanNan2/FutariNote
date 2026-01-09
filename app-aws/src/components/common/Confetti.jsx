import { useEffect } from 'react';

// 固定のパーティクル配置（純粋関数）
const PARTICLES = [
    { id: 0, x: 5, color: '#FF6B9D', delay: 0.1, rotation: 45, size: 8 },
    { id: 1, x: 15, color: '#FFE66D', delay: 0.2, rotation: 90, size: 6 },
    { id: 2, x: 25, color: '#4ECDC4', delay: 0.05, rotation: 135, size: 10 },
    { id: 3, x: 35, color: '#95E1D3', delay: 0.3, rotation: 180, size: 7 },
    { id: 4, x: 45, color: '#F8B500', delay: 0.15, rotation: 225, size: 9 },
    { id: 5, x: 55, color: '#FF8C94', delay: 0.25, rotation: 270, size: 5 },
    { id: 6, x: 65, color: '#FF6B9D', delay: 0.4, rotation: 315, size: 8 },
    { id: 7, x: 75, color: '#FFE66D', delay: 0.08, rotation: 360, size: 11 },
    { id: 8, x: 85, color: '#4ECDC4', delay: 0.35, rotation: 60, size: 6 },
    { id: 9, x: 95, color: '#95E1D3', delay: 0.18, rotation: 120, size: 9 },
    { id: 10, x: 10, color: '#F8B500', delay: 0.28, rotation: 150, size: 7 },
    { id: 11, x: 20, color: '#FF8C94', delay: 0.12, rotation: 200, size: 10 },
    { id: 12, x: 30, color: '#FF6B9D', delay: 0.38, rotation: 250, size: 5 },
    { id: 13, x: 40, color: '#FFE66D', delay: 0.22, rotation: 300, size: 8 },
    { id: 14, x: 50, color: '#4ECDC4', delay: 0.02, rotation: 30, size: 12 },
    { id: 15, x: 60, color: '#95E1D3', delay: 0.32, rotation: 75, size: 6 },
    { id: 16, x: 70, color: '#F8B500', delay: 0.16, rotation: 110, size: 9 },
    { id: 17, x: 80, color: '#FF8C94', delay: 0.26, rotation: 165, size: 7 },
    { id: 18, x: 90, color: '#FF6B9D', delay: 0.42, rotation: 210, size: 11 },
    { id: 19, x: 100, color: '#FFE66D', delay: 0.06, rotation: 255, size: 5 },
    { id: 20, x: 8, color: '#4ECDC4', delay: 0.36, rotation: 285, size: 8 },
    { id: 21, x: 18, color: '#95E1D3', delay: 0.14, rotation: 330, size: 10 },
    { id: 22, x: 28, color: '#F8B500', delay: 0.24, rotation: 15, size: 6 },
    { id: 23, x: 38, color: '#FF8C94', delay: 0.44, rotation: 85, size: 9 },
    { id: 24, x: 48, color: '#FF6B9D', delay: 0.04, rotation: 140, size: 7 },
];

const Confetti = ({ show, onComplete }) => {
    useEffect(() => {
        if (show && onComplete) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show) return null;

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
            {PARTICLES.map((p) => (
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
        </div>
    );
};

export default Confetti;

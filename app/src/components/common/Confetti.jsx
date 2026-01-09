import { useState, useEffect } from 'react';

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
        </div>
    );
};

export default Confetti;

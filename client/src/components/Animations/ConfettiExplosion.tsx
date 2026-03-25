import { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  size: number;
  color: string;
  life: number;
}

interface ConfettiExplosionProps {
  x?: number;
  y?: number;
  intensity?: number;
  duration?: number;
  colors?: string[];
}

export default function ConfettiExplosion({
  x = window.innerWidth / 2,
  y = window.innerHeight / 2,
  intensity = 50,
  duration = 3000,
  colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
}: ConfettiExplosionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Gerar confete
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < intensity; i++) {
      const angle = (Math.PI * 2 * i) / intensity;
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * (Math.random() * 8 + 4),
        vy: Math.sin(angle) * (Math.random() * 8 + 4) - 5,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    piecesRef.current = pieces;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const piece = pieces[i];

        // Atualizar posição
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.2; // Gravidade
        piece.angle += piece.angularVelocity;
        piece.life = 1 - progress;

        // Desenhar confete
        ctx.save();
        ctx.globalAlpha = piece.life;
        ctx.fillStyle = piece.color;
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();
      }

      if (progress < 1) {
        animationIdRef.current = requestAnimationFrame(animate);
      } else {
        canvas.style.display = 'none';
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [x, y, intensity, duration, colors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

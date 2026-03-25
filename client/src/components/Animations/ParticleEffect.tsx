import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  type: 'circle' | 'star' | 'square';
}

interface ParticleEffectProps {
  x: number;
  y: number;
  count?: number;
  type?: 'circle' | 'star' | 'square' | 'mixed';
  color?: string;
  duration?: number;
}

export default function ParticleEffect({
  x,
  y,
  count = 30,
  type = 'circle',
  color = '#10b981',
  duration = 2000,
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const types: Array<'circle' | 'star' | 'square'> = type === 'mixed' 
      ? ['circle', 'star', 'square'] 
      : [type];

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = Math.random() * 6 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: color || `hsl(${Math.random() * 360}, 100%, 50%)`,
        opacity: 1,
        life: 1,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }

    const startTime = Date.now();

    const drawStar = (cx: number, cy: number, size: number) => {
      const spikes = 5;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? size : size / 2;
        const angle = i * step;
        const px = cx + Math.sin(angle) * radius;
        const py = cy - Math.cos(angle) * radius;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1;
        particle.life = Math.max(0, 1 - progress);
        particle.opacity = particle.life;

        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        if (particle.type === 'circle') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'star') {
          drawStar(particle.x, particle.y, particle.size);
          ctx.fill();
        } else if (particle.type === 'square') {
          ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
          );
        }

        ctx.restore();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        canvas.style.display = 'none';
      }
    };

    requestAnimationFrame(animate);
  }, [x, y, count, type, color, duration]);

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

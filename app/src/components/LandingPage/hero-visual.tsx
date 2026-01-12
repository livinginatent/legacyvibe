/* eslint-disable react-hooks/purity */
'use client';
import { useEffect, useState } from "react";

const HeroVisual = () => {
  const [scanPosition, setScanPosition] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate random code blocks (stable on client)
  const [chaoticBlocks] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 25,
      y: 10 + Math.random() * 80,
      width: 30 + Math.random() * 40,
      height: 8 + Math.random() * 15,
      rotation: -15 + Math.random() * 30,
      delay: i * 0.1,
    }))
  );

  // Generate floating particles (stable on client)
  const [floatingParticles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: 20 + Math.random() * 60,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 2,
    }))
  );

  // Generate structured output blocks
  const structuredBlocks = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    y: 10 + i * 14,
  }));

  return (
    <div className="relative w-full h-[400px] lg:h-[500px]">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-3xl" />

      {/* Scanner center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />

      {/* Scanning beam */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent blur-sm"
        style={{ top: `${scanPosition}%` }}
      />

      {/* Left side - Chaotic code blocks */}
      <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {isClient && chaoticBlocks.map((block) => (
            <g
              key={block.id}
              className="animate-float"
              style={{ animationDelay: `${block.delay}s` }}
            >
              <rect
                x={block.x}
                y={block.y}
                width={block.width}
                height={block.height}
                rx="1"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="0.3"
                opacity="0.4"
                transform={`rotate(${block.rotation} ${
                  block.x + block.width / 2
                } ${block.y + block.height / 2})`}
              />
              {/* Code lines inside */}
              <line
                x1={block.x + 2}
                y1={block.y + 3}
                x2={block.x + block.width * 0.6}
                y2={block.y + 3}
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                opacity="0.3"
                transform={`rotate(${block.rotation} ${
                  block.x + block.width / 2
                } ${block.y + block.height / 2})`}
              />
              <line
                x1={block.x + 2}
                y1={block.y + 6}
                x2={block.x + block.width * 0.4}
                y2={block.y + 6}
                stroke="hsl(var(--secondary))"
                strokeWidth="0.5"
                opacity="0.3"
                transform={`rotate(${block.rotation} ${
                  block.x + block.width / 2
                } ${block.y + block.height / 2})`}
              />
            </g>
          ))}

          {/* Connecting tangled lines */}
          <path
            d="M20,20 Q40,35 25,50 T35,80"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.2"
            opacity="0.3"
          />
          <path
            d="M30,15 Q45,40 40,60 T30,85"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="0.2"
            opacity="0.3"
          />
        </svg>

        {/* "VIBE CODE" label */}
        <div className="absolute top-4 left-4 font-mono text-xs text-primary/50 uppercase tracking-widest">
          Vibe Code
        </div>
      </div>

      {/* Center scanner */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-primary/50" />
        <div className="absolute inset-4 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* Right side - Structured output */}
      <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {structuredBlocks.map((block, i) => (
            <g key={block.id}>
              {/* Document icon */}
              <rect
                x="55"
                y={block.y}
                width="35"
                height="10"
                rx="1"
                fill="hsl(var(--primary))"
                fillOpacity="0.1"
                stroke="hsl(var(--primary))"
                strokeWidth="0.3"
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              {/* Document lines */}
              <line
                x1="58"
                y1={block.y + 3}
                x2="85"
                y2={block.y + 3}
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                opacity="0.5"
              />
              <line
                x1="58"
                y1={block.y + 6}
                x2="78"
                y2={block.y + 6}
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </g>
          ))}

          {/* Connecting flow lines from center */}
          <path
            d="M50,50 Q60,50 55,20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.3"
            opacity="0.4"
            strokeDasharray="2 2"
          />
          <path
            d="M50,50 Q65,55 55,80"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.3"
            opacity="0.4"
            strokeDasharray="2 2"
          />
        </svg>

        {/* "BLUEPRINT" label */}
        <div className="absolute top-4 right-4 font-mono text-xs text-primary/50 uppercase tracking-widest">
          Blueprint
        </div>
      </div>

      {/* Floating particles */}
      {isClient &&
        floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
    </div>
  );
};

export default HeroVisual;

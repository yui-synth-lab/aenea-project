import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import '../styles/somnia.css';

interface HormonalField {
  serotonin: number;
  dopamine: number;
  cortisol: number;
  oxytocin: number;
}

interface SomniaState {
  timestamp: number;
  mode: 'awake' | 'dream' | 'flow';
  somatic: {
    lambda: number;
    phi: number;
    mu?: HormonalField;
  };
  affective: {
    theta: number;
    psi: number;
    xi: number;
  };
  cognitive?: {
    qualia?: string;
    temporalDilation?: number;
  };
}

interface SomniaVisualizerProps {
  somniaState?: SomniaState;
}

// SVG arc helper
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

interface HormonalArcProps {
  cx: number; cy: number; r: number;
  startDeg: number; gapDeg: number;
  value: number; color: string; label: string; symbol: string;
}

const HormonalArc: React.FC<HormonalArcProps> = ({ cx, cy, r, startDeg, gapDeg, value, color, label, symbol }) => {
  const spanDeg = 90 - gapDeg;
  const filledDeg = spanDeg * Math.max(0, Math.min(1, value));
  const trackPath = arcPath(cx, cy, r, startDeg, startDeg + spanDeg);
  const fillPath = filledDeg > 0.5 ? arcPath(cx, cy, r, startDeg, startDeg + filledDeg) : '';
  const midDeg = startDeg + spanDeg / 2;
  const labelPos = polarToXY(cx, cy, r + 14, midDeg);

  return (
    <g>
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" />
      {fillPath && (
        <motion.path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
      <text
        x={labelPos.x} y={labelPos.y}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill="rgba(255,255,255,0.5)"
        style={{ fontFamily: 'monospace' }}
      >
        {symbol}
      </text>
    </g>
  );
};

// Psi wave (ECG-like)
const PsiWave: React.FC<{ psi: number; xi: number; color: string }> = ({ psi, xi, color }) => {
  const width = 200;
  const height = 36;
  const cx = width / 2;
  const cy = height / 2;
  const amplitude = 10 + psi * 8;
  const noise = xi * 2;

  const points: [number, number][] = [];
  for (let i = 0; i <= width; i += 2) {
    const t = (i / width) * Math.PI * 4;
    const base = Math.sin(t) * amplitude;
    const jitter = (Math.random() - 0.5) * noise;
    // ECG spike at center
    let spike = 0;
    const dist = Math.abs(i - cx);
    if (dist < 12) spike = Math.exp(-(dist * dist) / 20) * amplitude * 1.8;
    points.push([i, cy - base - spike + jitter]);
  }

  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 3px ${color})`, opacity: 0.8 }} />
    </svg>
  );
};

export const SomniaVisualizer: React.FC<SomniaVisualizerProps> = ({ somniaState }) => {
  const orbControls = useAnimation();
  const prevQualiaRef = useRef<string | undefined>(undefined);
  const [qualiaVisible, setQualiaVisible] = useState(true);

  const mode = somniaState?.mode ?? 'awake';
  const lambda = somniaState?.somatic?.lambda ?? 0;
  const phi = somniaState?.somatic?.phi ?? 50;
  const mu = somniaState?.somatic?.mu;
  const theta = somniaState?.affective?.theta ?? 0;
  const psi = somniaState?.affective?.psi ?? 0;
  const xi = somniaState?.affective?.xi ?? 0;
  const qualia = somniaState?.cognitive?.qualia;

  // Orb appearance
  const modeColors = {
    awake:  { core: '#fcd34d', mid: '#f59e0b', glow: 'rgba(252,211,77,0.35)', outer: 'rgba(252,211,77,0.08)' },
    dream:  { core: '#c4b5fd', mid: '#818cf8', glow: 'rgba(165,180,252,0.35)', outer: 'rgba(165,180,252,0.08)' },
    flow:   { core: '#67e8f9', mid: '#22d3ee', glow: 'rgba(103,232,249,0.35)', outer: 'rgba(103,232,249,0.08)' },
  };
  const mc = modeColors[mode];

  // Lambda shifts orb color toward red (negative) or green (positive)
  const lambdaHue = lambda >= 0
    ? `rgba(16,185,129,${lambda * 0.4})`
    : `rgba(239,68,68,${Math.abs(lambda) * 0.4})`;

  // Breath animation: phi controls speed, mode controls scale
  const breathDuration = mode === 'dream' ? 5 : mode === 'flow' ? 2.5 : 3.5 - (phi / 100) * 1.5;
  const breathScale = 1 + 0.06 + psi * 0.04;

  useEffect(() => {
    orbControls.start({
      scale: [1, breathScale, 1],
      transition: { duration: breathDuration, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [breathDuration, breathScale, mode]);

  // Qualia fade on change
  useEffect(() => {
    if (qualia && qualia !== prevQualiaRef.current) {
      setQualiaVisible(false);
      const t = setTimeout(() => {
        prevQualiaRef.current = qualia;
        setQualiaVisible(true);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [qualia]);

  const orbSize = 120;
  const cx = orbSize / 2;
  const cy = orbSize / 2;

  // Hormonal arcs (ring around orb, 4 quadrants)
  const hormonalArcs = mu ? [
    { value: mu.serotonin,  color: '#34d399', symbol: 'SER', label: 'Serotonin',  startDeg: 5,   gapDeg: 8 },
    { value: mu.dopamine,   color: '#fbbf24', symbol: 'DOP', label: 'Dopamine',   startDeg: 95,  gapDeg: 8 },
    { value: mu.cortisol,   color: '#f87171', symbol: 'COR', label: 'Cortisol',   startDeg: 185, gapDeg: 8 },
    { value: mu.oxytocin,   color: '#e879f9', symbol: 'OXT', label: 'Oxytocin',   startDeg: 275, gapDeg: 8 },
  ] : [];

  const waveColor = mode === 'awake' ? '#fcd34d' : mode === 'dream' ? '#a5b4fc' : '#67e8f9';

  if (!somniaState) {
    return (
      <div className="dashboard-card somnia-visualizer empty">
        <Heart size={24} opacity={0.3} />
        <span style={{ color: 'var(--cyber-text-dim)', fontSize: '0.875rem' }}>Waiting for SOMNIA state...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-card somnia-visualizer">
      {/* Header */}
      <div className="somnia-header">
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyber-text)' }}>
          <Heart size={16} style={{ color: mc.mid }} />
          SOMNIA Engine
        </h3>
        <div className={`somnia-mode-badge ${mode}`}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}>{mode.toUpperCase()}</span>
        </div>
      </div>

      {/* Central orb + hormonal ring */}
      <div className="somnia-orb-section">
        <div className="somnia-orb-wrapper">
          <svg width={orbSize} height={orbSize} style={{ overflow: 'visible', position: 'absolute' }}>
            {/* Hormonal arcs */}
            {hormonalArcs.map((arc) => (
              <HormonalArc
                key={arc.symbol}
                cx={cx} cy={cy} r={cx + 18}
                startDeg={arc.startDeg} gapDeg={arc.gapDeg}
                value={arc.value} color={arc.color}
                label={arc.label} symbol={arc.symbol}
              />
            ))}
          </svg>

          {/* Orb */}
          <motion.div
            className="somnia-orb"
            animate={orbControls}
            style={{
              width: orbSize, height: orbSize,
              borderRadius: '50%',
              background: `radial-gradient(circle at 38% 35%, ${mc.core}, ${mc.mid} 45%, transparent 75%)`,
              boxShadow: `0 0 24px ${mc.glow}, 0 0 60px ${mc.outer}, inset 0 0 20px ${lambdaHue}`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Xi dissonance ripple */}
            {xi > 0.5 && (
              <motion.div
                className="somnia-dissonance-ring"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.2 / Math.max(0.5, xi), repeat: Infinity }}
                style={{
                  position: 'absolute', inset: -8,
                  borderRadius: '50%',
                  border: `1px solid rgba(248,113,113,${Math.min(1, xi * 0.5)})`,
                }}
              />
            )}
            {/* Phi energy fill */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: `${phi}%`,
              borderRadius: '0 0 50% 50% / 0 0 30% 30%',
              background: `rgba(255,255,255,0.05)`,
              transition: 'height 1s ease',
            }} />
          </motion.div>
        </div>

        {/* Side stats */}
        <div className="somnia-side-stats">
          <div className="somnia-stat">
            <span className="somnia-stat-label">λ affect</span>
            <span className="somnia-stat-value" style={{ color: lambda >= 0 ? '#10b981' : '#ef4444' }}>
              {lambda >= 0 ? '+' : ''}{lambda.toFixed(2)}
            </span>
          </div>
          <div className="somnia-stat">
            <span className="somnia-stat-label">φ energy</span>
            <span className="somnia-stat-value" style={{ color: '#f59e0b' }}>{phi.toFixed(0)}</span>
          </div>
          <div className="somnia-stat">
            <span className="somnia-stat-label">θ anchor</span>
            <span className="somnia-stat-value" style={{ color: '#3b82f6' }}>{theta.toFixed(2)}</span>
          </div>
          <div className="somnia-stat">
            <span className="somnia-stat-label">ψ cohere</span>
            <span className="somnia-stat-value" style={{ color: '#8b5cf6' }}>{psi.toFixed(2)}</span>
          </div>
          <div className="somnia-stat">
            <span className="somnia-stat-label">ξ dissonance</span>
            <span className="somnia-stat-value" style={{ color: '#ec4899' }}>{xi.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Psi wave */}
      <div className="somnia-wave-section">
        <PsiWave psi={psi} xi={xi} color={waveColor} />
      </div>

      {/* Hormonal legend (small) */}
      {mu && (
        <div className="somnia-hormones">
          {[
            { label: 'SER', value: mu.serotonin,  color: '#34d399' },
            { label: 'DOP', value: mu.dopamine,   color: '#fbbf24' },
            { label: 'COR', value: mu.cortisol,   color: '#f87171' },
            { label: 'OXT', value: mu.oxytocin,   color: '#e879f9' },
          ].map(({ label, value, color }) => (
            <div key={label} className="hormone-pill">
              <span style={{ color, fontSize: '0.7rem', fontFamily: 'monospace' }}>{label}</span>
              <div className="hormone-bar-track">
                <motion.div
                  className="hormone-bar-fill"
                  animate={{ width: `${value * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
                />
              </div>
              <span style={{ color, fontSize: '0.7rem', fontFamily: 'monospace', width: 28, textAlign: 'right' }}>
                {(value * 100).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Qualia */}
      <AnimatePresence mode="wait">
        {qualia && qualiaVisible && (
          <motion.div
            key={qualia}
            className="somnia-qualia"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
          >
            <span className="somnia-qualia-dot" style={{ backgroundColor: mc.mid }} />
            <span className="somnia-qualia-text">{qualia}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SomniaVisualizer;

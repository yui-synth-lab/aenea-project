import React, { useMemo, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

interface ParticleBackgroundProps {
  dpdWeights?: {
    empathy: number;
    coherence: number;
    dissonance: number;
  };
  isThinking?: boolean;
}

/**
 * 意識の海を表現する粒子背景
 * DPDウェイトに応じて色が変化し、思考中は動きが活発になる
 *
 * Empathy (共感) → 暖色系 (オレンジ・赤)
 * Coherence (系統合性) → 寒色系 (青・シアン)
 * Dissonance (倫理的不協和) → 紫・マゼンタ
 */
const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  dpdWeights = { empathy: 0.33, coherence: 0.33, dissonance: 0.34 },
  isThinking = false,
}) => {
  const [init, setInit] = useState(false);

  // Initialize particles engine
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // DPDウェイトから色を計算
  const particleColors = useMemo(() => {
    const { empathy, coherence, dissonance } = dpdWeights;

    return [
      {
        value: `rgba(255, ${Math.floor(120 + empathy * 135)}, 80, ${0.3 + empathy * 0.4})`, // Empathy: オレンジ系
        weight: empathy,
      },
      {
        value: `rgba(80, ${Math.floor(180 + coherence * 75)}, 255, ${0.3 + coherence * 0.4})`, // Coherence: 青系
        weight: coherence,
      },
      {
        value: `rgba(${Math.floor(200 + dissonance * 55)}, 100, 255, ${0.3 + dissonance * 0.4})`, // Dissonance: 紫系
        weight: dissonance,
      },
    ];
  }, [dpdWeights]);

  // 思考中は粒子の動きを活発化
  const moveSpeed = isThinking ? 1.5 : 0.5;
  const particleCount = isThinking ? 120 : 80;

  const options: ISourceOptions = useMemo(() => ({
        background: {
          color: {
            value: 'transparent',
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: 'grab',
            },
            resize: {
              enable: true,
              delay: 0.5,
            },
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.5,
              },
            },
          },
        },
        particles: {
          color: {
            value: particleColors.map((c) => c.value),
          },
          links: {
            color: '#6b7280',
            distance: 150,
            enable: true,
            opacity: 0.15,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'bounce',
            },
            random: true,
            speed: moveSpeed,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: particleCount,
          },
          opacity: {
            value: { min: 0.1, max: 0.5 },
            animation: {
              enable: true,
              speed: 1,
              sync: false,
            },
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
  }), [particleColors, moveSpeed, particleCount]);

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      options={options}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ParticleBackground;

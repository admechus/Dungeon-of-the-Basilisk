import React, { useEffect, useState } from 'react';
import { DiceFace } from '../types';

interface Dice3DProps {
  rolling: boolean;
  result: DiceFace | null;
}

const Dice3D: React.FC<Dice3DProps> = ({ rolling, result }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!rolling && result) {
      let x = 0;
      let y = 0;
      const randomVar = Math.random();

      switch (result) {
        case 'monster':
          x = 0;
          y = -90;
          break;
        case 'door':
          if (randomVar > 0.5) {
            x = -90;
            y = 0;
          } else {
            x = 90;
            y = 0;
          }
          break;
        case 'corridor':
          if (randomVar < 0.33) {
            x = 0;
            y = 0;
          } else if (randomVar < 0.66) {
            x = 0;
            y = 180;
          } else {
            x = 0;
            y = 90;
          }
          break;
      }

      setRotation({ x, y });
    }
  }, [rolling, result]);

  const style = rolling
    ? {}
    : { transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` };

  return (
    <div className="dice-scene w-20 h-20 mx-auto">
      <div className={`dice ${rolling ? 'rolling' : ''}`} style={style}>
        <div className="dice-face face-front bg-stone-800 text-stone-400">👣</div>
        <div className="dice-face face-back bg-stone-800 text-stone-400">👣</div>
        <div className="dice-face face-right bg-stone-800 text-red-600 border-red-900">👹</div>
        <div className="dice-face face-left bg-stone-800 text-stone-400">👣</div>
        <div className="dice-face face-top bg-stone-800 text-amber-500 border-amber-700">🚪</div>
        <div className="dice-face face-bottom bg-stone-800 text-amber-500 border-amber-700">🚪</div>
      </div>
    </div>
  );
};

export default Dice3D;

import React, { useMemo } from 'react';
import { Player, CellCoordinates, CellType, AssetConfig } from '../types';
import { PLAYER_COLORS, CENTER_INDEX } from '../constants';

interface BoardProps {
  playerCount: number;
  players: Player[];
  boardState: Record<string, CellType>;
  assets: AssetConfig;
}

const CELL_THEME_CONFIG: Partial<Record<CellType, { emoji: string; fontSize: string; dy: number; filter: string }>> = {
  door: { emoji: '🚪', fontSize: '28', dy: 8, filter: 'url(#shadow)' },
  monster: { emoji: '🐍', fontSize: '28', dy: 8, filter: 'url(#shadow)' },
  start: { emoji: '⚒', fontSize: '24', dy: 8, filter: 'url(#shadow)' },
  center: { emoji: '☠️', fontSize: '48', dy: 12, filter: 'url(#fireGlow)' },
};

const Board: React.FC<BoardProps> = ({ playerCount, players, boardState, assets }) => {
  const BASE_SIZE = 900;
  const center = { x: BASE_SIZE / 2, y: BASE_SIZE / 2 };

  const centerRadius = 80;
  const cellRadius = 35;
  const gap = 16;

  const cells = useMemo(() => {
    const coords: CellCoordinates[] = [];

    coords.push({
      x: center.x,
      y: center.y,
      type: 'center',
      stepIndex: CENTER_INDEX
    });

    for (let i = 0; i < playerCount; i++) {
      const angle = (i * 2 * Math.PI) / playerCount - Math.PI / 2;

      for (let step = 0; step < CENTER_INDEX; step++) {
        const stepsFromCenter = CENTER_INDEX - step;
        const distance = centerRadius + (stepsFromCenter * (cellRadius * 2 + gap)) - cellRadius;

        const stateKey = `${i}-${step}`;
        const type = boardState[stateKey] || (step === 0 ? 'start' : 'hidden');

        coords.push({
          x: center.x + Math.cos(angle) * distance,
          y: center.y + Math.sin(angle) * distance,
          type,
          ownerId: i,
          stepIndex: step
        });
      }
    }

    return coords;
  }, [playerCount, center.x, center.y, boardState]);

  const getCellBackground = (type: CellType, ownerId: number | undefined) => {
    let fill = 'url(#stonePattern)';
    let stroke = '#292524';
    let strokeWidth = 3;
    let filter = 'url(#stoneRoughness)';

    switch (type) {
      case 'hidden':
        fill = 'url(#fogGradient)';
        stroke = '#44403c';
        filter = '';
        break;
      case 'corridor':
        fill = '#57534e';
        stroke = '#a8a29e';
        break;
      case 'door':
        fill = '#451a03';
        stroke = '#d97706';
        break;
      case 'monster':
        fill = '#450a0a';
        stroke = '#7f1d1d';
        break;
      case 'start':
        fill = '#1c1917';
        if (ownerId !== undefined) {
          stroke = PLAYER_COLORS[ownerId];
        }
        break;
      case 'center':
        fill = 'url(#lavaGradient)';
        stroke = '#7f1d1d';
        strokeWidth = 6;
        filter = 'url(#heatDistortion)';
        break;
    }

    return { fill, stroke, strokeWidth, filter };
  };

  const renderCellContent = (type: CellType, x: number, y: number, r: number, cellId: string) => {
    const customUrl = assets.cells[type];

    if (customUrl) {
      return (
        <image
          href={customUrl}
          x={x - r}
          y={y - r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#clip-cell-${cellId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      );
    }

    const theme = CELL_THEME_CONFIG[type];
    if (theme) {
      return (
        <text
          x={x}
          y={y + theme.dy}
          textAnchor="middle"
          fontSize={theme.fontSize}
          filter={theme.filter}
        >
          {theme.emoji}
        </text>
      );
    }

    if (type === 'hidden') {
      return (
        <text
          x={x}
          y={y + 7}
          textAnchor="middle"
          fill="#57534e"
          fontSize="20"
          fontWeight="bold"
        >
          ?
        </text>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full flex justify-center items-center p-2">
      <svg
        viewBox={`0 0 ${BASE_SIZE} ${BASE_SIZE}`}
        className="drop-shadow-2xl touch-none"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="stoneRoughness">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="1">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
            <feComposite operator="in" in2="SourceGraphic" />
            <feComposite in="SourceGraphic" operator="over" />
          </filter>

          <filter id="heatDistortion">
            <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="black" floodOpacity="0.8" />
          </filter>

          <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <pattern id="stonePattern" patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="#292524" />
            <path d="M0 0h100v100H0z" fill="#44403c" fillOpacity="0.2" />
          </pattern>

          <radialGradient id="lavaGradient">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          <radialGradient id="fogGradient">
            <stop offset="30%" stopColor="#292524" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0c0a09" stopOpacity="1" />
          </radialGradient>

          <radialGradient id="torchLight">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={center.x} cy={center.y} r={BASE_SIZE / 2.2} fill="url(#torchLight)" />

        {Array.from({ length: playerCount }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / playerCount - Math.PI / 2;
          const startDist = centerRadius + (CENTER_INDEX * (cellRadius * 2 + gap)) - cellRadius;
          const endX = center.x + Math.cos(angle) * startDist;
          const endY = center.y + Math.sin(angle) * startDist;

          return (
            <g key={`bridge-${i}`}>
              <line
                x1={center.x}
                y1={center.y}
                x2={endX}
                y2={endY}
                stroke="#0c0a09"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <line
                x1={center.x}
                y1={center.y}
                x2={endX}
                y2={endY}
                stroke="#44403c"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
            </g>
          );
        })}

        {cells.map((cell, idx) => {
          const isCenter = cell.type === 'center';
          const r = isCenter ? centerRadius : cellRadius;
          const { fill, stroke, strokeWidth, filter } = getCellBackground(cell.type, cell.ownerId);
          const cellId = `cell-${idx}`;

          return (
            <g key={cellId}>
              <defs>
                <clipPath id={`clip-${cellId}`}>
                  <circle cx={cell.x} cy={cell.y} r={r} />
                </clipPath>
              </defs>

              <circle cx={cell.x} cy={cell.y + 6} r={r} fill="black" opacity="0.5" />

              <circle
                cx={cell.x}
                cy={cell.y}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                filter={assets.cells[cell.type] ? undefined : filter}
                className="transition-all duration-300"
              />

              {renderCellContent(cell.type, cell.x, cell.y, r, cellId)}
            </g>
          );
        })}

        {players.map((player) => {
          let targetCell: CellCoordinates | undefined;

          if (player.positionIndex === CENTER_INDEX) {
            targetCell = cells.find(c => c.type === 'center');
          } else {
            targetCell = cells.find(c => c.ownerId === player.id && c.stepIndex === player.positionIndex);
          }

          if (!targetCell) {
            return null;
          }

          let offsetX = 0;
          let offsetY = 0;

          if (player.positionIndex === CENTER_INDEX) {
            const playersInCenter = players.filter(p => p.positionIndex === CENTER_INDEX);
            const myIndexInCenter = playersInCenter.findIndex(p => p.id === player.id);
            const totalInCenter = playersInCenter.length;

            if (totalInCenter > 1) {
              const angle = (myIndexInCenter * 2 * Math.PI) / totalInCenter;
              const dist = 35;
              offsetX = Math.cos(angle) * dist;
              offsetY = Math.sin(angle) * dist;
            }
          }

          let opacity = 1;
          let filter = '';
          let fillColor = PLAYER_COLORS[player.id];
          let strokeColor = '#fcd34d';
          let className = '';

          if (player.isSkippingTurn) {
            opacity = 0.9;
            filter = 'grayscale(100%) brightness(40%)';
            fillColor = '#292524';
            strokeColor = '#1c1917';
            className = '';
          }

          if (player.isEliminated) {
            opacity = 0.9;
            filter = 'grayscale(100%) brightness(40%)';
            fillColor = '#292524';
            strokeColor = '#1c1917';
            className = '';
          }

          const customPlayerUrl = assets.players[player.id];
          const playerRadius = 18;
          const px = targetCell.x + offsetX;
          const py = targetCell.y + offsetY;
          const playerIdStr = `player-${player.id}`;

          return (
            <g key={playerIdStr} className={className} style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              <circle cx={px} cy={py + 4} r={playerRadius} fill="black" opacity="0.6" />

              {customPlayerUrl ? (
                <>
                  <defs>
                    <clipPath id={`clip-${playerIdStr}`}>
                      <circle cx={px} cy={py} r={playerRadius} />
                    </clipPath>
                  </defs>
                  <circle
                    cx={px}
                    cy={py}
                    r={playerRadius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="3"
                    filter={filter}
                    opacity={opacity}
                  />
                  <image
                    href={customPlayerUrl}
                    x={px - playerRadius}
                    y={py - playerRadius}
                    width={playerRadius * 2}
                    height={playerRadius * 2}
                    clipPath={`url(#clip-${playerIdStr})`}
                    preserveAspectRatio="xMidYMid slice"
                    opacity={opacity}
                  />
                </>
              ) : (
                <circle
                  cx={px}
                  cy={py}
                  r={playerRadius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="4"
                  filter={filter}
                  opacity={opacity}
                />
              )}

              {(player.isSkippingTurn || player.isEliminated) && (
                <text x={px} y={py - 24} textAnchor="middle" fontSize="24" fill="#94a3b8" filter="url(#shadow)">🗿</text>
              )}
              <text
                x={px}
                y={py + 6}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontFamily="Inter"
                fontWeight="bold"
                style={{ textShadow: '0px 1px 2px black' }}
              >
                {!customPlayerUrl && player.id + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Board;

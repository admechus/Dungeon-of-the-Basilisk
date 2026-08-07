import React, { useState, useEffect, useRef } from 'react';
import { EditableQuestion, GamePhase, Language, Player, GameState, DiceFace } from './types';
import type { AssetConfig } from './types';
import { PLAYER_COLORS, CENTER_INDEX, MAX_PLAYERS } from './constants';
import { DICTIONARY, QUESTIONS_DB } from './dictionary';
import Board from './components/Board';
import Dice3D from './components/Dice3D';
import ImageAssetPreview from './components/ImageAssetPreview';
import TeacherQuestionEditor from './components/TeacherQuestionEditor';
import { generateGameEvent } from './services/gameEventService';
import { pickQuestionFromBank } from './questionBank';
import { loadQuestionBank } from './questionStorage';
import {
  createBaseGameState,
  createInitialBoardState,
  createPlayers,
  getCellLabel,
  getCellTypeFromDice,
  getNextPlayerIndex,
  getRandomDiceFace,
  getRandomRpsChoice,
  resolveRpsRound,
} from './gameUtils';

const CORRIDOR_SCENE_IMAGES = [
  new URL('./korytarzeidrzwi/Coridor_1.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Coridor_2.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Coridor_3.jpg', import.meta.url).href,
];

const DOOR_SCENE_IMAGES = [
  new URL('./korytarzeidrzwi/Door_1.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Door_2.jpg', import.meta.url).href,
];

const BASILISK_SCENE_IMAGES = [
  new URL('./korytarzeidrzwi/Bas1.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Bas2.jpeg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Bas3.jpg', import.meta.url).href,
];

const STONED_SCENE_IMAGES = [
  new URL('./korytarzeidrzwi/Stoned_1_1.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_1_2.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_2_1.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_2_2.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_3_1.webp', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_3_2.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_4_1.jpg', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_5_1.webp', import.meta.url).href,
  new URL('./korytarzeidrzwi/Stoned_5_2.webp', import.meta.url).href,
];

type CellAssetType = keyof AssetConfig['cells'];

const CELL_ASSET_TYPES: CellAssetType[] = ['corridor', 'door', 'monster', 'center', 'start', 'hidden'];

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(createBaseGameState());

  const [setupCount, setSetupCount] = useState<number>(2);
  const [showAssetsConfig, setShowAssetsConfig] = useState<boolean>(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState<boolean>(false);
  const [questionBank, setQuestionBank] = useState<EditableQuestion[]>(() => loadQuestionBank().questions);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const rollInProgressRef = useRef<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // --- Helpers ---
  const t = DICTIONARY[gameState.language];

  const addLog = (text: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [...prev.logs, text]
    }));
  };

  const getDiceTranslation = (face: DiceFace | null) => {
    if (!face) return '';
    return t.dice[face];
  };

  const pickRandomImage = (images: string[]) => {
    if (images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)];
  };

  const pickSceneImage = (cellType: DiceFace) => {
    if (cellType === 'door') return pickRandomImage(DOOR_SCENE_IMAGES);
    if (cellType === 'corridor') return pickRandomImage(CORRIDOR_SCENE_IMAGES);
    if (cellType === 'monster') return pickRandomImage(BASILISK_SCENE_IMAGES);
    return null;
  };

  // --- Handlers ---

  const handleStartGame = () => {
    rollInProgressRef.current = false;
    setIsRollingDice(false);
    const newPlayers = createPlayers(setupCount, gameState.language, PLAYER_COLORS);
    const initialBoard = createInitialBoardState(setupCount);

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      phase: GamePhase.PLAYING,
      logs: [t.logs.game_started.replace('{0}', setupCount.toString())],
      currentPlayerIndex: 0,
      boardState: initialBoard,
      eventText: null,
      eventImage: null,
      isThinking: false,
      diceResult: null,
      activeQuestion: null,
      rpsSelection: null,
      rpsOpponent: null,
      rpsResult: null,
      rpsContext: null
    }));
  };

  const startNextTurn = (currentPlayers: Player[], nextIndex: number) => {
    rollInProgressRef.current = false;

    // Check if everyone is eliminated
    if (currentPlayers.every(p => p.isEliminated)) {
        setGameState(prev => ({...prev, phase: GamePhase.GAME_OVER, eventText: t.events.game_over_loss}));
        return;
    }

    const nextPlayer = currentPlayers[nextIndex];
    
    // Skip eliminated players immediately
    if (nextPlayer.isEliminated) {
        const nextNextIndex = getNextPlayerIndex(nextIndex, currentPlayers.length);
        // Recurse
        startNextTurn(currentPlayers, nextNextIndex);
        return;
    }

    // Check if player is temporarily petrified
    if (nextPlayer.isSkippingTurn) {
        addLog(`${t.game.turn} ${nextPlayer.name}: ${t.events.petrified_skip}`);
        
        // Remove skip status and move to next next player
        const healedPlayers = currentPlayers.map(p => 
            p.id === nextPlayer.id ? { ...p, isSkippingTurn: false } : p
        );
        
        // Recursive call with delay to show the skip
        setGameState(prev => ({
             ...prev, 
             players: healedPlayers,
             currentPlayerIndex: nextIndex // Show who is skipping
        }));
        
        setTimeout(() => {
            const nextNextIndex = getNextPlayerIndex(nextIndex, currentPlayers.length);
            startNextTurn(healedPlayers, nextNextIndex);
        }, 1500);
        return;
    }

    setGameState(prev => ({
      ...prev,
      players: currentPlayers,
      phase: GamePhase.PLAYING,
      eventText: null,
      eventImage: null,
      diceResult: null,
      currentPlayerIndex: nextIndex,
      isThinking: false,
      rpsSelection: null,
      rpsOpponent: null,
      rpsResult: null,
      rpsContext: null,
      activeQuestion: null
    }));
  };

  const handleNextTurnButton = () => {
    const nextIndex = getNextPlayerIndex(gameState.currentPlayerIndex, gameState.players.length);
    startNextTurn(gameState.players, nextIndex);
  };

  const handleBossFight = () => {
    rollInProgressRef.current = false;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    addLog(`${currentPlayer.name}: ${t.events.boss_fight}`);
    setGameState(prev => ({
        ...prev,
        phase: GamePhase.MINIGAME_RPS,
        rpsContext: 'boss',
        eventText: t.events.boss_fight
    }));
  };

  const handleRollDice = async () => {
    if (gameState.isThinking || rollInProgressRef.current) return;
    rollInProgressRef.current = true;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // 1. Start Rolling Animation
    setGameState(prev => ({ ...prev, isThinking: true }));
    setIsRollingDice(true);

    // 2. Determine Result Logic
    const result: DiceFace = getRandomDiceFace();

    // 3. Wait for animation
    setTimeout(() => {
        setIsRollingDice(false);
        setGameState(prev => ({ ...prev, diceResult: result }));
        addLog(`${t.game.turn} ${currentPlayer.name}: ${t.game.rolled} ${getDiceTranslation(result)}`);

        // 4. Delay to admire result, then move
        setTimeout(() => {
            executeMove(currentPlayer, result);
        }, 1200);

    }, 2000); // 2s physics roll
  };

  const handleRetryDoor = () => {
    if (gameState.isThinking || rollInProgressRef.current) return;
    rollInProgressRef.current = true;

    // Direct movement to door without rolling dice
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    addLog(t.logs.retry_door_attempt.replace('{0}', currentPlayer.name));
    
    setGameState(prev => ({ ...prev, isThinking: true }));
    
    setTimeout(() => {
        // Force 'door' result effectively
        executeMove(currentPlayer, 'door');
    }, 800);
  };

  const executeMove = (player: Player, diceResult: DiceFace) => {
    let nextPos = player.positionIndex + 1;
    
    // Capture any pending question before we potentially clear it
    const storedQuestion = player.pendingQuestion;

    // If reached center
    if (nextPos >= CENTER_INDEX) {
        nextPos = CENTER_INDEX;
        const updatedPlayers = gameState.players.map(p => 
            p.id === player.id ? { ...p, positionIndex: nextPos } : p
        );

        setGameState(prev => ({
            ...prev,
            players: updatedPlayers,
            eventText: t.events.centerReached,
            eventImage: null,
            isThinking: false,
            // Instead of EVENT_RESOLVING, we immediately go to Boss Fight
            phase: GamePhase.MINIGAME_RPS,
            rpsContext: 'boss'
        }));
        
        addLog(`${player.name} ${t.events.centerReached}`);
        
        // Generate Boss Intro Flavor Text
        generateGameEvent(gameState.language, player.name, true).then(text => {
             setGameState(prev => ({ ...prev, eventText: text + " " + t.events.boss_fight }));
        });
        return;
    }

    // Normal Movement Logic
    const cellType = getCellTypeFromDice(diceResult);
    const sceneImage = pickSceneImage(diceResult);

    const boardKey = `${player.id}-${nextPos}`;
    const newBoardState = { ...gameState.boardState, [boardKey]: cellType };
    
    // When moving, we clear retry flags
    const updatedPlayers = gameState.players.map(p => 
        p.id === player.id ? { 
            ...p, 
            positionIndex: nextPos, 
            retryDoor: false,
            pendingQuestion: undefined 
        } : p
    );

    setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        boardState: newBoardState,
        isThinking: false
    }));

    // Handle Encounters
    if (cellType === 'corridor') {
        // Just move and end turn
        setGameState(prev => ({
            ...prev,
            phase: GamePhase.EVENT_RESOLVING,
            eventText: t.logs.path_clear,
            eventImage: sceneImage
        }));
        
        // Flavor text
        generateGameEvent(gameState.language, player.name, false).then(text => {
             setGameState(prev => ({ ...prev, eventText: text }));
        });

    } else if (cellType === 'door') {
        // Trigger Quiz
        // Use stored question if this was a retry
        const activeQ = storedQuestion ?? pickQuestionFromBank(questionBank, gameState.language, QUESTIONS_DB);

        addLog(`${t.events.door_locked}`);
        setGameState(prev => ({
            ...prev,
            phase: GamePhase.MINIGAME_QUIZ,
            activeQuestion: activeQ,
            eventText: t.events.door_locked,
            eventImage: sceneImage
        }));

    } else if (cellType === 'monster') {
        // Trigger RPS (Normal)
        addLog(`${t.events.monster_encounter}`);
        setGameState(prev => ({
            ...prev,
            phase: GamePhase.MINIGAME_RPS,
            rpsContext: 'monster',
            eventText: t.events.monster_encounter,
            eventImage: sceneImage
        }));
    }
  };

  // --- Minigame Handlers ---

  const handleQuizAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === gameState.activeQuestion!.correctIndex;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (isCorrect) {
        addLog(t.events.quiz_correct);
        setGameState(prev => ({
            ...prev,
            phase: GamePhase.EVENT_RESOLVING,
            eventText: t.events.quiz_correct
        }));
    } else {
        addLog(t.events.quiz_wrong);
        // Move back logic (Retreat)
        const prevPos = Math.max(0, currentPlayer.positionIndex - 1);
        
        const updatedPlayers = gameState.players.map(p => 
            p.id === currentPlayer.id ? { 
                ...p, 
                positionIndex: prevPos,
                retryDoor: true, // Flag for next turn
                pendingQuestion: gameState.activeQuestion! // Remember this question
            } : p
        );

        setGameState(prev => ({
            ...prev,
            players: updatedPlayers,
            phase: GamePhase.EVENT_RESOLVING,
            eventText: t.events.quiz_wrong
        }));
    }
  };

  const handleRPSSelection = (choice: 'rock' | 'paper' | 'scissors') => {
    const opponentChoice = getRandomRpsChoice();
    const result = resolveRpsRound(choice, opponentChoice);

    setGameState(prev => ({
        ...prev,
        rpsSelection: choice,
        rpsOpponent: opponentChoice,
        rpsResult: result
    }));

    setTimeout(() => {
        resolveRPS(result);
    }, 1500);
  };

  const resolveRPS = (result: 'win' | 'lose' | 'draw') => {
     const currentPlayer = gameState.players[gameState.currentPlayerIndex];
     
     if (gameState.rpsContext === 'boss') {
        // BOSS LOGIC
        if (result === 'win') {
            // Player WINS GAME
            addLog(t.events.boss_win_game);
            setGameState(prev => ({
                ...prev,
                phase: GamePhase.GAME_OVER,
                eventText: `${t.ui.winner_is} ${currentPlayer.name}!`,
                players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, hasFinished: true } : p)
            }));
        } else if (result === 'lose') {
            // Player ELIMINATED
            addLog(t.events.boss_lose_game);
            const stonedImage = pickRandomImage(STONED_SCENE_IMAGES);
            const updatedPlayers = gameState.players.map(p => 
                p.id === currentPlayer.id ? { ...p, isEliminated: true } : p
            );
            setGameState(prev => ({
                ...prev,
                players: updatedPlayers,
                phase: GamePhase.EVENT_RESOLVING,
                eventText: t.events.boss_lose_game,
                eventImage: stonedImage
            }));
        } else {
            // DRAW - Stay and try next turn
            addLog(t.events.boss_draw);
            setGameState(prev => ({
                ...prev,
                phase: GamePhase.EVENT_RESOLVING,
                eventText: t.events.boss_draw,
                eventImage: null
            }));
        }

     } else {
         // NORMAL MONSTER LOGIC
         let text = '';
         let shouldSkip = false;

         if (result === 'win') text = t.events.rps_win;
         if (result === 'draw') text = t.events.rps_draw;
         if (result === 'lose') {
             text = t.events.rps_lose;
             shouldSkip = true;
         }

         const resultImage = result === 'lose'
            ? pickRandomImage(STONED_SCENE_IMAGES)
            : gameState.eventImage;

         addLog(text);
         const updatedPlayers = gameState.players.map(p => 
            p.id === currentPlayer.id ? { ...p, isSkippingTurn: shouldSkip } : p
         );

         setGameState(prev => ({
             ...prev,
             players: updatedPlayers,
             phase: GamePhase.EVENT_RESOLVING,
             eventText: text,
             eventImage: resultImage
         }));
     }
  };

  const updateAssetCell = (type: CellAssetType, url: string) => {
    setGameState(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        cells: { ...prev.assets.cells, [type]: url }
      }
    }));
  };

  const updateAssetPlayer = (index: number, url: string) => {
    const newPlayers = [...gameState.assets.players];
    newPlayers[index] = url;
    setGameState(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        players: newPlayers
      }
    }));
  };

  // --- Renders ---
  
  const getLangCode = (lang: Language) => {
     switch(lang) {
         case Language.EN: return 'EN';
         case Language.PL: return 'PL';
         case Language.UA: return 'UA';
         case Language.RU: return 'RU';
         case Language.JA: return 'JA';
         default: return 'EN';
     }
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  if (showQuestionEditor) {
    return (
      <TeacherQuestionEditor
        questions={questionBank}
        language={gameState.language}
        onQuestionsChange={setQuestionBank}
        onClose={() => setShowQuestionEditor(false)}
      />
    );
  }
  
  // Setup Phase
  if (gameState.phase === GamePhase.SETUP) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-stone-200 p-4 overflow-y-auto relative">
         {/* Background Effect */}
         <div className="absolute inset-0 scanlines opacity-30 pointer-events-none"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#292524_0%,_#0c0a09_100%)] z-[-1]"></div>

        <div className="bg-stone-900/90 p-8 rounded border-2 border-amber-900 max-w-2xl w-full my-8 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          {/* Decorative Corner Borders */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-700"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-700"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-700"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-700"></div>

          <h1 className="text-5xl font-extrabold mb-8 text-amber-500 text-center tracking-widest drop-shadow-[0_2px_4px_black] dungeon-font">
            {t.ui.title}
          </h1>

          {/* Language Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">{t.ui.selectLang}</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.values(Language).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setGameState(prev => ({ ...prev, language: lang }))}
                  className={`p-2 rounded border transition-all font-bold vn-button ${
                    gameState.language === lang 
                      ? 'border-amber-500 text-amber-100 ring-2 ring-amber-500/30' 
                      : 'border-stone-700 text-stone-500 hover:border-stone-500'
                  }`}
                >
                  {getLangCode(lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Player Count */}
          <div className="mb-8 p-4 bg-black/40 rounded border border-stone-800">
            <label className="block text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">{t.ui.numPlayers}: <span className="text-amber-500 text-xl font-serif">{setupCount}</span></label>
            <input 
              type="range" 
              min="1" 
              max={MAX_PLAYERS} 
              value={setupCount} 
              onChange={(e) => setSetupCount(Number(e.target.value))}
              className="w-full h-3 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-700"
            />
          </div>

          {/* Custom Assets Toggle */}
          <div className="mb-8">
             <button 
               onClick={() => setShowAssetsConfig(!showAssetsConfig)}
               className="flex items-center justify-between w-full text-left p-3 bg-stone-800/50 border border-stone-700 hover:bg-stone-700/50 transition-colors"
             >
               <span className="font-bold text-stone-300 dungeon-font tracking-wide">{t.ui.custom_assets}</span>
               <span className="text-amber-500">{showAssetsConfig ? '^' : 'v'}</span>
             </button>

             {showAssetsConfig && (
               <div className="mt-2 space-y-4 bg-black/60 p-4 border border-stone-800 animate-fade-in">
                  {/* Players */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">{t.ui.asset_players}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {Array.from({ length: setupCount }).map((_, i) => (
                         <div key={i} className="flex items-center gap-2">
                           <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: PLAYER_COLORS[i] }}></div>
                           <input 
                              type="text" 
                              placeholder={`${t.ui.url_placeholder} (P${i+1})`}
                              value={gameState.assets.players[i]}
                              onChange={(e) => updateAssetPlayer(i, e.target.value)}
                              className="flex-1 bg-stone-900 border border-stone-700 rounded-none px-2 py-1 text-xs text-stone-300 focus:border-amber-600 outline-none"
                           />
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Cells */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-500 uppercase mb-2 mt-4">{t.ui.asset_cells}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CELL_ASSET_TYPES.map((type) => (
                          <div key={type} className="flex flex-col">
                             <label className="text-[10px] text-stone-600 uppercase tracking-widest mb-1">{getCellLabel(t.ui, type)}</label>
                             <input 
                                type="text"
                                placeholder={t.ui.url_placeholder}
                                value={gameState.assets.cells[type]}
                                onChange={(e) => updateAssetCell(type, e.target.value)}
                                className="bg-stone-900 border border-stone-700 rounded-none px-2 py-1 text-xs text-stone-300 focus:border-amber-600 outline-none"
                             />
                          </div>
                        ))}
                    </div>
                  </div>
               </div>
             )}
          </div>

          <button
            onClick={() => setShowQuestionEditor(true)}
            className="w-full py-3 mb-4 rounded-sm vn-button text-sm tracking-widest"
          >
            Teacher Question Bank
          </button>

          <button 
            onClick={handleStartGame}
            className="w-full py-4 rounded-sm vn-button text-xl tracking-widest"
          >
            {t.ui.start}
          </button>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState.phase === GamePhase.GAME_OVER) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-black text-stone-200 p-4">
              <div className="absolute inset-0 bg-red-900/20 scanlines pointer-events-none"></div>
              <h1 className="text-5xl md:text-8xl mb-6 text-red-600 dungeon-font drop-shadow-[0_5px_15px_rgba(220,38,38,0.5)] text-center animate-pulse">
                  {t.ui.game_over_title}
              </h1>
              <div className="bg-stone-900/90 p-8 border-4 border-stone-800 max-w-lg text-center shadow-2xl relative">
                 <p className="text-2xl md:text-3xl mb-8 font-serif italic text-stone-300 border-b border-stone-700 pb-4">
                   "{gameState.eventText}"
                 </p>
                 <button 
                    onClick={() => setGameState(prev => ({
                      ...createBaseGameState(prev.language),
                      assets: prev.assets,
                    }))}
                    className="px-10 py-4 vn-button text-lg uppercase"
                 >
                    {t.ui.restart}
                 </button>
              </div>
          </div>
      );
  }

  const isMyTurn = gameState.phase === GamePhase.PLAYING && !gameState.isThinking;
  const isAtCenter = currentPlayer?.positionIndex === CENTER_INDEX;

  return (
    <div className="h-[100dvh] bg-stone-950 text-stone-200 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* 
        VISUAL NOVEL LAYOUT 
        Left: Scene (Board)
        Right: Interface Panel (Dialogue, Controls)
      */}

      {/* LEFT PANEL: BOARD (SCENE) */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#1c1917_0%,_#000000_100%)] relative overflow-hidden order-1 md:order-1 min-h-0">
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
         
         <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
            <h2 className="text-3xl md:text-4xl opacity-50 dungeon-font text-stone-600">{t.ui.title}</h2>
         </div>

         <div className="w-full h-full flex items-center justify-center p-4">
            <Board 
              playerCount={gameState.players.length} 
              players={gameState.players} 
              boardState={gameState.boardState}
              assets={gameState.assets}
            />
         </div>
      </div>

      {/* RIGHT PANEL: VISUAL NOVEL INTERFACE */}
      <div className="w-full h-[45vh] md:h-full md:w-[450px] vn-panel flex flex-col z-20 relative order-2 md:order-2 flex-shrink-0">
        
        {/* --- Header / Stats Bar --- */}
        <div className="p-3 bg-black/40 border-b border-stone-800/50 flex flex-col gap-2">
            <div className="flex justify-end gap-1">
                {Object.values(Language).map((lang) => (
                    <button
                    key={lang}
                    onClick={() => setGameState(prev => ({ ...prev, language: lang }))}
                    className={`text-[10px] px-2 py-1 border transition-colors font-bold uppercase tracking-wider ${
                        gameState.language === lang 
                        ? 'bg-amber-900/50 border-amber-700 text-amber-200' 
                        : 'bg-transparent border-stone-800 text-stone-600 hover:text-stone-400'
                    }`}
                    >
                    {getLangCode(lang)}
                    </button>
                ))}
            </div>
            
            {/* Active Player Indicator */}
            <div className="flex items-center justify-between">
                <span className="text-stone-500 font-serif italic text-sm">{t.game.turn}</span>
                <div className="vn-name-tag" style={{ borderLeftColor: currentPlayer.color }}>
                   {currentPlayer.name}
                </div>
            </div>
        </div>

        {/* --- Main Content Area (Scrollable) --- */}
        <div className="flex-1 p-6 flex flex-col justify-start items-center overflow-y-auto relative">
            
            {/* PHASE: IDLE / ROLLING */}
            {gameState.phase === GamePhase.PLAYING && (
              <div className="w-full flex flex-col gap-6 animate-fade-in">
                  
                  {/* Dice Box */}
                  <div className="relative w-full h-48 bg-black/40 rounded-lg border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner">
                     <Dice3D rolling={isRollingDice} result={gameState.diceResult} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {currentPlayer.retryDoor ? (
                        <button
                            onClick={handleRetryDoor}
                            disabled={!isMyTurn}
                            className="w-full py-4 text-xl vn-button"
                        >
                            {t.ui.retry_door}
                        </button>
                    ) : (
                        <button
                            onClick={isAtCenter ? handleBossFight : handleRollDice}
                            disabled={!isMyTurn}
                            className={`w-full py-4 text-xl vn-button ${isAtCenter ? 'border-red-900 text-red-100 hover:border-red-500' : ''}`}
                        >
                            {gameState.isThinking ? t.ui.waiting : isAtCenter ? t.game.fight_boss : t.game.roll}
                        </button>
                    )}
                  </div>

                  {/* Result Text */}
                  {!isRollingDice && gameState.diceResult && !currentPlayer.retryDoor && (
                      <div className="text-center p-4 border-t border-b border-stone-800/50">
                          <span className="text-stone-500 font-serif italic block mb-1">{t.game.rolled}</span>
                          <span className="text-amber-500 dungeon-font text-3xl">{getDiceTranslation(gameState.diceResult)}</span>
                      </div>
                  )}
              </div>
            )}

            {/* PHASE: EVENT RESOLUTION (Dialogue Style) */}
            {gameState.phase === GamePhase.EVENT_RESOLVING && (
              <div className="w-full h-full flex flex-col justify-center animate-fade-in">
                {gameState.eventImage && (
                  <div className="relative w-full h-48 md:h-64 mb-4 overflow-hidden border border-stone-800 bg-black shadow-[inset_0_0_40px_rgba(0,0,0,0.65)]">
                    <img
                      src={gameState.eventImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none"></div>
                  </div>
                )}
                <div className="vn-dialogue-box p-6 mb-6">
                    <h3 className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2 border-b border-amber-900/30 pb-2">
                        {t.ui.event}
                    </h3>
                    <p className="text-lg md:text-xl text-stone-200 font-serif leading-relaxed">
                        {gameState.eventText}
                    </p>
                </div>
                <button
                  onClick={handleNextTurnButton}
                  className="w-full py-4 text-lg vn-button"
                >
                  {t.ui.next} {'>'}
                </button>
              </div>
            )}

            {/* PHASE: QUIZ (Decision Style) */}
            {gameState.phase === GamePhase.MINIGAME_QUIZ && gameState.activeQuestion && (
                <div className="w-full animate-fade-in">
                    {gameState.eventImage && (
                      <div className="relative w-full h-48 md:h-60 mb-4 overflow-hidden border border-amber-900/50 bg-black shadow-[inset_0_0_40px_rgba(0,0,0,0.65)]">
                        <img
                          src={gameState.eventImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none"></div>
                      </div>
                    )}
                    <div className="vn-dialogue-box p-4 mb-6 text-center">
                         <h3 className="text-amber-500 font-bold dungeon-font text-xl mb-4 border-b border-stone-700 pb-2">
                             {t.ui.locked_door_title}
                         </h3>
                         <p className="text-lg font-serif text-stone-300">
                             {gameState.activeQuestion.question[gameState.language]}
                         </p>
                         {gameState.activeQuestion.questionImageId && (
                           <ImageAssetPreview
                             assetId={gameState.activeQuestion.questionImageId}
                             alt=""
                             className="mt-4 w-full max-h-64 object-contain border border-stone-800 bg-black"
                           />
                         )}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {gameState.activeQuestion.options[gameState.language].map((opt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleQuizAnswer(idx)}
                                className="w-full py-3 px-4 text-left vn-choice vn-button flex items-center gap-3"
                            >
                                <span className="text-amber-600 font-bold font-serif italic">{idx + 1}.</span>
                                {gameState.activeQuestion?.optionImageIds?.[idx] && (
                                  <ImageAssetPreview
                                    assetId={gameState.activeQuestion.optionImageIds[idx]}
                                    alt=""
                                    className="h-16 w-20 flex-shrink-0 object-cover border border-stone-800 bg-black"
                                  />
                                )}
                                <span className="text-stone-300">{opt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE: RPS (Combat Style) */}
            {gameState.phase === GamePhase.MINIGAME_RPS && (
                 <div className="w-full text-center flex flex-col justify-center h-full animate-fade-in">
                    {gameState.eventImage && (
                      <div className="relative w-full h-48 md:h-64 mb-5 overflow-hidden border border-red-950/70 bg-black shadow-[inset_0_0_40px_rgba(0,0,0,0.75)]">
                        <img
                          src={gameState.eventImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>
                      </div>
                    )}
                    <h3 className={`font-bold mb-6 text-2xl dungeon-font tracking-widest ${gameState.rpsContext === 'boss' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'text-stone-400'}`}>
                        {gameState.rpsContext === 'boss' ? t.events.boss_fight : t.events.monster_encounter}
                    </h3>
                    
                    {!gameState.rpsSelection ? (
                        <div className="grid grid-cols-3 gap-2">
                             <button onClick={() => handleRPSSelection('rock')} className="vn-button p-4 text-4xl hover:scale-105 transition-transform rounded-lg hover:!border-red-500 hover:!text-red-100 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">{t.ui.rps_rock}</button>
                             <button onClick={() => handleRPSSelection('paper')} className="vn-button p-4 text-4xl hover:scale-105 transition-transform rounded-lg hover:!border-blue-400 hover:!text-blue-100 hover:shadow-[0_0_15px_rgba(96,165,250,0.5)]">{t.ui.rps_paper}</button>
                             <button onClick={() => handleRPSSelection('scissors')} className="vn-button p-4 text-4xl hover:scale-105 transition-transform rounded-lg hover:!border-green-500 hover:!text-green-100 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]">{t.ui.rps_scissors}</button>
                        </div>
                    ) : (
                        <div className="vn-dialogue-box p-6 flex flex-col items-center gap-4">
                            <div className="flex items-center justify-center gap-8 text-5xl">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] text-stone-500 uppercase tracking-widest">{t.ui.you}</span>
                                    <span>{gameState.rpsSelection === 'rock' ? t.ui.rps_rock : gameState.rpsSelection === 'paper' ? t.ui.rps_paper : t.ui.rps_scissors}</span>
                                </div>
                                <div className="text-red-900 dungeon-font font-bold text-2xl">{t.ui.vs}</div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] text-stone-500 uppercase tracking-widest">{gameState.rpsContext === 'boss' ? t.ui.boss : t.ui.beast}</span>
                                    <span>{gameState.rpsOpponent === null ? '?' :
                                    gameState.rpsOpponent === 'rock' ? t.ui.rps_rock :
                                    gameState.rpsOpponent === 'paper' ? t.ui.rps_paper : t.ui.rps_scissors}</span>
                                </div>
                            </div>
                            
                            {gameState.rpsResult && (
                                <div className={`mt-2 text-2xl font-bold dungeon-font uppercase animate-pulse ${
                                    gameState.rpsResult === 'win' ? 'text-green-500' : 
                                    gameState.rpsResult === 'lose' ? 'text-red-500' : 'text-amber-500'
                                }`}>
                                    {t.events[`rps_${gameState.rpsResult}` as keyof typeof t.events] || gameState.rpsResult}
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            )}

        </div>

        {/* --- Log Section (History) --- */}
        <div className="h-32 bg-black/60 border-t border-stone-800 flex flex-col relative">
           <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
           <h3 className="text-[10px] font-bold text-stone-600 uppercase tracking-widest p-2 bg-black/80">{t.ui.log}</h3>
           <div className="overflow-y-auto p-2 space-y-1 font-serif text-sm text-stone-400">
                {gameState.logs.map((log, i) => (
                <div key={i} className="border-l-2 border-stone-800 pl-2 opacity-80 hover:opacity-100 transition-opacity">
                    {log}
                </div>
                ))}
                <div ref={logsEndRef} />
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;

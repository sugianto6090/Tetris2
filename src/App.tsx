/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowDown, 
  Play, 
  RotateCcw,
  Star,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  GRID_WIDTH, 
  GRID_HEIGHT, 
  INITIAL_TICK_SPEED, 
  FAST_TICK_SPEED, 
  ANIMALS, 
  ANIMAL_COLORS,
  SHAPES,
  AnimalType 
} from './constants';
import { AnimalIcon } from './components/AnimalIcon';

// Types
type GridCell = { animal: AnimalType | null };
type Position = { x: number; y: number };
type Piece = {
  shape: number[][];
  animal: AnimalType;
  pos: Position;
};

export default function App() {
  const [grid, setGrid] = useState<GridCell[][]>(
    Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill({ animal: null }))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [clearLines, setClearLines] = useState<number[]>([]);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound Synth - Enhanced for more cartoony/fun effects
  const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.1, slideTo?: number) => {
    if (isMuted) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playAnimalSound = (animal: AnimalType) => {
    switch (animal) {
      case 'cat': // Meow-ish slide
        playSound(800, 'triangle', 0.2, 1200);
        break;
      case 'dog': // Woof-ish low thump
        playSound(200, 'sawtooth', 0.1, 100);
        break;
      case 'chick': // Chirp
        playSound(1500, 'sine', 0.05, 2000);
        setTimeout(() => playSound(1500, 'sine', 0.05, 2000), 100);
        break;
      case 'panda': // Friendly deep sound
        playSound(300, 'sine', 0.3, 250);
        break;
      case 'rabbit': // Boing
        playSound(400, 'triangle', 0.2, 800);
        break;
    }
  };

  const playPop = () => playSound(600, 'sine', 0.1, 300);
  
  const playClear = () => {
    // Excited "Win" Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((note, i) => {
      setTimeout(() => playSound(note, 'sine', 0.4, note * 1.05), i * 100);
    });
  };

  const playGameOver = () => {
    playSound(440, 'sawtooth', 0.3, 110);
  };

  const createPiece = useCallback((): Piece => {
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
      shape,
      animal,
      pos: { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 }
    };
  }, []);

  const checkCollision = (piece: Piece, pos: Position = piece.pos, gridState = grid) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (
            newX < 0 || newX >= GRID_WIDTH ||
            newY >= GRID_HEIGHT ||
            (newY >= 0 && gridState[newY][newX].animal !== null)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergePiece = () => {
    if (!currentPiece) return;
    const newGrid = grid.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const gridY = currentPiece.pos.y + y;
          const gridX = currentPiece.pos.x + x;
          if (gridY >= 0) {
            newGrid[gridY][gridX] = { animal: currentPiece.animal };
          }
        }
      });
    });

    // Check lines
    const linesToClear: number[] = [];
    const finalGrid = newGrid.filter((row, idx) => {
      const isFull = row.every(cell => cell.animal !== null);
      if (isFull) linesToClear.push(idx);
      return !isFull;
    });

    if (linesToClear.length > 0) {
      setClearLines(linesToClear);
      playClear();
      setScore(s => s + (linesToClear.length * 10));
      
      // Add empty lines back to the top
      while (finalGrid.length < GRID_HEIGHT) {
        finalGrid.unshift(Array(GRID_WIDTH).fill({ animal: null }));
      }
      
      setTimeout(() => {
        setGrid(finalGrid);
        setClearLines([]);
      }, 500);
    } else {
      setGrid(newGrid);
      if (currentPiece) playAnimalSound(currentPiece.animal);
    }

    const nextPiece = createPiece();
    if (checkCollision(nextPiece, nextPiece.pos, newGrid)) {
      setIsGameOver(true);
      setIsPlaying(false);
      playGameOver();
    } else {
      setCurrentPiece(nextPiece);
    }
  };

  const move = (dir: { x: number, y: number }) => {
    if (!currentPiece || !isPlaying) return;
    const newPos = { x: currentPiece.pos.x + dir.x, y: currentPiece.pos.y + dir.y };
    if (!checkCollision(currentPiece, newPos)) {
      setCurrentPiece({ ...currentPiece, pos: newPos });
      return true;
    }
    if (dir.y > 0) {
      mergePiece();
    }
    return false;
  };

  const startGame = () => {
    setGrid(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill({ animal: null })));
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setCurrentPiece(createPiece());
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      gameLoopRef.current = setInterval(() => {
        move({ x: 0, y: 1 });
      }, INITIAL_TICK_SPEED);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, currentPiece]);

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden touch-none">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
          <Star className="text-yellow-400 fill-yellow-400" size={24} />
          <span className="text-2xl font-bold text-sky-700">{score}</span>
        </div>
        
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="bg-white/80 p-2 rounded-full shadow-sm text-sky-600 active:scale-90 transition-transform"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Game Board Container */}
      <div className="relative bg-white/50 p-2 rounded-3xl shadow-xl border-4 border-white/80 backdrop-blur-sm">
        <div 
          className="grid gap-1 bg-sky-200/30 rounded-2xl p-1"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`,
            width: 'min(85vw, 320px)',
            height: 'min(125vw, 480px)'
          }}
        >
          {grid.map((row, y) => (
            row.map((cell, x) => {
              // Current piece check
              let animal = cell.animal;
              let isCurrent = false;
              if (currentPiece) {
                const py = y - currentPiece.pos.y;
                const px = x - currentPiece.pos.x;
                if (py >= 0 && py < currentPiece.shape.length && px >= 0 && px < currentPiece.shape[py].length) {
                  if (currentPiece.shape[py][px]) {
                    animal = currentPiece.animal;
                    isCurrent = true;
                  }
                }
              }

              const isClearing = clearLines.includes(y);

              return (
                <motion.div
                  key={`${x}-${y}`}
                  id={`cell-${x}-${y}`}
                  layout
                  className={`
                    relative rounded-lg flex items-center justify-center
                    ${animal ? ANIMAL_COLORS[animal] : 'bg-white/30'}
                    ${isCurrent ? 'shadow-inner' : 'shadow-sm'}
                    transition-colors duration-200
                  `}
                  initial={false}
                  animate={{
                    scale: isClearing ? [1, 1.2, 0] : 1,
                    opacity: isClearing ? 0 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {animal && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10 }}
                    >
                      <AnimalIcon type={animal} size={24} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          ))}
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {!isPlaying && !isGameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-sky-400/20 backdrop-blur-md rounded-2xl p-6 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-8"
              >
                <div className="bg-white p-4 rounded-full shadow-lg mb-4">
                  <Play className="text-sky-500 fill-sky-500 ml-2" size={48} />
                </div>
                <h1 className="text-3xl font-black text-sky-700 tracking-tight">ANIMAL JOY</h1>
                <p className="text-sky-600 font-medium">Bermain dengan hewan lucu!</p>
              </motion.div>
              <button 
                onClick={startGame}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-full text-2xl shadow-xl active:scale-95 transition-all w-full"
              >
                MULAI
              </button>
            </motion.div>
          )}

          {isGameOver && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-2xl"
            >
              <div className="bg-yellow-100 p-4 rounded-full mb-4">
                <RotateCcw className="text-yellow-600" size={48} />
              </div>
              <h2 className="text-4xl font-black text-sky-800 mb-2">Hebat!</h2>
              <div className="flex items-center gap-2 mb-6">
                <Star className="text-yellow-400 fill-yellow-400" size={32} />
                <span className="text-4xl font-bold text-sky-700">{score}</span>
              </div>
              <button 
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-full text-2xl shadow-xl active:scale-95 transition-all w-full"
              >
                ULANGI
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md mt-6 grid grid-cols-3 gap-4 px-4">
        <button 
          onClick={() => move({ x: -1, y: 0 })}
          className="bg-white p-6 rounded-2xl shadow-lg border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 text-sky-500 flex justify-center transition-all"
          id="btn-left"
        >
          <ArrowLeft size={40} strokeWidth={3} />
        </button>
        <button 
          onClick={() => move({ x: 0, y: 1 })}
          className="bg-white p-6 rounded-2xl shadow-lg border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 text-green-500 flex justify-center transition-all"
          id="btn-down"
        >
          <ArrowDown size={40} strokeWidth={3} />
        </button>
        <button 
          onClick={() => move({ x: 1, y: 0 })}
          className="bg-white p-6 rounded-2xl shadow-lg border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 text-sky-500 flex justify-center transition-all"
          id="btn-right"
        >
          <ArrowRight size={40} strokeWidth={3} />
        </button>
      </div>

      {/* Instructions footer - subtle */}
      <div className="mt-8 text-sky-400 text-sm font-medium opacity-60">
        Ketuk Tombol untuk Bergeser
      </div>
    </div>
  );
}

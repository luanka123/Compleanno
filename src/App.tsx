/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Music, Music2, Waves, Heart, Trophy, Zap, ChevronRight, LogIn, User as UserIcon } from "lucide-react";
import { auth, signInWithGoogle, updateUserLevel, getUserStats } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface PuzzleTile {
  id: number;
  currentPos: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'splash' | 'celebration' | 'game'>('splash');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [puzzleTiles, setPuzzleTiles] = useState<PuzzleTile[]>([]);
  const [isWon, setIsWon] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Play click sound
  const playClick = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(e => console.log("Click sound blocked", e));
    }
  };

  // Puzzle Initialization
  const initPuzzle = () => {
    let tiles = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, currentPos: i }));
    // Shuffle logic (simple shuffle, but needs to ensure solvability)
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i].currentPos, tiles[j].currentPos] = [tiles[j].currentPos, tiles[i].currentPos];
    }
    setPuzzleTiles(tiles);
    setIsWon(false);
  };

  useEffect(() => {
    if (view === 'game') {
      initPuzzle();
      if (gameMusicRef.current) {
        gameMusicRef.current.play().catch(e => console.log("Game music blocked", e));
      }
    } else {
      if (gameMusicRef.current) {
        gameMusicRef.current.pause();
        gameMusicRef.current.currentTime = 0;
      }
    }
  }, [view]);

  // Puzzle Move Logic
  const moveTile = (tileId: number) => {
    playClick();
    const tile = puzzleTiles.find(t => t.id === tileId);
    const usedPositions = puzzleTiles.map(t => t.currentPos);
    let currentEmpty = 0;
    for (let i = 0; i < 9; i++) {
        if (!usedPositions.includes(i)) {
            currentEmpty = i;
            break;
        }
    }

    if (!tile) return;

    const row = Math.floor(tile.currentPos / 3);
    const col = tile.currentPos % 3;
    const emptyRow = Math.floor(currentEmpty / 3);
    const emptyCol = currentEmpty % 3;

    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = puzzleTiles.map(t => 
        t.id === tileId ? { ...t, currentPos: currentEmpty } : t
      );
      setPuzzleTiles(newTiles);
      
      // Check Win
      const solved = newTiles.every(t => t.id - 1 === t.currentPos);
      if (solved) {
        setIsWon(true);
        confetti({ 
          particleCount: 150, 
          spread: 70, 
          origin: { y: 0.6 },
          colors: ['#00ff00', '#ffffff', '#fbbf24']
        });
      }
    }
  };

  const startCelebration = () => {
    playClick();
    setView('celebration');
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio blocked", e));
      setIsPlaying(true);
    }
    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.5 },
      ticks: 400
    });
  };

  const backToMenu = () => {
    playClick();
    setView('splash');
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#001b3a] font-pixel text-white select-none touch-none">
      <audio ref={audioRef} src="/canzone.mp3" loop />
      <audio ref={gameMusicRef} src="/musica-gioco.mp3" loop />
      <audio ref={clickSoundRef} src="/click.mp3" />
      
      {/* Background Hearts Decor (Splash Only) */}
      {view === 'splash' && (
        <div className="pointer-events-none absolute inset-0 z-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "-10%", opacity: [0, 0.5, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: i * 1.5 }}
              style={{ left: `${20 * i + 10}%` }}
            >
              <Heart size={40} className="fill-red-500/30 text-red-500/10" />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'splash' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex h-full flex-col items-center justify-center p-6"
          >
            <motion.h1 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-12 text-center text-4xl md:text-6xl text-yellow-400 drop-shadow-[0_4px_0_#b45309]"
            >
              ANDREA<br/>LIVELLO 9
            </motion.h1>

            <div className="flex flex-col gap-6 w-full max-w-xs md:max-w-md">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCelebration}
                className="flex items-center justify-center gap-3 rounded-none border-4 border-yellow-700 bg-yellow-500 py-6 text-xl text-black shadow-[4px_4px_0_#b45309] hover:bg-yellow-400"
              >
                🎉 BUON COMPLEANNO
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClick(); setView('game'); }}
                className="flex items-center justify-center gap-3 rounded-none border-4 border-green-800 bg-green-600 py-5 text-lg md:text-xl text-white shadow-[4px_4px_0_#166534] hover:bg-green-500 active:translate-y-1 active:shadow-none transition-all"
              >
                🎮 SFIDA IL PUZZLE
              </motion.button>
            </div>
            
            <p className="mt-8 text-[10px] text-white/40 tracking-widest uppercase text-center">
              Seleziona una missione per iniziare
            </p>
          </motion.div>
        )}

        {view === 'celebration' && (
          <motion.div 
            key="celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full"
          >
            {/* NBA Style Hero */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/andrea-basket.jpg')" }}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-20 flex h-full flex-col items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md rounded-none border-4 border-white bg-black/80 p-8 text-center shadow-[8px_8px_0_rgba(255,255,255,0.2)]"
              >
                <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
                <h2 className="mb-4 text-2xl text-yellow-400">EQUIPAGGIAMENTO SBLOCCATO!</h2>
                <div className="mb-6 h-32 w-full overflow-hidden rounded-lg bg-blue-900/30">
                   <img src="/sup-board.jpg" alt="SUP" className="h-full w-full object-cover" />
                </div>
                <p className="text-sm leading-relaxed text-white md:text-md">
                   IL TUO NUOVO <span className="text-cyan-400">SUP</span> È PRONTO PER L'AVVENTURA!
                </p>
              </motion.div>

              <button 
                onClick={backToMenu}
                className="mt-12 flex items-center gap-2 border-2 border-white/30 bg-black/40 px-6 py-3 text-xs uppercase hover:bg-black/60"
              >
                 INDIETRO AL MENU
              </button>
            </div>
          </motion.div>
        )}

        {view === 'game' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex h-full flex-col items-center justify-center p-6 bg-[#1a1a1a]"
          >
            <h2 className="mb-8 text-2xl text-green-400">MINECRAFT PUZZLE</h2>
            
            <div className="relative grid grid-cols-3 gap-2 bg-gray-800 p-2 border-4 border-gray-900 shadow-[8px_8px_0_#000]">
              {[...Array(9)].map((_, pos) => {
                const tile = puzzleTiles.find(t => t.currentPos === pos);
                return (
                  <div key={pos} className="h-16 w-16 bg-gray-700/50 sm:h-20 sm:w-20 md:h-28 md:w-28 flex items-center justify-center">
                    {tile && (
                      <motion.button
                        layoutId={`tile-${tile.id}`}
                        onClick={() => moveTile(tile.id)}
                        className={`h-full w-full border-2 md:border-4 border-[#3c2f23] flex items-center justify-center text-xl sm:text-2xl md:text-3xl text-white shadow-[inset_1px_1px_0_#7a6a4e,inset_-1px_-1px_0_#2b1f15] md:shadow-[inset_2px_2px_0_#7a6a4e,inset_-2px_-2px_0_#2b1f15] ${
                          isWon ? 'bg-yellow-500' : 'bg-[#5b4a3a]'
                        }`}
                        style={{ 
                          backgroundImage: "url('https://picsum.photos/seed/dirt/100/100')",
                          backgroundBlendMode: "multiply"
                        }}
                      >
                        {tile.id}
                      </motion.button>
                    )}
                  </div>
                );
              })}
              
              {isWon && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                  <Trophy className="text-yellow-400 mb-4 animate-bounce" size={64} />
                  <h3 className="text-2xl text-yellow-400 drop-shadow-md">HAI VINTO!</h3>
                  <p className="text-sm uppercase mt-4 text-white/80">MAESTRO LIVELLO 9</p>
                  <button 
                    onClick={() => { playClick(); initPuzzle(); }}
                    className="mt-8 bg-green-600 px-6 py-3 text-sm border-2 border-white/20 active:scale-95 transition-transform"
                  >
                    RIGIOCA
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={backToMenu}
              className="mt-8 flex items-center gap-2 border-2 border-white/30 bg-black/40 px-6 py-3 text-xs uppercase hover:bg-black/60 active:scale-95 transition-transform"
            >
               INDIETRO AL MENU
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="absolute bottom-4 left-4 z-50 pointer-events-none opacity-30">
        <p className="text-[8px] uppercase">Andrea OS 9.0</p>
      </div>
    </div>
  );
}

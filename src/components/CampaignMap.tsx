import React, { useState } from 'react';
import {
  Lock,
  Play,
  CheckCircle2,
  Swords,
  Shield,
  Star,
  ChevronRight,
  Sparkles,
  Infinity as InfinityIcon,
  Crosshair,
  Trophy,
  Zap,
  LogOut,
  Skull,
} from 'lucide-react';

export interface CampaignLevelData {
  chapter: number;
  level: number;
  id: string; // "1-1"
  name: string;
  isBoss: boolean;
  objective: string;
}

export const CHAPTERS_DATA = [
  {
    chapter: 1,
    title: 'Chapter 1: Deep Space Swarm',
    subtitle: 'Outer Perimeter Outpost',
    color: '#00f3ff',
    levels: [
      { chapter: 1, level: 1, id: '1-1', name: 'Scout Vanguard', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 1, level: 2, id: '1-2', name: 'Meteor Belt Passage', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 1, level: 3, id: '1-3', name: 'Reinforced Patrol', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 1, level: 4, id: '1-4', name: 'Swarm Frontier', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 1, level: 5, id: '1-5', name: 'THE SWARM CORE', isBoss: true, objective: 'Defeat The Swarm Boss' },
    ],
  },
  {
    chapter: 2,
    title: 'Chapter 2: Asteroid Citadel',
    subtitle: 'Dense Debris Zone',
    color: '#f59e0b',
    levels: [
      { chapter: 2, level: 1, id: '2-1', name: 'Granite Outpost', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 2, level: 2, id: '2-2', name: 'Iron Rain Field', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 2, level: 3, id: '2-3', name: 'Heavy Crusher Valley', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 2, level: 4, id: '2-4', name: 'Fortress Gateway', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 2, level: 5, id: '2-5', name: 'THE LASER MATRIX', isBoss: true, objective: 'Defeat The Laser Matrix' },
    ],
  },
  {
    chapter: 3,
    title: 'Chapter 3: Nebula Vanguard',
    subtitle: 'Ion Plasma Cloud',
    color: '#ec4899',
    levels: [
      { chapter: 3, level: 1, id: '3-1', name: 'Violet Shift', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 3, level: 2, id: '3-2', name: 'Ion Storm Barrage', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 3, level: 3, id: '3-3', name: 'Plasma Ambush', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 3, level: 4, id: '3-4', name: 'Hydra Threshold', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 3, level: 5, id: '3-5', name: 'NEBULA HYDRA', isBoss: true, objective: 'Annihilate Nebula Hydra' },
    ],
  },
  {
    chapter: 4,
    title: 'Chapter 4: Void Eclipse',
    subtitle: 'Dark Sector Anomaly',
    color: '#a855f7',
    levels: [
      { chapter: 4, level: 1, id: '4-1', name: 'Shadow Approach', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 4, level: 2, id: '4-2', name: 'Null Space Wave', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 4, level: 3, id: '4-3', name: 'Eclipse Patrol', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 4, level: 4, id: '4-4', name: 'Event Horizon', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 4, level: 5, id: '4-5', name: 'VOID OVERLORD', isBoss: true, objective: 'Eradicate Void Overlord' },
    ],
  },
  {
    chapter: 5,
    title: 'Chapter 5: Singularity Fortress',
    subtitle: 'Core Enemy Stronghold',
    color: '#10b981',
    levels: [
      { chapter: 5, level: 1, id: '5-1', name: 'Omega Perimeter', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 5, level: 2, id: '5-2', name: 'Hyperdrive Breach', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 5, level: 3, id: '5-3', name: 'Gravity Rampart', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 5, level: 4, id: '5-4', name: 'Final Vanguard', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 5, level: 5, id: '5-5', name: 'SINGULARITY CORE', isBoss: true, objective: 'Destroy Final Fortress Core' },
    ],
  },
  {
    chapter: 6,
    title: 'Chapter 6: Void Abyss',
    subtitle: 'SECRET NIGHTMARE SECTOR',
    color: '#c084fc',
    levels: [
      { chapter: 6, level: 1, id: '6-1', name: 'Corrupted Veil', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 6, level: 2, id: '6-2', name: 'Nightmare Rift', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 6, level: 3, id: '6-3', name: 'Abyssal Echo', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 6, level: 4, id: '6-4', name: 'Shadowed Gate', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 6, level: 5, id: '6-5', name: 'THE HIDDEN ONE', isBoss: true, objective: 'Defeat The Corrupted Browning' },
    ],
  },
  {
    chapter: 7,
    title: "Chapter 7: The Void's Reckoning",
    subtitle: "THE ADMIRAL'S SIN - TITAN CLASH",
    color: '#e11d48',
    levels: [
      { chapter: 7, level: 1, id: '7-1', name: 'Hades Trench', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 7, level: 2, id: '7-2', name: 'Dreadnought Line', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 7, level: 3, id: '7-3', name: 'Dark Vanguard', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 7, level: 4, id: '7-4', name: 'Tillman Barrier', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 7, level: 5, id: '7-5', name: 'PLUTO, HADES OF THE DARK', isBoss: true, objective: 'Vanquish Pluto Titan Dreadnought' },
    ],
  },
  {
    chapter: 8,
    title: 'Chapter 8: Sector Alsace',
    subtitle: 'Dreadnought Graveyard',
    color: '#e2e8f0',
    levels: [
      { chapter: 8, level: 1, id: '8-1', name: 'Derelict Anchorage', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 8, level: 2, id: '8-2', name: 'Iron Hull Passage', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 8, level: 3, id: '8-3', name: 'Broadside Gauntlet', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 8, level: 4, id: '8-4', name: 'Battlecruiser Approach', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 8, level: 5, id: '8-5', name: 'ALSACE BATTLECRUISER', isBoss: true, objective: 'Annihilate Alsace Flagship' },
    ],
  },
  {
    chapter: 9,
    title: 'Chapter 9: Event Horizon',
    subtitle: 'Singularity Gateway Anomaly',
    color: '#3b82f6',
    levels: [
      { chapter: 9, level: 1, id: '9-1', name: 'Gravitational Well', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 9, level: 2, id: '9-2', name: 'Photon Horizon', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 9, level: 3, id: '9-3', name: 'Dark Matter Cascade', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 9, level: 4, id: '9-4', name: 'Chronos Threshold', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 9, level: 5, id: '9-5', name: 'OMEGA OVERLORD', isBoss: true, objective: 'Defeat Omega Overlord' },
    ],
  },
  {
    chapter: 10,
    title: 'Chapter 10: Dropforge Core',
    subtitle: 'Tactical Command Apex',
    color: '#f43f5e',
    levels: [
      { chapter: 10, level: 1, id: '10-1', name: 'Orbital Drop Station', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 10, level: 2, id: '10-2', name: 'Forge Citadel Rampart', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 10, level: 3, id: '10-3', name: 'Rushdown Armageddon', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 10, level: 4, id: '10-4', name: 'Apex Vanguard', isBoss: false, objective: 'Survive for 60 seconds' },
      { chapter: 10, level: 5, id: '10-5', name: 'RUSHDOWN APEX', isBoss: true, objective: 'Conquer Rushdown Apex Final Boss' },
    ],
  },
];

import { getActiveSlotId, loadSaveSlot, saveSaveSlot, isFreeplayUnlocked } from '../utils/saveSystem';

export function getHighestUnlockedLevel(): { chapter: number; level: number } {
  const slotId = getActiveSlotId();
  if (slotId) {
    const slot = loadSaveSlot(slotId);
    return { chapter: slot.maxUnlockedChapter || 1, level: slot.maxUnlockedLevel || 1 };
  }
  const saved = localStorage.getItem('rushdown_campaign_max_unlocked');
  if (saved) {
    const [c, l] = saved.split('-').map(Number);
    if (!isNaN(c) && !isNaN(l)) {
      return { chapter: c, level: l };
    }
  }
  return { chapter: 1, level: 1 };
}

export function unlockNextLevel(currentChapter: number, currentLevel: number) {
  let nextC = currentChapter;
  let nextL = currentLevel + 1;

  if (nextL > 5) {
    nextC = Math.min(10, currentChapter + 1);
    nextL = 1;
  }

  const slotId = getActiveSlotId();
  if (slotId) {
    const slot = loadSaveSlot(slotId);
    if (nextC > slot.maxUnlockedChapter || (nextC === slot.maxUnlockedChapter && nextL > slot.maxUnlockedLevel)) {
      slot.maxUnlockedChapter = nextC;
      slot.maxUnlockedLevel = nextL;
      saveSaveSlot(slot);
    }
  } else {
    const currentMax = getHighestUnlockedLevel();
    if (nextC > currentMax.chapter || (nextC === currentMax.chapter && nextL > currentMax.level)) {
      localStorage.setItem('rushdown_campaign_max_unlocked', `${nextC}-${nextL}`);
    }
  }
}

interface CampaignMapProps {
  onSelectLevel: (chapter: number, level: number) => void;
  onPlayEndless: () => void;
  onChangeSlot?: () => void;
  onLogoClick?: () => void;
  activeSlotId?: number | null;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({
  onSelectLevel,
  onPlayEndless,
  onChangeSlot,
  onLogoClick,
  activeSlotId,
}) => {
  const maxUnlocked = getHighestUnlockedLevel();
  const isSlot4 = activeSlotId === 4;
  const freeplayUnlocked = isFreeplayUnlocked() || isSlot4 || maxUnlocked.chapter >= 10;
  const allChapters = CHAPTERS_DATA;

  const [selectedChapter, setSelectedChapter] = useState<number>(
    isSlot4 ? 1 : Math.min(10, maxUnlocked.chapter || 1)
  );
  const [showLoreModal, setShowLoreModal] = useState<boolean>(false);

  const isLevelUnlocked = (ch: number, lvl: number) => {
    if (isSlot4 || freeplayUnlocked) return true;
    if (ch < maxUnlocked.chapter) return true;
    if (ch === maxUnlocked.chapter && lvl <= maxUnlocked.level) return true;
    return false;
  };

  const isLevelCompleted = (ch: number, lvl: number) => {
    if (ch < maxUnlocked.chapter) return true;
    if (ch === maxUnlocked.chapter && lvl < maxUnlocked.level) return true;
    return false;
  };

  const handleLevelClick = (ch: number, lvl: number) => {
    if (ch === 7 && lvl === 1) {
      setShowLoreModal(true);
    } else {
      onSelectLevel(ch, lvl);
    }
  };

  const currentChapterData = allChapters.find((c) => c.chapter === selectedChapter) || allChapters[0];

  return (
    <div className="w-full max-w-4xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-7 backdrop-blur-md shadow-2xl flex flex-col items-center select-none">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {activeSlotId ? (
            <span className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded text-cyan-400 font-mono text-xs font-extrabold">
              {activeSlotId === 4 ? 'PROFILE: FREEPLAY' : `PROFILE: SLOT 0${activeSlotId}`}
            </span>
          ) : null}

          {onChangeSlot && (
            <button
              onClick={onChangeSlot}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded text-xs font-mono font-bold transition-all cursor-pointer border border-slate-700 hover:border-cyan-400 flex items-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-cyan-400" />
              <span>SWITCH SAVE SLOT</span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Trophy className="w-3.5 h-3.5" />
          CAMPAIGN PROGRESSION
        </div>
      </div>

      {/* PROMINENT LOGO & TITLE */}
      <div className="text-center mb-6 flex flex-col items-center">
        <div
          onClick={onLogoClick}
          className="cursor-pointer group flex flex-col items-center select-none py-1.5 px-5 rounded-2xl hover:bg-cyan-950/40 transition-all border border-transparent hover:border-cyan-500/30 active:scale-95 mb-2"
          title="Click 5 times consecutively to unlock secret Browning ship!"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-cyan-400 group-hover:animate-bounce" />
            <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 group-hover:from-rose-400 group-hover:to-cyan-300 transition-all">
              PROJECT RUSHDOWN
            </h1>
            <Sparkles className="w-7 h-7 text-rose-400 group-hover:animate-spin" />
          </div>
          <span className="text-[11px] font-mono font-extrabold text-cyan-400 tracking-widest uppercase mt-0.5">
            TACTICAL SHMUP APEX
          </span>
        </div>

        <h2 className="text-xl font-black text-slate-200 uppercase tracking-wider">
          CAMPAIGN MISSION MAP
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete levels to unlock new sectors & battle sector bosses
        </p>
      </div>

      {/* MODE SELECTION BAR */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-slate-950 border border-slate-800 rounded-xl">
        {/* CHAPTER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
          {allChapters.map((ch) => {
            const isUnlocked = isLevelUnlocked(ch.chapter, 1);
            const isSelected = selectedChapter === ch.chapter;

            return (
              <button
                key={ch.chapter}
                onClick={() => isUnlocked && setSelectedChapter(ch.chapter)}
                disabled={!isUnlocked}
                className={`px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : isUnlocked
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-950 text-slate-600 opacity-60 cursor-not-allowed border border-slate-800/40'
                }`}
              >
                {!isUnlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                )}
                CH {ch.chapter}
              </button>
            );
          })}
        </div>

        {/* ENDLESS ARCADE BUTTON */}
        <button
          onClick={onPlayEndless}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-extrabold rounded-lg shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <InfinityIcon className="w-4 h-4" />
          ENDLESS ARCADE MODE
        </button>
      </div>

      {/* SELECTED CHAPTER CARD */}
      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: currentChapterData.color }}
            />
            <h3 className="font-extrabold text-lg text-slate-100">{currentChapterData.title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{currentChapterData.subtitle}</p>
        </div>

        <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
          Max Sector Reached: Chapter {maxUnlocked.chapter}-{maxUnlocked.level}
        </div>
      </div>

      {/* LEVEL NODES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full mb-6">
        {currentChapterData.levels.map((lvl) => {
          const unlocked = isLevelUnlocked(lvl.chapter, lvl.level);
          const completed = isLevelCompleted(lvl.chapter, lvl.level);

          return (
            <div
              key={lvl.id}
              onClick={() => unlocked && onSelectLevel(lvl.chapter, lvl.level)}
              className={`relative rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between select-none ${
                !unlocked
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-50 cursor-not-allowed'
                  : lvl.isBoss
                  ? 'bg-slate-900/90 border-amber-500/70 shadow-lg shadow-amber-500/10 hover:border-amber-400 hover:scale-[1.02] cursor-pointer'
                  : 'bg-slate-950/90 border-slate-800 hover:border-cyan-400/80 hover:bg-slate-900 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              <div>
                {/* NODE HEADER */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      lvl.isBoss
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    LEVEL {lvl.id}
                  </span>

                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : !unlocked ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : lvl.isBoss ? (
                    <Swords className="w-4 h-4 text-amber-400 animate-bounce" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  )}
                </div>

                <h4
                  className={`font-black text-sm mb-1 ${
                    lvl.isBoss ? 'text-amber-300 tracking-wide' : 'text-slate-100'
                  }`}
                >
                  {lvl.name}
                </h4>

                <p className="text-[11px] text-slate-400 leading-snug">{lvl.objective}</p>
              </div>

              {/* ACTION FOOTER */}
              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-bold ${
                    completed
                      ? 'text-emerald-400'
                      : unlocked
                      ? 'text-cyan-400'
                      : 'text-slate-600'
                  }`}
                >
                  {completed ? 'CLEARED' : unlocked ? 'READY' : 'LOCKED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK FOOTER INFO & SWITCH SLOT */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs font-mono">
        <p className="text-slate-500 text-center sm:text-left">
          💡 Tip: Unlocking Level 1-5 allows you to battle <span className="text-amber-400">The Swarm Sector Boss</span>!
        </p>

        {onChangeSlot && (
          <button
            onClick={onChangeSlot}
            className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-extrabold transition-all cursor-pointer border border-slate-700 hover:border-cyan-400 flex items-center gap-2 shrink-0 shadow-md hover:scale-[1.02]"
          >
            <LogOut className="w-4 h-4 text-cyan-400" />
            <span>SWITCH SAVE SLOT</span>
          </button>
        )}
      </div>

      {/* CHAPTER 7 LORE INTRO MODAL */}
      {showLoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 shadow-2xl shadow-rose-950/80 animate-in fade-in zoom-in duration-200 text-slate-100 font-sans">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-950 border border-rose-600 rounded-xl text-rose-400">
                <Skull className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">
                  FREEPLAY TITAN CLASH
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  CHAPTER 7: THE VOID'S RECKONING
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-rose-900/50 mb-6 font-mono">
              <p className="text-rose-400 font-extrabold text-xs tracking-wider uppercase">
                ⚠ CLASSIFIED ADMIRALTY DOSSIER: "THE ADMIRAL'S SIN"
              </p>
              <p>
                Deep within the uncharted dark sector, long-range scans have detected <span className="text-rose-400 font-bold">PLUTO - HADES OF THE DARK</span>.
              </p>
              <p>
                Constructed on the colossal <span className="text-amber-400">Tillman Maximum Battleship 5x3 Blueprint</span>, Pluto is equipped with 30 heavy triple-barrel coilgun turrets, broadside grid lasers, and a self-repairing Hades Core.
              </p>
              <p className="text-xs text-rose-300/80 italic">
                Will you face the Void's ultimate titan and restore order to the galaxy?
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLoreModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                ABORT MISSION
              </button>
              <button
                onClick={() => {
                  setShowLoreModal(false);
                  onSelectLevel(7, 1);
                }}
                className="flex-2 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 border border-rose-400"
              >
                <Crosshair className="w-4 h-4" />
                <span>ENGAGE TITAN DREADNOUGHT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

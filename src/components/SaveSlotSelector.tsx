import React, { useState } from 'react';
import { SaveSlotData } from '../types';
import { getAllSaveSlots, clearSaveSlot, isFreeplayUnlocked } from '../utils/saveSystem';
import {
  Save,
  Trophy,
  Trash2,
  Sparkles,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  Plus,
  Rocket,
  RotateCcw,
  LogOut,
  Zap,
  Lock,
  Infinity as InfinityIcon,
} from 'lucide-react';

interface SaveSlotSelectorProps {
  onSelectSlot: (slotData: SaveSlotData) => void;
  onExitToMenu?: () => void;
  onLogoClick?: () => void;
  activeSlotId?: number | null;
}

export const SaveSlotSelector: React.FC<SaveSlotSelectorProps> = ({
  onSelectSlot,
  onExitToMenu,
  onLogoClick,
  activeSlotId,
}) => {
  const [slots, setSlots] = useState<SaveSlotData[]>(() => getAllSaveSlots());
  const [confirmClearSlotId, setConfirmClearSlotId] = useState<number | null>(null);

  const handleClear = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    clearSaveSlot(slotId);
    setSlots(getAllSaveSlots());
    setConfirmClearSlotId(null);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'No save data';
    const d = new Date(timestamp);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-3xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 sm:p-7 backdrop-blur-md shadow-2xl flex flex-col items-center select-none text-slate-100">
      {/* TOP NAV BAR (BADGE + EXIT BUTTON) */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Save className="w-3.5 h-3.5" />
          PILOT PROFILE SELECTION
        </div>

        {onExitToMenu && (
          <button
            onClick={onExitToMenu}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border border-slate-700 flex items-center gap-1.5 shadow-md hover:border-cyan-500/50"
          >
            <LogOut className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXIT TO TITLE</span>
          </button>
        )}
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

        <h2 className="text-lg font-black text-slate-200 uppercase tracking-wider">
          SELECT SAVE SLOT
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 max-w-md">
          Select a save profile to store campaign progress, high scores, and secret ship unlocks.
        </p>
      </div>

      {/* 4 SLOTS GRID */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {slots.map((slot) => {
          if (slot.slotId === 4) {
            const freeplayUnlocked = isFreeplayUnlocked();
            if (!freeplayUnlocked) {
              return (
                <div
                  key={slot.slotId}
                  className="relative rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between opacity-75 select-none"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-extrabold text-slate-500 tracking-wider">
                      SLOT 04
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-500 border border-slate-800 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      LOCKED
                    </span>
                  </div>

                  <div className="my-3 flex flex-col items-center justify-center text-center space-y-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                      <Lock className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="font-black text-xs font-mono text-slate-300 uppercase tracking-wider">
                      FREEPLAY MODE
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 leading-snug px-1">
                      Clear Level 5-5 (Final Boss) in Slot 1, 2, or 3 to unlock!
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-center">
                    <span className="text-[10px] font-mono text-slate-600 font-bold">
                      REQUIRES CHAPTER 5 CLEAR
                    </span>
                  </div>
                </div>
              );
            }

            // Freeplay Unlocked!
            return (
              <div
                key={slot.slotId}
                onClick={() => onSelectSlot(slot)}
                className="relative rounded-xl border border-purple-500/50 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 p-4 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] hover:border-purple-400 shadow-xl shadow-purple-950/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-extrabold text-purple-300 tracking-wider">
                    SLOT 04
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/50 flex items-center gap-1">
                    <InfinityIcon className="w-3 h-3 text-purple-400" />
                    FREEPLAY
                  </span>
                </div>

                <div className="my-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-200 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                    <span>UNLOCKED SANDBOX</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 leading-snug">
                    All 5 Chapters & Ships unlocked instantly! No high-scores stored.
                  </p>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                    <span>ALL CHAPTERS OPEN</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-purple-900/50 flex items-center justify-between">
                  <button className="text-xs font-extrabold text-purple-300 group-hover:text-white flex items-center gap-1 uppercase tracking-wider">
                    START FREEPLAY
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          }

          const isEmpty = slot.updatedAt === 0 && slot.highScore === 0 && slot.maxUnlockedChapter === 1 && slot.maxUnlockedLevel === 1 && !slot.browningUnlocked;

          return (
            <div
              key={slot.slotId}
              onClick={() => onSelectSlot(slot)}
              className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                isEmpty
                  ? 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80'
                  : 'bg-slate-900/90 border-cyan-500/30 hover:border-cyan-400 shadow-lg shadow-cyan-950/30'
              }`}
            >
              {/* TOP HEADER */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-extrabold text-cyan-400 tracking-wider">
                  SLOT 0{slot.slotId}
                </span>
                {isEmpty ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    EMPTY
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                    ACTIVE
                  </span>
                )}
              </div>

              {/* CARD CONTENT */}
              <div className="my-2 space-y-2">
                {isEmpty ? (
                  <div className="py-4 flex flex-col items-center justify-center text-slate-500 space-y-1">
                    <Plus className="w-7 h-7 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-cyan-300">
                      NEW PILOT
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Ch {slot.maxUnlockedChapter}, Lvl {slot.maxUnlockedLevel}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span>{slot.highScore.toLocaleString()} pts</span>
                    </div>

                    {slot.browningUnlocked && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[9px] font-mono font-bold">
                        <Sparkles className="w-3 h-3 text-rose-400 animate-pulse" />
                        <span>BROWNING</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(slot.updatedAt)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                <button
                  className="text-xs font-extrabold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wider"
                >
                  {isEmpty ? 'INITIALIZE' : 'LOAD'}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                {!isEmpty && (
                  <div>
                    {confirmClearSlotId === slot.slotId ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleClear(slot.slotId, e)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                        >
                          CLEAR
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmClearSlotId(null);
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmClearSlotId(slot.slotId);
                        }}
                        title="Delete Save Profile"
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center font-mono text-xs text-slate-500">
        All progress is auto-saved to your selected slot profile.
      </div>
    </div>
  );
};

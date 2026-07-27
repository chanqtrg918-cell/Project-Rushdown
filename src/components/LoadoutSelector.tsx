import React, { useState } from 'react';
import { ShipType, ShipInfo, PerkType, PerkInfo } from '../types';
import { getActiveSlotId, loadSaveSlot, saveSaveSlot } from '../utils/saveSystem';
import {
  HeartPulse,
  Gauge,
  Skull,
  Magnet,
  Check,
  ShieldAlert,
  Bot,
  Rocket,
  Shield,
  Zap,
  Crosshair,
  SlidersHorizontal,
  Lock,
  Sparkles,
} from 'lucide-react';

export const SHIPS_LIST: ShipInfo[] = [
  {
    id: 'STANDARD',
    name: 'Standard Apex',
    tagline: 'Balanced All-Rounder',
    description: 'Reliable space fighter with standard hull durability, normal thruster agility, and balanced plasma firepower.',
    color: '#00f3ff',
    accentColor: '#0284c7',
    stats: {
      hp: 100,
      speedText: 'Normal (100%)',
      damageText: '1.0x Base',
      bulletText: 'Standard',
    },
  },
  {
    id: 'TEXAN',
    name: 'Texan Dreadnought',
    tagline: 'Heavy Tank Fortress',
    description: 'Reinforced titanium armor with +50% Max HP (150 HP) & 50% larger heavy-impact shells. Moves 25% slower.',
    color: '#f59e0b',
    accentColor: '#d97706',
    stats: {
      hp: 150,
      speedText: 'Heavy (-25%)',
      damageText: '1.5x Heavy',
      bulletText: '+50% Large',
    },
  },
  {
    id: 'AKIRA',
    name: 'Akira Interceptor',
    tagline: 'High-Speed Drift Ship',
    description: 'High-octane drift ship with +30% Thruster Speed & +50% Plasma Damage per hit. Fragile hull with -40% Max HP (60 HP).',
    color: '#ec4899',
    accentColor: '#be185d',
    stats: {
      hp: 60,
      speedText: 'Drift (+30%)',
      damageText: '1.5x High',
      bulletText: 'Rapid',
    },
  },
  {
    id: 'FOEHAMMER',
    name: 'Foehammer (Mjolnir)',
    tagline: 'Almighty Railgun Artillery',
    description: 'Electromagnetic coilgun chassis with 150 HP & giant piercing Railgun beam that line-kills targets. Slow movement (-20%) & 1.2s reload.',
    color: '#a855f7',
    accentColor: '#9333ea',
    stats: {
      hp: 150,
      speedText: 'Slow (-20%)',
      damageText: '5.0x Piercing',
      bulletText: '1.2s Railgun',
    },
  },
  {
    id: 'BROWNING',
    name: 'Browning Overlord',
    tagline: 'SECRET CHEAT SHIP - Continuous 3-Way Railgun',
    description: 'Secret prototype with continuous rapid 3-way spread shot of giant piercing railguns (Zero Cooldown), 125 HP, 4% HP regen/sec, & MEME BEAM Overdrive [E].',
    color: '#ef4444',
    accentColor: '#dc2626',
    stats: {
      hp: 125,
      speedText: 'Normal (100%)',
      damageText: '3-Way Piercing',
      bulletText: 'Meme Beam Ready',
    },
  },
  {
    id: 'MARTIN',
    name: 'Martin Lockheed',
    tagline: 'Massive Tactical Missile Truck',
    description: 'Heavy ordnance platform with 150 HP, 1.5% HP regen/sec, & slow thrusters (-25%). Fires a heavy volley of 4 homing missiles every 1.0s with AOE splash explosions.',
    color: '#10b981',
    accentColor: '#059669',
    stats: {
      hp: 150,
      speedText: 'Slow (-25%)',
      damageText: '4x Homing Volley',
      bulletText: '1.0s Salvo',
    },
  },
  {
    id: 'DEATH',
    name: 'Death Dreadnought',
    tagline: 'The Queen of the Void',
    description: 'Gargantuan super-dreadnought with 300 HP, 3-layer persistent shield (regens 1/10s), 24-laser USS Montana array (12 up, 12 down), & Battlestar Forge spawning hunting interceptor drones every 4s. (-35% Speed, 2% HP regen/s).',
    color: '#c084fc',
    accentColor: '#9333ea',
    stats: {
      hp: 300,
      speedText: 'Slow (-35%)',
      damageText: '24-Laser Array',
      bulletText: 'Battlestar Forge',
    },
  },
];

export const PERK_LIST: PerkInfo[] = [
  {
    id: 'DEAD_RINGER',
    name: 'Dead Ringer',
    description: 'Survive a fatal hit once per game with 10% health & emergency invincibility shielding.',
    iconName: 'HeartPulse',
    color: '#ec4899',
  },
  {
    id: 'SPEEDSTER',
    name: 'Speedster',
    description: 'Boost player thruster speed by +50% for high-mobility evasion.',
    iconName: 'Gauge',
    color: '#06b6d4',
  },
  {
    id: 'GLASS_CANNON',
    name: 'Glass Cannon',
    description: '+100% Laser output damage, but cuts maximum health bar in half.',
    iconName: 'Skull',
    color: '#f59e0b',
  },
  {
    id: 'MAGNET',
    name: 'Magnet',
    description: 'Gravitationally pull dropped power-ups toward your ship when close.',
    iconName: 'Magnet',
    color: '#8b5cf6',
  },
  {
    id: 'EXTRA_TURRET',
    name: 'Extra Turret',
    description: 'Spawn an auto-turret drone that targets closest enemies and fires every 0.5s.',
    iconName: 'Bot',
    color: '#10b981',
  },
];

interface LoadoutSelectorProps {
  selectedShip: ShipType;
  onSelectShip: (ship: ShipType) => void;
  selectedPerks: PerkType[];
  onTogglePerk: (perkId: PerkType) => void;
  onStartGame: () => void;
  browningUnlocked?: boolean;
  deathUnlocked?: boolean;
  onUnlockDeath?: () => void;
}

export const LoadoutSelector: React.FC<LoadoutSelectorProps> = ({
  selectedShip,
  onSelectShip,
  selectedPerks,
  onTogglePerk,
  onStartGame,
  browningUnlocked = false,
  deathUnlocked = false,
  onUnlockDeath,
}) => {
  const [activeTab, setActiveTab] = useState<'SHIP' | 'PERKS'>('SHIP');
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = terminalInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'DEATH') {
      if (onUnlockDeath) onUnlockDeath();
      setTerminalMessage('✓ ENCRYPTION OVERRIDDEN: DEATH DREADNOUGHT UNLOCKED!');
    } else if (code === 'BROWNING') {
      const slotId = getActiveSlotId();
      if (slotId) {
        const slot = loadSaveSlot(slotId);
        slot.browningUnlocked = true;
        saveSaveSlot(slot);
      }
      setTerminalMessage('✓ ENCRYPTION OVERRIDDEN: BROWNING CHEAT SHIP UNLOCKED!');
    } else if (code === 'FREEPLAY' || code === 'UNLEASH' || code === 'RUSHDOWN') {
      localStorage.setItem('rushdown_freeplay_unlocked_global', 'true');
      if (onUnlockDeath) onUnlockDeath();
      const slotId = getActiveSlotId();
      if (slotId) {
        const slot = loadSaveSlot(slotId);
        slot.browningUnlocked = true;
        slot.deathUnlocked = true;
        slot.maxUnlockedChapter = 10;
        slot.maxUnlockedLevel = 5;
        saveSaveSlot(slot);
      }
      setTerminalMessage('✓ FULL SECTOR DECRYPTION AUTHORIZED: ALL CHAPTERS & FLEET UNLOCKED!');
    } else {
      setTerminalMessage('❌ INVALID SECURITY CODE - ACCESS DENIED');
    }
    setTerminalInput('');
    setTimeout(() => setTerminalMessage(null), 4000);
  };

  const getPerkIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'Gauge':
        return <Gauge className="w-5 h-5" />;
      case 'Skull':
        return <Skull className="w-5 h-5" />;
      case 'Magnet':
        return <Magnet className="w-5 h-5" />;
      case 'Bot':
        return <Bot className="w-5 h-5" />;
      default:
        return <ShieldAlert className="w-5 h-5" />;
    }
  };

  const currentShipInfo = SHIPS_LIST.find((s) => s.id === selectedShip) || SHIPS_LIST[0];

  return (
    <div className="w-full max-w-3xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-7 backdrop-blur-md shadow-2xl flex flex-col items-center">
      {/* HEADER */}
      <div className="text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 uppercase tracking-wider">
          PRE-GAME LOADOUT
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select your combat ship chassis and configure up to <span className="text-cyan-300 font-bold">2 passive perks</span>
        </p>
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6 w-full max-w-md">
        <button
          onClick={() => setActiveTab('SHIP')}
          className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'SHIP'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Rocket className="w-4 h-4" />
          1. SHIP SELECTION ({currentShipInfo.name.split(' ')[0]})
        </button>

        <button
          onClick={() => setActiveTab('PERKS')}
          className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'PERKS'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          2. PERKS ({selectedPerks.length}/2)
        </button>
      </div>

      {/* TAB 1: SHIP SELECTION */}
      {activeTab === 'SHIP' && (
        <div className="w-full space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {SHIPS_LIST.map((ship) => {
              const isSelected = selectedShip === ship.id;
              const isBrowning = ship.id === 'BROWNING';
              const isDeath = ship.id === 'DEATH';
              const isLocked = (isBrowning && !browningUnlocked) || (isDeath && !deathUnlocked);

              if (isLocked) {
                return (
                  <div
                    key={ship.id}
                    className="relative rounded-xl p-4 border border-purple-950/60 bg-slate-950/80 flex flex-col justify-between opacity-75 select-none"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border bg-purple-950/50 border-purple-800/60 text-purple-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> SECRET
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-400 mb-1 flex items-center gap-1">
                        ??? {isDeath ? 'Death Dreadnought' : 'Browning'}
                      </h3>
                      <p className="text-xs text-purple-300/80 italic leading-relaxed mb-4">
                        {isDeath
                          ? 'Type "DEATH" on keyboard or click "Switch Save Slot" 5x to unlock!'
                          : 'Locked secret prototype. Tap title logo 5x in a row to unlock!'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 font-mono text-[11px] text-center text-slate-500 font-bold">
                      SECRET UNLOCK REQUIRED
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={ship.id}
                  onClick={() => onSelectShip(ship.id)}
                  className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between select-none ${
                    isSelected
                      ? isDeath
                        ? 'bg-purple-950/90 border-purple-500 shadow-xl shadow-purple-500/25 ring-1 ring-purple-400'
                        : isBrowning
                        ? 'bg-rose-950/90 border-rose-500 shadow-xl shadow-rose-500/20 ring-1 ring-rose-400'
                        : 'bg-slate-800/90 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* SHIP ICON PREVIEW CANVAS / VISUAL */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border text-[10px]"
                        style={{
                          backgroundColor: `${ship.color}15`,
                          borderColor: `${ship.color}50`,
                          color: ship.color,
                        }}
                      >
                        {isBrowning ? 'CHEAT SHIP' : ship.tagline}
                      </span>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${
                          isSelected ? (isBrowning ? 'bg-rose-500 border-rose-400 text-slate-950' : 'bg-cyan-500 border-cyan-400 text-slate-950') : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 mb-1" style={{ color: isSelected ? ship.color : undefined }}>
                      {ship.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-snug mb-3 text-[11px]">{ship.description}</p>
                  </div>

                  {/* STATS BADGES */}
                  <div className="space-y-1 pt-2.5 border-t border-slate-800/80 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Max HP:</span>
                      <span className="font-bold text-emerald-400">{ship.stats.hp} HP</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Speed:</span>
                      <span className="font-bold text-cyan-300">{ship.stats.speedText}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Damage:</span>
                      <span className="font-bold text-amber-300">{ship.stats.damageText}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Shells:</span>
                      <span className="font-bold text-slate-300">{ship.stats.bulletText}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECURE DECRYPTION TERMINAL CONSOLE */}
          <form onSubmit={handleTerminalSubmit} className="mt-4 p-3 bg-slate-950/90 border border-rose-500/40 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-extrabold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                🚨 HANGAR DECRYPTION CONSOLE
              </span>
              <span className="text-[10px] font-mono text-slate-500">TRY: "DEATH", "BROWNING", "FREEPLAY"</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="ENTER SECURE DECRYPTION KEY..."
                className="flex-1 bg-slate-900 border border-slate-700 text-rose-400 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500 uppercase tracking-widest placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-black rounded-lg transition-all cursor-pointer border border-rose-400 shadow-md shadow-rose-950"
              >
                DECRYPT
              </button>
            </div>
            {terminalMessage && (
              <div className="text-[11px] font-mono font-bold text-cyan-300 animate-in fade-in duration-200">
                {terminalMessage}
              </div>
            )}
          </form>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveTab('PERKS')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
            >
              Next: Configure Perks →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PERK LOADOUT */}
      {activeTab === 'PERKS' && (
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-slate-400 font-mono">Select up to 2 perks:</span>
            <span className="text-xs font-mono text-amber-400 font-bold">{selectedPerks.length} / 2 Selected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            {PERK_LIST.map((perk) => {
              const isSelected = selectedPerks.includes(perk.id);
              const isMaxedOut = selectedPerks.length >= 2 && !isSelected;

              return (
                <div
                  key={perk.id}
                  onClick={() => onTogglePerk(perk.id)}
                  className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex items-start gap-3 select-none ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/15 ring-1 ring-cyan-400'
                      : isMaxedOut
                      ? 'bg-slate-950/60 border-slate-800/60 opacity-60 hover:opacity-80'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div
                    className="p-2 rounded-lg border shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${perk.color}15`,
                      borderColor: `${perk.color}40`,
                      color: perk.color,
                    }}
                  >
                    {getPerkIcon(perk.iconName)}
                  </div>

                  <div className="flex-1 pr-5">
                    <h3 className="font-bold text-xs text-slate-100 mb-0.5">{perk.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-snug">{perk.description}</p>
                  </div>

                  <div
                    className={`absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      isSelected
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                        : 'bg-slate-900 border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMBINED LOADOUT SUMMARY BAR */}
      <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Active Loadout:</span>
          <span className="font-bold text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-500/10">
            {currentShipInfo.name}
          </span>
          {selectedPerks.map((p) => {
            const perkObj = PERK_LIST.find((item) => item.id === p);
            return (
              <span
                key={p}
                className="font-bold border px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${perkObj?.color || '#00f3ff'}15`,
                  borderColor: `${perkObj?.color || '#00f3ff'}40`,
                  color: perkObj?.color || '#00f3ff',
                }}
              >
                {perkObj?.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* START BUTTON */}
      <button
        onClick={onStartGame}
        className="w-full sm:w-auto px-12 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg rounded-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
      >
        <Rocket className="w-5 h-5 fill-current" />
        LAUNCH MISSION
      </button>
    </div>
  );
};

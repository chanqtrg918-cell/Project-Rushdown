import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Player,
  Laser,
  Asteroid,
  Particle,
  Star,
  GameStatus,
  PowerUpType,
  PowerUpItem,
  ActivePowerUp,
  PerkType,
  ShipType,
  Boss,
  EnemyBullet,
  HomingMissile,
  Drone,
  InterceptorDrone,
  SaveSlotData,
  BasicEnemy,
  FloatingText,
  EnemyType,
} from '../types';
import { soundSystem } from '../utils/audio';
import { LoadoutSelector } from './LoadoutSelector';
import { SHIPS_LIST, PERK_LIST } from './LoadoutSelector';
import { CampaignMap, CHAPTERS_DATA, unlockNextLevel } from './CampaignMap';
import { SaveSlotSelector } from './SaveSlotSelector';
import {
  getActiveSlotId,
  setActiveSlotId,
  loadSaveSlot,
  saveSaveSlot,
} from '../utils/saveSystem';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  ShieldAlert,
  Award,
  Zap,
  Shield,
  Rocket,
  Heart,
  Bot,
  SlidersHorizontal,
  CheckCircle2,
  Swords,
  Trophy,
  MapPin,
  Clock,
  ArrowRight,
  Save,
  Sparkles,
  Lock,
} from 'lucide-react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export type ExtendedGameStatus = GameStatus | 'PERK_SELECT' | 'CAMPAIGN' | 'VICTORY' | 'SLOT_SELECT';

export const SpaceShooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Campaign level state
  const [campaignLevel, setCampaignLevel] = useState<{
    chapter: number;
    level: number;
    isBoss: boolean;
    isEndless: boolean;
  }>({
    chapter: 1,
    level: 1,
    isBoss: false,
    isEndless: false,
  });
  const campaignLevelRef = useRef(campaignLevel);
  const [survivalTimerUI, setSurvivalTimerUI] = useState<number>(60);
  const survivalTimerFramesRef = useRef<number>(3600);

  // Ship & Perks state
  const [selectedShip, setSelectedShip] = useState<ShipType>(() => {
    const saved = localStorage.getItem('space_shooter_ship');
    return (saved as ShipType) || 'STANDARD';
  });

  const [selectedPerks, setSelectedPerks] = useState<PerkType[]>(() => {
    const saved = localStorage.getItem('space_shooter_perks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['SPEEDSTER', 'MAGNET'];
      }
    }
    return ['SPEEDSTER', 'MAGNET'];
  });

  // Game state held in refs for 60FPS loop performance
  const gameStatusRef = useRef<ExtendedGameStatus>('CAMPAIGN');
  const selectedShipRef = useRef<ShipType>(selectedShip);
  const selectedPerksRef = useRef<PerkType[]>(selectedPerks);
  const startSignalRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(0);
  const asteroidsDestroyedRef = useRef<number>(0);

  // React state for UI overlays
  const [gameStatus, setGameStatus] = useState<ExtendedGameStatus>('CAMPAIGN');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [destroyedCount, setDestroyedCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundSystem.isMuted());

  // HUD dynamic states
  const [playerHpUI, setPlayerHpUI] = useState<{ hp: number; maxHp: number }>({ hp: 100, maxHp: 100 });
  const [activePowerUpsUI, setActivePowerUpsUI] = useState<ActivePowerUp[]>([]);
  const [bossInfoUI, setBossInfoUI] = useState<{ hp: number; maxHp: number; name: string } | null>(null);
  const [bossWarningUI, setBossWarningUI] = useState<boolean>(false);
  const [deadRingerTriggeredUI, setDeadRingerTriggeredUI] = useState<boolean>(false);

  // Controls state refs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchState = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  // Save Slot & Browning Secret state
  const [activeSlotId, setActiveSlotIdState] = useState<number | null>(() => getActiveSlotId());
  const [activeSlotData, setActiveSlotData] = useState<SaveSlotData | null>(null);
  const [browningUnlocked, setBrowningUnlocked] = useState<boolean>(false);
  const [deathUnlocked, setDeathUnlocked] = useState<boolean>(false);
  const [logoClickCount, setLogoClickCount] = useState<number>(0);
  const [unlockToast, setUnlockToast] = useState<boolean>(false);
  const [deathToast, setDeathToast] = useState<boolean>(false);
  const switchSlotCountRef = useRef<number>(0);

  // Lives Stock state
  const [livesUI, setLivesUI] = useState<number>(3);
  const livesRef = useRef<number>(3);

  // Browning Overdrive & Juice Engine refs
  const [browningOverdriveUI, setBrowningOverdriveUI] = useState<{ activeTimer: number; cooldown: number }>({ activeTimer: 0, cooldown: 0 });
  const browningOverdriveTimerRef = useRef<number>(0);
  const browningOverdriveCooldownRef = useRef<number>(0);

  const shakeRef = useRef<number>(0);
  const addScreenShake = useCallback((amount: number) => {
    shakeRef.current = Math.min(35, shakeRef.current + amount);
  }, []);

  const floatingTextsRef = useRef<FloatingText[]>([]);
  const addFloatingText = useCallback((x: number, y: number, text: string, color: string, scale = 1) => {
    floatingTextsRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      scale,
      lifetime: 50,
      maxLifetime: 50,
      vy: 1.2,
      alpha: 1,
    });
  }, []);

  const handleTriggerOverdrive = useCallback(() => {
    if ((selectedShipRef.current === 'BROWNING' || selectedShipRef.current === 'DEATH') && browningOverdriveCooldownRef.current === 0 && gameStatusRef.current === 'PLAYING') {
      browningOverdriveTimerRef.current = 300; // 5 seconds
      browningOverdriveCooldownRef.current = 900; // 15 seconds
      soundSystem.playPowerUpCollect();
      const color = selectedShipRef.current === 'DEATH' ? '#c084fc' : '#f43f5e';
      addFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, 'MEME BEAM OVERDRIVE!!!', color, 2.2);
      addScreenShake(20);
    }
  }, [addFloatingText, addScreenShake]);

  // Keep refs updated with state
  useEffect(() => {
    selectedShipRef.current = selectedShip;
    localStorage.setItem('space_shooter_ship', selectedShip);
    if (activeSlotId) {
      const slot = loadSaveSlot(activeSlotId);
      slot.selectedShip = selectedShip;
      saveSaveSlot(slot);
    }
  }, [selectedShip, activeSlotId]);

  useEffect(() => {
    selectedPerksRef.current = selectedPerks;
    localStorage.setItem('space_shooter_perks', JSON.stringify(selectedPerks));
    if (activeSlotId) {
      const slot = loadSaveSlot(activeSlotId);
      slot.selectedPerks = selectedPerks;
      saveSaveSlot(slot);
    }
  }, [selectedPerks, activeSlotId]);

  // Load Active Save Slot on mount - BYPASS CACHE ON STARTUP
  useEffect(() => {
    setActiveSlotId(null);
    setActiveSlotIdState(null);
    setActiveSlotData(null);
    gameStatusRef.current = 'SLOT_SELECT';
    setGameStatus('SLOT_SELECT');
  }, []);

  const unlockDeathShip = useCallback(() => {
    soundSystem.playPowerUpCollect();
    soundSystem.playNukeBlast();

    const curSlotId = activeSlotId || 1;
    setActiveSlotId(curSlotId);
    setActiveSlotIdState(curSlotId);
    const slot = loadSaveSlot(curSlotId);
    slot.deathUnlocked = true;
    saveSaveSlot(slot);
    setActiveSlotData(slot);

    setDeathUnlocked(true);
    setDeathToast(true);
    setTimeout(() => setDeathToast(false), 4500);
  }, [activeSlotId]);

  const handleSelectSlot = (slotData: SaveSlotData) => {
    setActiveSlotId(slotData.slotId);
    setActiveSlotIdState(slotData.slotId);
    setActiveSlotData(slotData);
    setHighScore(slotData.highScore);
    highScoreRef.current = slotData.highScore;
    setBrowningUnlocked(slotData.browningUnlocked);
    setDeathUnlocked(!!slotData.deathUnlocked);
    if (slotData.selectedShip) setSelectedShip(slotData.selectedShip);
    if (slotData.selectedPerks && slotData.selectedPerks.length > 0) setSelectedPerks(slotData.selectedPerks);

    gameStatusRef.current = 'CAMPAIGN';
    setGameStatus('CAMPAIGN');
  };

  const handleSwitchSlot = () => {
    switchSlotCountRef.current++;
    if (switchSlotCountRef.current >= 5) {
      unlockDeathShip();
      switchSlotCountRef.current = 0;
    }
    setActiveSlotId(null);
    setActiveSlotIdState(null);
    setActiveSlotData(null);
    gameStatusRef.current = 'SLOT_SELECT';
    setGameStatus('SLOT_SELECT');
  };

  const handleExitToMenu = () => {
    if (!activeSlotId) {
      const slot = loadSaveSlot(1);
      setActiveSlotId(1);
      setActiveSlotIdState(1);
      setActiveSlotData(slot);
      setHighScore(slot.highScore);
      highScoreRef.current = slot.highScore;
      setBrowningUnlocked(slot.browningUnlocked);
    }
    gameStatusRef.current = 'CAMPAIGN';
    setGameStatus('CAMPAIGN');
  };

  const handleTitleClick = () => {
    const nextCount = logoClickCount + 1;
    setLogoClickCount(nextCount);

    if (nextCount >= 5) {
      soundSystem.playPowerUpCollect();
      soundSystem.playNukeBlast();

      const curSlotId = activeSlotId || 1;
      setActiveSlotId(curSlotId);
      setActiveSlotIdState(curSlotId);
      const slot = loadSaveSlot(curSlotId);
      slot.browningUnlocked = true;
      saveSaveSlot(slot);
      setActiveSlotData(slot);

      setBrowningUnlocked(true);
      setUnlockToast(true);
      setTimeout(() => setUnlockToast(false), 4500);
      setLogoClickCount(0);
    } else {
      soundSystem.playLaser();
    }
  };

  const handleToggleMute = () => {
    const muted = soundSystem.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePerk = (perkId: PerkType) => {
    setSelectedPerks((prev) => {
      if (prev.includes(perkId)) {
        return prev.filter((p) => p !== perkId);
      }
      if (prev.length >= 2) {
        return [prev[1], perkId];
      }
      return [...prev, perkId];
    });
  };

  const handleSelectLevel = (chapter: number, level: number) => {
    const isBoss = level === 5;
    const newLvl = { chapter, level, isBoss, isEndless: false };
    setCampaignLevel(newLvl);
    campaignLevelRef.current = newLvl;
    gameStatusRef.current = 'PERK_SELECT';
    setGameStatus('PERK_SELECT');
  };

  const handlePlayEndless = () => {
    const newLvl = { chapter: 1, level: 1, isBoss: false, isEndless: true };
    setCampaignLevel(newLvl);
    campaignLevelRef.current = newLvl;
    gameStatusRef.current = 'PERK_SELECT';
    setGameStatus('PERK_SELECT');
  };

  const handleNextLevel = () => {
    let nextCh = campaignLevel.chapter;
    let nextLvl = campaignLevel.level + 1;
    if (nextLvl > 5) {
      nextCh = Math.min(5, campaignLevel.chapter + 1);
      nextLvl = 1;
    }
    handleSelectLevel(nextCh, nextLvl);
  };

  const handleReturnToMap = () => {
    gameStatusRef.current = 'CAMPAIGN';
    setGameStatus('CAMPAIGN');
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyE', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }

      keysPressed.current[e.code] = true;

      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        handleTriggerOverdrive();
      }

      if ((gameStatusRef.current === 'GAMEOVER' || gameStatusRef.current === 'VICTORY') && (e.code === 'Space' || e.code === 'Enter')) {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start / Reset Game
  const startGame = useCallback(() => {
    scoreRef.current = 0;
    asteroidsDestroyedRef.current = 0;
    setScore(0);
    setDestroyedCount(0);
    setActivePowerUpsUI([]);
    setBossInfoUI(null);
    setBossWarningUI(false);
    setDeadRingerTriggeredUI(false);

    // Set survival timer
    if (campaignLevelRef.current.isBoss) {
      survivalTimerFramesRef.current = 0;
    } else if (!campaignLevelRef.current.isEndless) {
      survivalTimerFramesRef.current = 3600; // 60 seconds
      setSurvivalTimerUI(60);
    } else {
      survivalTimerFramesRef.current = -1;
    }

    // Trigger start signal to re-calculate ship stats, reset HP, and recreate entities
    startSignalRef.current += 1;

    gameStatusRef.current = 'PLAYING';
    setGameStatus('PLAYING');
  }, []);

  // Main Canvas Loop Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Entity collections
    let stars: Star[] = [];
    let lastAppliedStartSignal = -1;

    let player: Player = {
      x: CANVAS_WIDTH / 2,
      y: 540,
      width: 34,
      height: 38,
      shipType: 'STANDARD',
      hp: 100,
      maxHp: 100,
      speed: 7,
      cooldown: 0,
      baseCooldown: 11,
      bulletScale: 1.0,
      damageMultiplier: 1.0,
      hasShield: false,
      shieldDuration: 0,
      deadRingerUsed: false,
      invincibleFrames: 0,
      lastDamageFrame: -120,
    };

    let drone: Drone | null = null;
    let interceptorDrones: InterceptorDrone[] = [];
    let lasers: Laser[] = [];
    let homingMissiles: HomingMissile[] = [];
    let asteroids: Asteroid[] = [];
    let basicEnemies: BasicEnemy[] = [];
    let enemyBullets: EnemyBullet[] = [];
    let powerUpItems: PowerUpItem[] = [];
    let particles: Particle[] = [];
    let floatingTexts: FloatingText[] = [];
    let activePowerUps: { type: PowerUpType; duration: number; maxDuration: number }[] = [];

    let boss: Boss | null = null;
    let nextBossScoreTarget = 300;
    let nukeFlashFrames = 0;
    let nextEntityId = 1;
    let frameCounter = 0;

    let spawnTimer = 0;
    let spawnInterval = 70;
    let missileTimer = 0;
    let prevWingmenActive = false;
    let animationFrameId: number;

    // Helper to dynamically calculate stats & reset player/entities on start/restart
    const initOrResetPlayerAndEntities = () => {
      const currentShipType = selectedShipRef.current;
      const equippedPerks = selectedPerksRef.current;

      const hasGlassCannon = equippedPerks.includes('GLASS_CANNON');
      const hasSpeedster = equippedPerks.includes('SPEEDSTER');
      const hasExtraTurret = equippedPerks.includes('EXTRA_TURRET');

      // Base Ship HP
      let baseMaxHp =
        currentShipType === 'DEATH'
          ? 300
          : currentShipType === 'TEXAN' || currentShipType === 'FOEHAMMER' || currentShipType === 'MARTIN'
          ? 150
          : currentShipType === 'BROWNING'
          ? 125
          : currentShipType === 'AKIRA'
          ? 60
          : 100;
      if (hasGlassCannon) {
        baseMaxHp = Math.max(25, Math.floor(baseMaxHp * 0.5));
      }

      // Base Speed
      let baseSpeed =
        currentShipType === 'DEATH'
          ? 4.55
          : currentShipType === 'TEXAN' || currentShipType === 'MARTIN'
          ? 5.25
          : currentShipType === 'AKIRA'
          ? 9.1
          : currentShipType === 'FOEHAMMER'
          ? 5.6
          : 7;
      if (hasSpeedster) {
        baseSpeed *= 1.5;
      }

      // Base Damage
      let damageMult =
        currentShipType === 'TEXAN' || currentShipType === 'MARTIN'
          ? 1.5
          : currentShipType === 'AKIRA'
          ? 1.5
          : currentShipType === 'FOEHAMMER'
          ? 5.0
          : currentShipType === 'BROWNING'
          ? 1.0
          : 1.0;
      if (hasGlassCannon) {
        damageMult *= 2.0;
      }

      const bulletScale =
        currentShipType === 'TEXAN' ? 1.5 : currentShipType === 'FOEHAMMER' ? 1.8 : currentShipType === 'BROWNING' ? 1.4 : currentShipType === 'MARTIN' ? 1.2 : 1.0;
      const baseCooldown =
        currentShipType === 'TEXAN' ? 14 : currentShipType === 'AKIRA' ? 10 : currentShipType === 'FOEHAMMER' ? 72 : currentShipType === 'BROWNING' ? 0 : currentShipType === 'MARTIN' ? 60 : 11;

      // Campaign Life Stock Calculation
      const hasDeadRinger = equippedPerks.includes('DEAD_RINGER');
      let initialLives = 3;
      if (currentShipType === 'BROWNING') {
        initialLives = hasDeadRinger ? 5 : 4;
      } else if (hasDeadRinger) {
        initialLives = 4;
      } else {
        initialLives = 3;
      }
      livesRef.current = initialLives;
      setLivesUI(initialLives);

      // Re-instantiate player with fresh HP and dynamically calculated stats
      player = {
        x: CANVAS_WIDTH / 2,
        y: 540,
        width:
          currentShipType === 'DEATH'
            ? 54
            : currentShipType === 'TEXAN' || currentShipType === 'MARTIN'
            ? 42
            : currentShipType === 'AKIRA'
            ? 28
            : currentShipType === 'FOEHAMMER'
            ? 40
            : currentShipType === 'BROWNING'
            ? 38
            : 34,
        height:
          currentShipType === 'DEATH'
            ? 54
            : currentShipType === 'TEXAN' || currentShipType === 'MARTIN'
            ? 42
            : currentShipType === 'AKIRA'
            ? 40
            : currentShipType === 'FOEHAMMER'
            ? 44
            : currentShipType === 'BROWNING'
            ? 42
            : 38,
        shipType: currentShipType,
        hp: baseMaxHp,
        maxHp: baseMaxHp,
        speed: baseSpeed,
        cooldown: 0,
        baseCooldown,
        bulletScale,
        damageMultiplier: damageMult,
        hasShield: false,
        shieldDuration: 0,
        deadRingerUsed: false,
        invincibleFrames: 0,
        lastDamageFrame: -120,
        deathShieldCharges: currentShipType === 'DEATH' ? 3 : 0,
        deathShieldRegenTimer: 0,
        forgeTimer: 0,
      };

      prevWingmenActive = false;

      // Sync React state for HUD health bar immediately
      setPlayerHpUI({ hp: baseMaxHp, maxHp: baseMaxHp });

      // Re-instantiate drone companion if perk is active
      drone = hasExtraTurret
        ? {
            x: player.x + 36,
            y: player.y - 8,
            shootTimer: 0,
            angle: -Math.PI / 2,
          }
        : null;

      // Reset entity collections & game state counters
      lasers = [];
      homingMissiles = [];
      asteroids = [];
      basicEnemies = [];
      enemyBullets = [];
      powerUpItems = [];
      particles = [];
      floatingTexts = [];
      activePowerUps = [];
      nextBossScoreTarget = 300;
      spawnTimer = 0;
      missileTimer = 0;

      // Check if current level is a Boss Level
      if (campaignLevelRef.current.isBoss) {
        const curCh = campaignLevelRef.current.chapter;
        const isSwarmBoss = curCh === 1;
        const isLaserMatrixBoss = curCh === 2;
        const isTrackerBoss = curCh === 3;
        const isSplitterBoss = curCh === 4;
        const isRushdownPrime = curCh === 5;
        const isCorruptedBrowning = curCh === 6;
        const isPlutoBoss = curCh === 7;
        const isAlsaceBoss = curCh === 8;
        const isOmegaOverlord = curCh === 9;
        const isRushdownApex = curCh === 10;

        let bossWidth = 150;
        let bossHeight = 90;
        let bossVx = 2.2;
        let bossHp = 800;
        let bossColor = '#10b981';
        let bossName = 'THE SWARM - CHAPTER 1 BOSS';

        if (isSwarmBoss) {
          bossWidth = 160; bossHeight = 100; bossHp = 800; bossColor = '#10b981'; bossName = 'THE SWARM - CHAPTER 1 BOSS';
        } else if (isLaserMatrixBoss) {
          bossWidth = 180; bossHeight = 110; bossHp = 1600; bossColor = '#f43f5e'; bossName = 'THE LASER MATRIX - CHAPTER 2 BOSS';
        } else if (isTrackerBoss) {
          bossWidth = 150; bossHeight = 90; bossVx = 3.5; bossHp = 2400; bossColor = '#06b6d4'; bossName = 'THE TRACKER - CHAPTER 3 BOSS';
        } else if (isSplitterBoss) {
          bossWidth = 170; bossHeight = 100; bossHp = 3200; bossColor = '#f97316'; bossName = 'THE SPLITTER - CHAPTER 4 BOSS';
        } else if (isRushdownPrime) {
          bossWidth = 200; bossHeight = 120; bossHp = 4800; bossColor = '#eab308'; bossName = 'RUSHDOWN PRIME - CHAPTER 5 FINAL BOSS';
        } else if (isCorruptedBrowning) {
          bossWidth = 150; bossHeight = 90; bossVx = 5.5; bossHp = 6000; bossColor = '#c084fc'; bossName = 'THE HIDDEN ONE - CORRUPTED BROWNING';
        } else if (isPlutoBoss) {
          bossWidth = 280; bossHeight = 140; bossVx = 1.5; bossHp = 8000; bossColor = '#e11d48'; bossName = 'PLUTO - HADES OF THE DARK [TITAN BATTLESHIP]';
        } else if (isAlsaceBoss) {
          bossWidth = 260; bossHeight = 130; bossVx = 1.8; bossHp = 10000; bossColor = '#e2e8f0'; bossName = 'ALSACE - HEAVY BATTLECRUISER [CHAPTER 8]';
        } else if (isOmegaOverlord) {
          bossWidth = 220; bossHeight = 120; bossVx = 2.5; bossHp = 12500; bossColor = '#3b82f6'; bossName = 'OMEGA OVERLORD - SINGULARITY VOID [CHAPTER 9]';
        } else if (isRushdownApex) {
          bossWidth = 300; bossHeight = 150; bossVx = 2.0; bossHp = 16000; bossColor = '#f43f5e'; bossName = 'RUSHDOWN APEX - COMMANDER OF ALL VOIDS [CHAPTER 10]';
        }

        boss = {
          x: CANVAS_WIDTH / 2,
          y: -100,
          width: bossWidth,
          height: bossHeight,
          vx: bossVx,
          hp: bossHp,
          maxHp: bossHp,
          shootTimer: 0,
          color: bossColor,
          name: bossName,
          isSwarmBoss,
          isLaserMatrix: isLaserMatrixBoss,
          isTrackerBoss,
          isSplitterBoss,
          isRushdownPrime,
          isCorruptedBrowning,
          isPlutoBoss,
          isAlsaceBoss,
          isOmegaOverlord,
          isRushdownApex,
          plutoPhase: 1,
          plutoLaserAngle: 0,
          hasTriggeredDeadRinger: false,
          deadRingerInvincibleFrames: 0,
          swarmAngle: 0,
          spiralAngle: 0,
          matrixState: 'IDLE',
          matrixTimer: 0,
          gridRows: [150, 280, 420],
          gridCols: [180, 360, 540],
        };
        setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
        setBossWarningUI(true);
        setTimeout(() => setBossWarningUI(false), 3000);
      } else {
        boss = null;
        setBossInfoUI(null);
        setBossWarningUI(false);
      }
      setDeadRingerTriggeredUI(false);
    };

    // Starfield initialization
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }

    // Explosion Particles Helper
    const createExplosion = (x: number, y: number, color: string, count = 25, isSquare = true) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 6 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
          isSquare,
        });
      }
    };

    // Thruster Trail Helper
    const createThrusterParticles = () => {
      const trailColor = player.shipType === 'TEXAN' ? '#f59e0b' : player.shipType === 'AKIRA' ? '#ec4899' : '#00f3ff';
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: player.x + (Math.random() * 8 - 4),
          y: player.y + player.height / 2,
          vx: Math.random() * 1.5 - 0.75,
          vy: Math.random() * 3 + 2,
          size: Math.random() * 4 + 2,
          color: Math.random() > 0.4 ? trailColor : '#ff7700',
          alpha: 1,
          decay: 0.08,
          isSquare: false,
        });
      }
    };

    // Power-Up Drop
    const dropPowerUp = (x: number, y: number, forceNuke = false) => {
      let type: PowerUpType;
      if (forceNuke || (boss && Math.random() < 0.6)) {
        type = 'NUKE';
      } else {
        const types: PowerUpType[] = ['SHIELD', 'SHOTGUN', 'HOMING_MISSILES', 'WINGMEN'];
        type = types[Math.floor(Math.random() * types.length)];
      }

      let color = '#00f3ff';
      let label = 'S';
      if (type === 'SHOTGUN') {
        color = '#ff6b00';
        label = '3';
      } else if (type === 'HOMING_MISSILES') {
        color = '#a855f7';
        label = 'M';
      } else if (type === 'NUKE') {
        color = '#eab308';
        label = '☢';
      } else if (type === 'WINGMEN') {
        color = '#38bdf8';
        label = 'W';
      }

      powerUpItems.push({
        x,
        y,
        width: 26,
        height: 26,
        type,
        vy: 1.8,
        rotation: 0,
        color,
        label,
      });
    };

    // Spawn Basic Enemy Craft (Gunners, Missiles, Kamikazes)
    const spawnBasicEnemy = () => {
      const types: EnemyType[] = ['GUNNER', 'MISSILE', 'KAMIKAZE'];
      const type = types[Math.floor(Math.random() * types.length)];
      const id = nextEntityId++;
      const x = Math.random() * (CANVAS_WIDTH - 80) + 40;

      if (type === 'GUNNER') {
        basicEnemies.push({
          id,
          type: 'GUNNER',
          x,
          y: -40,
          width: 36,
          height: 36,
          hp: 4,
          maxHp: 4,
          vx: (Math.random() - 0.5) * 2,
          vy: 1.6,
          color: '#f59e0b',
          shootTimer: Math.floor(Math.random() * 30),
        });
      } else if (type === 'MISSILE') {
        basicEnemies.push({
          id,
          type: 'MISSILE',
          x,
          y: -40,
          width: 40,
          height: 40,
          hp: 5,
          maxHp: 5,
          vx: 0,
          vy: 1.0,
          color: '#a855f7',
          shootTimer: 0,
          missileTimer: Math.floor(Math.random() * 40),
        });
      } else if (type === 'KAMIKAZE') {
        basicEnemies.push({
          id,
          type: 'KAMIKAZE',
          x,
          y: -40,
          width: 32,
          height: 32,
          hp: 3,
          maxHp: 3,
          vx: 0,
          vy: 4.5,
          color: '#ef4444',
          shootTimer: 0,
        });
      }
    };

    // Spawn Square Asteroid
    const spawnAsteroid = () => {
      const sizeVariants = [28, 40, 52];
      const size = sizeVariants[Math.floor(Math.random() * sizeVariants.length)];
      const baseSpeed = Math.min(2 + Math.floor(scoreRef.current / 150) * 0.5, 6);
      const vy = Math.random() * 1.8 + baseSpeed;
      const colorPalette = ['#a1a8b8', '#8a94a6', '#d97706', '#0284c7', '#9333ea', '#475569'];
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const hp = size === 28 ? 1 : size === 40 ? 2 : 3;

      asteroids.push({
        id: nextEntityId++,
        x: Math.random() * (CANVAS_WIDTH - size - 40) + 20 + size / 2,
        y: -size,
        width: size,
        height: size,
        size,
        vy,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        hp,
        maxHp: hp,
        color,
      });
    };

    // Spawn Boss Encounter
    const spawnBoss = () => {
      setBossWarningUI(true);
      setTimeout(() => setBossWarningUI(false), 2200);

      const bossHp = 320 + Math.floor(scoreRef.current / 100) * 80;
      boss = {
        x: CANVAS_WIDTH / 2,
        y: -100,
        width: 140,
        height: 90,
        vx: 3,
        hp: bossHp,
        maxHp: bossHp,
        shootTimer: 0,
        color: '#dc2626',
        name: `MOTHERSHIP V-${Math.floor(scoreRef.current / 300) + 1}`,
      };

      setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
    };

    // Trigger Nuke Blast
    const triggerNuke = () => {
      nukeFlashFrames = 18;
      soundSystem.playNukeBlast();

      enemyBullets = [];

      asteroids.forEach((ast) => {
        createExplosion(ast.x, ast.y, ast.color, 20, true);
        scoreRef.current += 15;
        asteroidsDestroyedRef.current += 1;
      });
      asteroids = [];

      basicEnemies.forEach((e) => {
        createExplosion(e.x, e.y, e.color, 22, true);
        scoreRef.current += 20;
        asteroidsDestroyedRef.current += 1;
      });
      basicEnemies = [];

      if (boss) {
        if (!boss.deadRingerInvincibleFrames || boss.deadRingerInvincibleFrames <= 0) {
          boss.hp -= 250;
        }
        createExplosion(boss.x, boss.y, '#eab308', 50, false);
        createExplosion(boss.x, boss.y, '#ef4444', 40, true);

        if (boss.hp <= 0) {
          if (boss.isCorruptedBrowning && !boss.hasTriggeredDeadRinger) {
            boss.hasTriggeredDeadRinger = true;
            boss.hp = boss.maxHp * 0.5;
            boss.deadRingerInvincibleFrames = 180;
            nukeFlashFrames = 25;
            floatingTexts.push({
              id: nextEntityId++,
              x: boss.x,
              y: boss.y - 30,
              text: 'OVERDRIVE!',
              color: '#e879f9',
              scale: 1.8,
              alpha: 1.0,
              vy: -1.0,
              lifetime: 120,
            });
            soundSystem.playPowerUpCollect();
            soundSystem.playExplosion(true);
            boss.name = 'THE HIDDEN ONE [OVERDRIVE]';
            setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
            addScreenShake(10);
          } else {
            soundSystem.playExplosion(true);
            createExplosion(boss.x, boss.y, '#00f3ff', 80, true);
            scoreRef.current += 300;
            setScore(scoreRef.current);
            nextBossScoreTarget = scoreRef.current + 400;
            boss = null;
            setBossInfoUI(null);
          }
        } else {
          setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
        }
      }

      setScore(scoreRef.current);
      setDestroyedCount(asteroidsDestroyedRef.current);
    };

    // Handle Player Hit Damage
    const handlePlayerHit = (damageAmount = 35) => {
      if (player.invincibleFrames > 0) return;

      player.lastDamageFrame = frameCounter;

      if (player.shipType === 'DEATH' && player.deathShieldCharges && player.deathShieldCharges > 0) {
        player.deathShieldCharges--;
        player.invincibleFrames = 30;
        soundSystem.playPowerUpCollect();
        createExplosion(player.x, player.y, '#c084fc', 25, false);
        floatingTexts.push({
          id: nextEntityId++,
          x: player.x,
          y: player.y - 30,
          text: 'VOID SHIELD BLOCKED!',
          color: '#c084fc',
          scale: 1.5,
          alpha: 1.0,
          vy: -1.0,
          lifetime: 50,
        });
        addScreenShake(6);
        return;
      }

      if (player.hasShield) {
        const shieldIdx = activePowerUps.findIndex((p) => p.type === 'SHIELD');
        if (shieldIdx !== -1) activePowerUps.splice(shieldIdx, 1);
        player.hasShield = false;
        player.invincibleFrames = 35;
        createExplosion(player.x, player.y, '#00f3ff', 25, false);
        return;
      }

      player.hp -= damageAmount;
      setPlayerHpUI({ hp: Math.max(0, player.hp), maxHp: player.maxHp });
      createExplosion(player.x, player.y, '#ef4444', 15, false);

      if (player.hp <= 0) {
        if (livesRef.current > 1) {
          livesRef.current -= 1;
          setLivesUI(livesRef.current);
          player.hp = player.maxHp;
          setPlayerHpUI({ hp: player.hp, maxHp: player.maxHp });
          player.invincibleFrames = 120; // 2 seconds flashing invincibility
          soundSystem.playPowerUpCollect();
          createExplosion(player.x, player.y, '#38bdf8', 35, false);
          createExplosion(player.x, player.y, '#ef4444', 25, true);
          setDeadRingerTriggeredUI(true);
          setTimeout(() => setDeadRingerTriggeredUI(false), 2200);
        } else {
          livesRef.current = 0;
          setLivesUI(0);
          soundSystem.playGameOver();
          soundSystem.playExplosion(true);
          createExplosion(player.x, player.y, '#00f3ff', 40, false);
          createExplosion(player.x, player.y, '#ff4400', 35, true);

          gameStatusRef.current = 'GAMEOVER';
          setGameStatus('GAMEOVER');
        }
      } else {
        player.invincibleFrames = 25;
      }
    };

    // Main Loop
    const render = () => {
      frameCounter++;

      // Check if a game start/reset signal was triggered
      if (lastAppliedStartSignal !== startSignalRef.current) {
        lastAppliedStartSignal = startSignalRef.current;
        initOrResetPlayerAndEntities();
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // --- 1. DRAW BACKGROUND & STARFIELD ---
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ffffff';
      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      const currentStatus = gameStatusRef.current;
      const isWingmenActive = boss !== null || activePowerUps.some((p) => p.type === 'WINGMEN');

      if (currentStatus === 'PLAYING') {
        // --- 2. PLAYER MOVEMENT & INPUT ---
        const moveLeft = keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'] || touchState.current.left;
        const moveRight = keysPressed.current['ArrowRight'] || keysPressed.current['KeyD'] || touchState.current.right;
        const shootKey = keysPressed.current['Space'] || touchState.current.shoot;

        if (moveLeft) player.x -= player.speed;
        if (moveRight) player.x += player.speed;

        player.x = Math.max(player.width / 2 + 10, Math.min(CANVAS_WIDTH - player.width / 2 - 10, player.x));

        createThrusterParticles();

        if (player.invincibleFrames > 0) player.invincibleFrames--;

        // --- PASSIVE HEALTH REGENERATION BY SHIP CLASS ---
        if (frameCounter - player.lastDamageFrame >= 120 && player.hp < player.maxHp) {
          let regenRate = 0.02; // Standard: 2% max HP per sec
          if (player.shipType === 'AKIRA' || player.shipType === 'BROWNING') {
            regenRate = 0.04; // Akira & Browning: 4% max HP per sec
          } else if (player.shipType === 'MARTIN') {
            regenRate = 0.015; // Martin: 1.5% max HP per sec
          } else if (player.shipType === 'TEXAN') {
            regenRate = 0.005; // Texan: 0.5% max HP per sec
          } else if (player.shipType === 'FOEHAMMER') {
            regenRate = 0.01; // Foehammer: 1.0% max HP per sec
          }

          const hpRegenPerFrame = (player.maxHp * regenRate) / 60;
          player.hp = Math.min(player.maxHp, player.hp + hpRegenPerFrame);
          setPlayerHpUI({ hp: Math.round(player.hp), maxHp: player.maxHp });
        }

        // --- BROWNING / DEATH OVERDRIVE UPDATES ---
        if (browningOverdriveTimerRef.current > 0) {
          browningOverdriveTimerRef.current--;
          if (frameCounter % 3 === 0) {
            const beamCount = player.shipType === 'DEATH' ? 12 : 9;
            const beamColor = player.shipType === 'DEATH' ? '#c084fc' : '#f43f5e';
            for (let a = 0; a < beamCount; a++) {
              const angle = (a * Math.PI * 2) / beamCount + (frameCounter * 0.08);
              const speed = 18;
              lasers.push({
                x: player.x,
                y: player.y,
                width: 10,
                height: 32,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: beamColor,
                damage: 35 * player.damageMultiplier,
                isPiercing: true,
                hitEnemyIds: new Set<number>(),
              });
            }
            addScreenShake(4);
          }
        }
        if (browningOverdriveCooldownRef.current > 0) {
          browningOverdriveCooldownRef.current--;
        }
        if (frameCounter % 6 === 0) {
          setBrowningOverdriveUI({
            activeTimer: browningOverdriveTimerRef.current,
            cooldown: browningOverdriveCooldownRef.current,
          });
        }

        // Active Power-ups countdown
        for (let i = activePowerUps.length - 1; i >= 0; i--) {
          activePowerUps[i].duration -= 1;
          if (activePowerUps[i].duration <= 0) {
            activePowerUps.splice(i, 1);
          }
        }

        setActivePowerUpsUI(
          activePowerUps.map((p) => ({
            type: p.type,
            remainingTime: Number((p.duration / 60).toFixed(1)),
            maxTime: p.maxDuration ? p.maxDuration / 60 : 8,
          }))
        );

        const isShotgunActive = activePowerUps.some((p) => p.type === 'SHOTGUN');
        const isHomingActive = activePowerUps.some((p) => p.type === 'HOMING_MISSILES');
        const isShieldActive = activePowerUps.some((p) => p.type === 'SHIELD');

        player.hasShield = isShieldActive;

        // --- WINGMEN FIGHTERS LOGIC ---
        if (isWingmenActive && !prevWingmenActive) {
          soundSystem.playPowerUpCollect();
          createExplosion(player.x - 38, player.y + 12, '#38bdf8', 20, false);
          createExplosion(player.x + 38, player.y + 12, '#38bdf8', 20, false);
        }
        prevWingmenActive = isWingmenActive;

        if (isWingmenActive) {
          if (Math.random() < 0.6) {
            particles.push({
              x: player.x - 38 + (Math.random() * 4 - 2),
              y: player.y + 22,
              vx: Math.random() * 0.8 - 0.4,
              vy: Math.random() * 2 + 1.5,
              size: Math.random() * 2.5 + 1,
              color: '#38bdf8',
              alpha: 0.8,
              decay: 0.06,
              isSquare: false,
            });
            particles.push({
              x: player.x + 38 + (Math.random() * 4 - 2),
              y: player.y + 22,
              vx: Math.random() * 0.8 - 0.4,
              vy: Math.random() * 2 + 1.5,
              size: Math.random() * 2.5 + 1,
              color: '#38bdf8',
              alpha: 0.8,
              decay: 0.06,
              isSquare: false,
            });
          }

          const shouldWingmenShoot =
            (shootKey && player.cooldown === 0) ||
            (frameCounter % 20 === 0 && (boss !== null || asteroids.length > 0));

          if (shouldWingmenShoot) {
            lasers.push({
              x: player.x - 38,
              y: player.y + 2,
              width: 4,
              height: 14,
              vx: 0,
              vy: -13,
              color: '#38bdf8',
              damage: 8 * player.damageMultiplier,
            });
            lasers.push({
              x: player.x + 38,
              y: player.y + 2,
              width: 4,
              height: 14,
              vx: 0,
              vy: -13,
              color: '#38bdf8',
              damage: 8 * player.damageMultiplier,
            });
          }
        }

        // Laser Shooting
        if (player.cooldown > 0) player.cooldown--;

        const w = 5 * player.bulletScale;
        const h = 18 * player.bulletScale;
        const laserColor =
          player.shipType === 'TEXAN'
            ? '#f59e0b'
            : player.shipType === 'AKIRA'
            ? '#ec4899'
            : player.shipType === 'FOEHAMMER'
            ? '#a855f7'
            : player.shipType === 'BROWNING'
            ? '#f43f5e'
            : '#00f3ff';

        if (shootKey && player.cooldown === 0) {
          if (isShotgunActive) {
            lasers.push({ x: player.x, y: player.y - player.height / 2, width: w + 1, height: h - 2, vx: 0, vy: -13, color: '#ff6b00', damage: player.damageMultiplier });
            lasers.push({ x: player.x - 12, y: player.y - player.height / 3, width: w, height: h - 3, vx: -3.5, vy: -12, color: '#ff6b00', damage: player.damageMultiplier });
            lasers.push({ x: player.x + 12, y: player.y - player.height / 3, width: w, height: h - 3, vx: 3.5, vy: -12, color: '#ff6b00', damage: player.damageMultiplier });
          } else if (player.shipType === 'DEATH') {
            // 24-GUN USS MONTANA SALVO ARRAY (12 Upward Lasers, 12 Downward Lasers)
            for (let g = -5.5; g <= 5.5; g += 1) {
              const lx = player.x + g * 9;
              // 12 Upward Lasers
              lasers.push({
                x: lx,
                y: player.y - player.height / 2 - 10,
                width: 4,
                height: 18,
                vx: 0,
                vy: -15,
                color: '#c084fc',
                damage: 12 * player.damageMultiplier,
              });
              // 12 Downward Lasers
              lasers.push({
                x: lx,
                y: player.y + player.height / 2 + 10,
                width: 4,
                height: 18,
                vx: 0,
                vy: 15,
                color: '#e879f9',
                damage: 12 * player.damageMultiplier,
              });
            }
            // 2 CIWS Tracking Micro Beams
            lasers.push({
              x: player.x - 24,
              y: player.y,
              width: 3,
              height: 14,
              vx: -3,
              vy: -10,
              color: '#eab308',
              damage: 10 * player.damageMultiplier,
            });
            lasers.push({
              x: player.x + 24,
              y: player.y,
              width: 3,
              height: 14,
              vx: 3,
              vy: -10,
              color: '#eab308',
              damage: 10 * player.damageMultiplier,
            });
            soundSystem.playLaser();
          } else if (player.shipType === 'BROWNING') {
            lasers.push({
              x: player.x,
              y: player.y - player.height / 2,
              width: 10,
              height: 36,
              vx: 0,
              vy: -18,
              color: '#f43f5e',
              damage: 25 * player.damageMultiplier,
              isPiercing: true,
              hitEnemyIds: new Set<number>(),
            });
            lasers.push({
              x: player.x - 14,
              y: player.y - player.height / 3,
              width: 9,
              height: 32,
              vx: -3.8,
              vy: -17,
              color: '#f43f5e',
              damage: 22 * player.damageMultiplier,
              isPiercing: true,
              hitEnemyIds: new Set<number>(),
            });
            lasers.push({
              x: player.x + 14,
              y: player.y - player.height / 3,
              width: 9,
              height: 32,
              vx: 3.8,
              vy: -17,
              color: '#f43f5e',
              damage: 22 * player.damageMultiplier,
              isPiercing: true,
              hitEnemyIds: new Set<number>(),
            });
          } else if (player.shipType === 'FOEHAMMER') {
            lasers.push({
              x: player.x,
              y: player.y - player.height / 2,
              width: 10,
              height: 36,
              vx: 0,
              vy: -18,
              color: '#a855f7',
              damage: 35 * player.damageMultiplier,
              isPiercing: true,
              hitEnemyIds: new Set<number>(),
            });
            soundSystem.playLaser();
          } else if (player.shipType === 'MARTIN') {
            const offsets = [-20, -8, 8, 20];
            for (let i = 0; i < 4; i++) {
              homingMissiles.push({
                x: player.x + offsets[i],
                y: player.y - player.height / 2,
                vx: (i - 1.5) * 1.8,
                vy: -8,
                color: '#10b981',
                damage: 22 * player.damageMultiplier,
              });
            }
            soundSystem.playMissile();
          } else {
            lasers.push({ x: player.x, y: player.y - player.height / 2, width: w, height: h, vx: 0, vy: -13, color: laserColor, damage: player.damageMultiplier });
            soundSystem.playLaser();
          }
          player.cooldown = player.shipType === 'DEATH' ? 3 : player.shipType === 'BROWNING' ? 2 : player.shipType === 'MARTIN' ? 60 : isShotgunActive ? player.baseCooldown + 2 : player.baseCooldown;
        }

        // Homing Missiles
        if (isHomingActive) {
          missileTimer++;
          if (missileTimer >= 22) {
            soundSystem.playMissile();
            homingMissiles.push({ x: player.x - 16, y: player.y, vx: -2, vy: -6, color: '#a855f7', damage: 25 * player.damageMultiplier });
            homingMissiles.push({ x: player.x + 16, y: player.y, vx: 2, vy: -6, color: '#a855f7', damage: 25 * player.damageMultiplier });
            missileTimer = 0;
          }
        }

        // DEATH DREADNOUGHT PASSIVE HEALTH REGEN & BATTLESTAR FORGE LOGIC
        if (player.shipType === 'DEATH') {
          // 2% passive HP regen per second
          player.hp = Math.min(player.maxHp, player.hp + (player.maxHp * 0.02) / 60);
          setPlayerHpUI({ hp: Math.round(player.hp), maxHp: player.maxHp });

          // Shield charge regeneration (1 charge every 10 seconds / 600 frames)
          if ((player.deathShieldCharges ?? 3) < 3) {
            player.deathShieldRegenTimer = (player.deathShieldRegenTimer || 0) + 1;
            if (player.deathShieldRegenTimer >= 600) {
              player.deathShieldCharges = Math.min(3, (player.deathShieldCharges ?? 0) + 1);
              player.deathShieldRegenTimer = 0;
              floatingTexts.push({
                id: nextEntityId++,
                x: player.x,
                y: player.y - 35,
                text: 'VOID SHIELD RECHARGED!',
                color: '#c084fc',
                scale: 1.2,
                alpha: 1.0,
                vy: -1.0,
                lifetime: 60,
              });
            }
          }

          // Battlestar Forge: Every 4 seconds (240 frames), spawns 2 automated Interceptor Drones
          player.forgeTimer = (player.forgeTimer || 0) + 1;
          if (player.forgeTimer >= 240) {
            player.forgeTimer = 0;
            interceptorDrones.push({
              id: nextEntityId++,
              x: player.x - 35,
              y: player.y,
              vx: -3,
              vy: -2,
              shootTimer: 0,
              lifetime: 480,
              maxLifetime: 480,
            });
            interceptorDrones.push({
              id: nextEntityId++,
              x: player.x + 35,
              y: player.y,
              vx: 3,
              vy: -2,
              shootTimer: 0,
              lifetime: 480,
              maxLifetime: 480,
            });
            soundSystem.playPowerUpCollect();
            floatingTexts.push({
              id: nextEntityId++,
              x: player.x,
              y: player.y - 45,
              text: 'INTERCEPTORS LAUNCHED!',
              color: '#e879f9',
              scale: 1.3,
              alpha: 1.0,
              vy: -1.0,
              lifetime: 60,
            });
          }
        }

        // UPDATE & DRAW BATTLESTAR INTERCEPTOR DRONES
        for (let dIdx = interceptorDrones.length - 1; dIdx >= 0; dIdx--) {
          const droneObj = interceptorDrones[dIdx];
          droneObj.lifetime--;

          if (droneObj.lifetime <= 0) {
            createExplosion(droneObj.x, droneObj.y, '#e879f9', 15, false);
            interceptorDrones.splice(dIdx, 1);
            continue;
          }

          // Hunt down Gunners, Missiles, or Boss
          let targetX: number | null = null;
          let targetY: number | null = null;

          if (boss) {
            targetX = boss.x;
            targetY = boss.y;
          } else if (basicEnemies.length > 0) {
            let minDist = Infinity;
            basicEnemies.forEach((e) => {
              const dist = Math.hypot(e.x - droneObj.x, e.y - droneObj.y);
              if (dist < minDist) {
                minDist = dist;
                targetX = e.x;
                targetY = e.y;
              }
            });
          }

          if (targetX !== null && targetY !== null) {
            const angle = Math.atan2(targetY - droneObj.y, targetX - droneObj.x);
            droneObj.vx += Math.cos(angle) * 0.4;
            droneObj.vy += Math.sin(angle) * 0.4;
            const spd = Math.hypot(droneObj.vx, droneObj.vy);
            if (spd > 7) {
              droneObj.vx = (droneObj.vx / spd) * 7;
              droneObj.vy = (droneObj.vy / spd) * 7;
            }
          }

          droneObj.x += droneObj.vx;
          droneObj.y += droneObj.vy;

          // Drone shoot lasers
          droneObj.shootTimer++;
          if (droneObj.shootTimer >= 18) {
            droneObj.shootTimer = 0;
            lasers.push({
              x: droneObj.x,
              y: droneObj.y,
              width: 4,
              height: 12,
              vx: 0,
              vy: -14,
              color: '#e879f9',
              damage: 15 * player.damageMultiplier,
            });
            soundSystem.playLaser();
          }

          // Draw Interceptor Drone
          ctx.save();
          ctx.translate(droneObj.x, droneObj.y);
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#e879f9';
          ctx.fillStyle = '#2e1065';
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // EXTRA TURRET DRONE COMPANION LOGIC
        if (drone) {
          // Floating orbit around player
          drone.x = player.x + 36 + Math.sin(frameCounter * 0.06) * 5;
          drone.y = player.y - 10 + Math.cos(frameCounter * 0.06) * 5;

          // Target selection (Boss or closest Asteroid)
          let targetX: number | null = null;
          let targetY: number | null = null;

          if (boss) {
            targetX = boss.x;
            targetY = boss.y;
          } else if (asteroids.length > 0) {
            let closestDist = Infinity;
            asteroids.forEach((ast) => {
              const d = Math.hypot(ast.x - drone!.x, ast.y - drone!.y);
              if (d < closestDist) {
                closestDist = d;
                targetX = ast.x;
                targetY = ast.y;
              }
            });
          }

          if (targetX !== null && targetY !== null) {
            drone.angle = Math.atan2(targetY - drone.y, targetX - drone.x);
          } else {
            drone.angle = -Math.PI / 2;
          }

          // Automated Firing every 30 frames (0.5s)
          drone.shootTimer++;
          if (drone.shootTimer >= 30 && (boss || asteroids.length > 0)) {
            soundSystem.playLaser();
            const laserVx = Math.cos(drone.angle) * 12;
            const laserVy = Math.sin(drone.angle) * 12;
            lasers.push({
              x: drone.x,
              y: drone.y,
              width: 5,
              height: 12,
              vx: laserVx,
              vy: laserVy,
              color: '#10b981',
              damage: 12 * player.damageMultiplier,
              isTurret: true,
            });
            drone.shootTimer = 0;
          }
        }

        // Spawn Boss Check
        if (!boss && scoreRef.current >= nextBossScoreTarget) {
          spawnBoss();
        }

        // Spawn Enemies / Asteroids
        spawnTimer++;
        const dynamicInterval = Math.max(25, spawnInterval - Math.floor(scoreRef.current / 100) * 4);
        if (spawnTimer >= dynamicInterval) {
          if (!campaignLevelRef.current.isEndless && !campaignLevelRef.current.isBoss) {
            spawnBasicEnemy();
          } else if (campaignLevelRef.current.isEndless) {
            if (Math.random() < 0.5) spawnBasicEnemy();
            else spawnAsteroid();
          } else if (campaignLevelRef.current.isBoss) {
            if (Math.random() < 0.25) spawnBasicEnemy();
          } else {
            spawnAsteroid();
          }
          spawnTimer = 0;
        }
      }

      // --- 3. DRAW EXTRA TURRET DRONE & WINGMEN ---
      if (drone && (currentStatus === 'PLAYING' || currentStatus === 'IDLE')) {
        ctx.save();
        ctx.translate(drone.x, drone.y);

        // Green pod body
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rotating Turret Barrel
        ctx.rotate(drone.angle);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(0, -2, 14, 4);

        ctx.restore();
      }

      // DRAW WINGMEN FIGHTERS
      if (isWingmenActive && (currentStatus === 'PLAYING' || currentStatus === 'IDLE')) {
        const wingmenCoords = [
          { x: player.x - 38, y: player.y + 12 },
          { x: player.x + 38, y: player.y + 12 },
        ];

        wingmenCoords.forEach((wm) => {
          ctx.save();
          ctx.translate(wm.x, wm.y);

          ctx.shadowBlur = 10;
          ctx.shadowColor = '#38bdf8';
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;

          // Mini sleek wedge ship
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(-11, 10);
          ctx.lineTo(0, 5);
          ctx.lineTo(11, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing cockpit core
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // --- 4. UPDATE & DRAW BOSS ---
      if (boss) {
        if (boss.y < 110) {
          boss.y += 2;
        } else {
          boss.x += boss.vx;
          if (boss.x - boss.width / 2 <= 30 || boss.x + boss.width / 2 >= CANVAS_WIDTH - 30) {
            boss.vx *= -1;
          }

          // --- BOSS TYPE 1: THE SWARM (Chapter 1) ---
          if (boss.isSwarmBoss) {
            boss.shootTimer++;
            if (boss.shootTimer >= 40) {
              boss.shootTimer = 0;
              boss.swarmAngle = (boss.swarmAngle || 0) + 0.35;
              for (let k = 0; k < 10; k++) {
                const angle = boss.swarmAngle + (k * Math.PI * 2) / 10;
                enemyBullets.push({
                  x: boss.x + Math.cos(angle) * 30,
                  y: boss.y + Math.sin(angle) * 30,
                  vx: Math.cos(angle) * 4.2,
                  vy: Math.sin(angle) * 4.2,
                  size: 8,
                  color: '#10b981',
                });
              }
              soundSystem.playLaser();
            }
          }
          // --- BOSS TYPE 2: THE LASER MATRIX (Chapter 2) ---
          else if (boss.isLaserMatrix) {
            boss.matrixTimer = (boss.matrixTimer || 0) + 1;

            if (boss.matrixState === 'IDLE') {
              boss.shootTimer++;
              if (boss.shootTimer >= 55) {
                enemyBullets.push({ x: boss.x - 30, y: boss.y + 40, vx: -2, vy: 5, size: 9, color: '#f43f5e' });
                enemyBullets.push({ x: boss.x, y: boss.y + 45, vx: 0, vy: 5.5, size: 10, color: '#f43f5e' });
                enemyBullets.push({ x: boss.x + 30, y: boss.y + 40, vx: 2, vy: 5, size: 9, color: '#f43f5e' });
                boss.shootTimer = 0;
              }

              if (boss.matrixTimer > 180) {
                boss.matrixState = 'WARNING';
                boss.matrixTimer = 0;
                const rows = [150, 280, 420];
                const cols = [180, 360, 540];
                boss.gridRows = [rows[Math.floor(Math.random() * rows.length)]];
                boss.gridCols = [cols[Math.floor(Math.random() * cols.length)]];
              }
            } else if (boss.matrixState === 'WARNING') {
              if (boss.matrixTimer > 60) {
                boss.matrixState = 'ACTIVE';
                boss.matrixTimer = 0;
                soundSystem.playNukeBlast();
                addScreenShake(6);
              }
            } else if (boss.matrixState === 'ACTIVE') {
              if (currentStatus === 'PLAYING') {
                const hitRow = boss.gridRows?.some((r) => Math.abs(player.y - r) < 24);
                const hitCol = boss.gridCols?.some((c) => Math.abs(player.x - c) < 24);
                if (hitRow || hitCol) {
                  handlePlayerHit(12);
                }
              }

              if (boss.matrixTimer > 45) {
                boss.matrixState = 'IDLE';
                boss.matrixTimer = 0;
              }
            }
          }
          // --- BOSS TYPE 3: THE TRACKER (Chapter 3) ---
          else if (boss.isTrackerBoss) {
            const dx = player.x - boss.x;
            boss.x += Math.sign(dx) * Math.min(Math.abs(dx), 3.2);

            boss.shootTimer++;
            if (boss.shootTimer >= 35) {
              boss.shootTimer = 0;
              const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
              for (let offset of [-0.3, 0, 0.3]) {
                const finalAngle = angle + offset;
                enemyBullets.push({
                  x: boss.x,
                  y: boss.y + 30,
                  vx: Math.cos(finalAngle) * 6.5,
                  vy: Math.sin(finalAngle) * 6.5,
                  size: 10,
                  color: '#06b6d4',
                });
              }
              soundSystem.playMissile();
            }
          }
          // --- BOSS TYPE 4: THE SPLITTER (Chapter 4) ---
          else if (boss.isSplitterBoss) {
            boss.shootTimer++;
            if (boss.shootTimer >= 48) {
              boss.shootTimer = 0;
              for (let offset of [-40, 0, 40]) {
                enemyBullets.push({
                  x: boss.x + offset,
                  y: boss.y + 40,
                  vx: (offset / 40) * 1.2,
                  vy: 3.8,
                  size: 22,
                  color: '#f97316',
                  isSplitter: true,
                });
              }
              soundSystem.playLaser();
            }
          }
          // --- BOSS TYPE 5: RUSHDOWN PRIME (Chapter 5) ---
          else if (boss.isRushdownPrime) {
            const hpRatio = boss.hp / boss.maxHp;
            boss.shootTimer++;

            if (hpRatio > 0.66) {
              if (boss.shootTimer % 45 === 0) {
                boss.swarmAngle = (boss.swarmAngle || 0) + 0.3;
                for (let k = 0; k < 12; k++) {
                  const angle = boss.swarmAngle + (k * Math.PI * 2) / 12;
                  enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * 4.5,
                    vy: Math.sin(angle) * 4.5,
                    size: 9,
                    color: '#eab308',
                  });
                }
                soundSystem.playLaser();
              }
            } else if (hpRatio > 0.33) {
              boss.matrixTimer = (boss.matrixTimer || 0) + 1;
              if (boss.matrixState === 'IDLE' && boss.matrixTimer > 120) {
                boss.matrixState = 'WARNING';
                boss.matrixTimer = 0;
                boss.gridRows = [200, 380];
                boss.gridCols = [250, 550];
              } else if (boss.matrixState === 'WARNING' && boss.matrixTimer > 45) {
                boss.matrixState = 'ACTIVE';
                boss.matrixTimer = 0;
                soundSystem.playNukeBlast();
                addScreenShake(6);
              } else if (boss.matrixState === 'ACTIVE') {
                if (currentStatus === 'PLAYING') {
                  const hitRow = boss.gridRows?.some((r) => Math.abs(player.y - r) < 24);
                  const hitCol = boss.gridCols?.some((c) => Math.abs(player.x - c) < 24);
                  if (hitRow || hitCol) handlePlayerHit(14);
                }
                if (boss.matrixTimer > 40) {
                  boss.matrixState = 'IDLE';
                  boss.matrixTimer = 0;
                }
              }
            } else {
              if (boss.shootTimer % 35 === 0) {
                boss.swarmAngle = (boss.swarmAngle || 0) + 0.4;
                for (let k = 0; k < 12; k++) {
                  const angle = boss.swarmAngle + (k * Math.PI * 2) / 12;
                  enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    size: 9,
                    color: '#eab308',
                  });
                }
                soundSystem.playLaser();
              }
            }
          }
          // --- BOSS TYPE 6: THE HIDDEN ONE (Chapter 6 - Corrupted Browning) ---
          else if (boss.isCorruptedBrowning) {
            boss.hp = Math.min(boss.maxHp, boss.hp + (boss.maxHp * 0.02) / 60);
            setBossInfoUI({ hp: Math.round(boss.hp), maxHp: boss.maxHp, name: boss.name });

            if (boss.deadRingerInvincibleFrames && boss.deadRingerInvincibleFrames > 0) {
              boss.deadRingerInvincibleFrames--;
            }

            const fireInterval = boss.hasTriggeredDeadRinger ? 18 : 36;
            boss.shootTimer++;
            if (boss.shootTimer >= fireInterval) {
              boss.shootTimer = 0;
              boss.spiralAngle = (boss.spiralAngle || 0) + 0.22;
              const speed = 8.5;

              for (let a = 0; a < 9; a++) {
                const angle = boss.spiralAngle + (a * Math.PI * 2) / 9;
                enemyBullets.push({
                  x: boss.x,
                  y: boss.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 10,
                  color: '#c084fc',
                });
              }
              soundSystem.playLaser();
              addScreenShake(3);
            }
          }
          // --- BOSS TYPE 7: PLUTO TITAN BATTLESHIP (Chapter 7) ---
          else if (boss.isPlutoBoss) {
            const hpRatio = boss.hp / boss.maxHp;
            boss.shootTimer++;

            if (hpRatio > 0.7) {
              if (boss.shootTimer % 50 === 0) {
                for (let bx = 30; bx <= CANVAS_WIDTH - 30; bx += 52) {
                  enemyBullets.push({
                    x: bx,
                    y: boss.y + 50,
                    vx: 0,
                    vy: 4.8,
                    size: 10,
                    color: '#e11d48',
                  });
                }
                soundSystem.playLaser();
              }
            } else if (hpRatio > 0.3) {
              boss.matrixTimer = (boss.matrixTimer || 0) + 1;
              if (boss.matrixState === 'IDLE' && boss.matrixTimer > 100) {
                boss.matrixState = 'WARNING';
                boss.matrixTimer = 0;
                boss.gridRows = [160, 280, 400, 520];
                boss.gridCols = [150, 350, 550, 700];
              } else if (boss.matrixState === 'WARNING' && boss.matrixTimer > 40) {
                boss.matrixState = 'ACTIVE';
                boss.matrixTimer = 0;
                soundSystem.playNukeBlast();
                addScreenShake(8);
              } else if (boss.matrixState === 'ACTIVE') {
                if (currentStatus === 'PLAYING') {
                  const hitRow = boss.gridRows?.some((r) => Math.abs(player.y - r) < 22);
                  const hitCol = boss.gridCols?.some((c) => Math.abs(player.x - c) < 22);
                  if (hitRow || hitCol) handlePlayerHit(16);
                }
                if (boss.matrixTimer > 40) {
                  boss.matrixState = 'IDLE';
                  boss.matrixTimer = 0;
                }
              }
            } else {
              boss.vx = 0;
              addScreenShake(3);
              boss.hp = Math.min(boss.maxHp, boss.hp + (boss.maxHp * 0.01) / 60);
              setBossInfoUI({ hp: Math.round(boss.hp), maxHp: boss.maxHp, name: boss.name });

              if (boss.shootTimer % 12 === 0) {
                boss.plutoLaserAngle = (boss.plutoLaserAngle || 0) + 0.18;
                for (let g = 0; g < 16; g++) {
                  const angle = boss.plutoLaserAngle + (g * Math.PI * 2) / 16;
                  enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    size: 11,
                    color: '#fb7185',
                  });
                }
                soundSystem.playLaser();
              }
            }
          }
          // --- BOSS TYPE 8: ALSACE BATTLECRUISER (Chapter 8) ---
          else if (boss.isAlsaceBoss) {
            boss.shootTimer++;
            if (boss.shootTimer % 40 === 0) {
              for (let offset of [-80, -40, 0, 40, 80]) {
                enemyBullets.push({
                  x: boss.x + offset,
                  y: boss.y + 50,
                  vx: (offset / 80) * 1.5,
                  vy: 6.0,
                  size: 11,
                  color: '#f8fafc',
                });
              }
              soundSystem.playMissile();
            }
          }
          // --- BOSS TYPE 9: OMEGA OVERLORD (Chapter 9) ---
          else if (boss.isOmegaOverlord) {
            boss.shootTimer++;
            boss.spiralAngle = (boss.spiralAngle || 0) + 0.15;
            if (boss.shootTimer % 20 === 0) {
              for (let k = 0; k < 8; k++) {
                const angle = boss.spiralAngle + (k * Math.PI * 2) / 8;
                enemyBullets.push({
                  x: boss.x,
                  y: boss.y,
                  vx: Math.cos(angle) * 5.5,
                  vy: Math.sin(angle) * 5.5,
                  size: 10,
                  color: '#60a5fa',
                });
              }
              soundSystem.playLaser();
            }
          }
          // --- BOSS TYPE 10: RUSHDOWN APEX (Chapter 10) ---
          else if (boss.isRushdownApex) {
            boss.shootTimer++;
            boss.spiralAngle = (boss.spiralAngle || 0) + 0.25;
            if (boss.shootTimer % 15 === 0) {
              for (let k = 0; k < 12; k++) {
                const angle = boss.spiralAngle + (k * Math.PI * 2) / 12;
                enemyBullets.push({
                  x: boss.x,
                  y: boss.y,
                  vx: Math.cos(angle) * 7.0,
                  vy: Math.sin(angle) * 7.0,
                  size: 12,
                  color: '#f43f5e',
                });
              }
              soundSystem.playNukeBlast();
              addScreenShake(4);
            }
          } else {
            boss.shootTimer++;
            if (boss.shootTimer >= 55) {
              enemyBullets.push({ x: boss.x - 30, y: boss.y + 40, vx: -2, vy: 4.5, size: 8, color: '#ef4444' });
              enemyBullets.push({ x: boss.x, y: boss.y + 45, vx: 0, vy: 5, size: 9, color: '#ef4444' });
              enemyBullets.push({ x: boss.x + 30, y: boss.y + 40, vx: 2, vy: 4.5, size: 8, color: '#ef4444' });
              boss.shootTimer = 0;
            }
          }
        }

        // DRAW LASER MATRIX WARNING / ACTIVE GRID BEAMS
        if (boss.isLaserMatrix && (boss.matrixState === 'WARNING' || boss.matrixState === 'ACTIVE')) {
          ctx.save();
          if (boss.matrixState === 'WARNING') {
            ctx.strokeStyle = Math.floor(frameCounter / 4) % 2 === 0 ? 'rgba(244, 63, 94, 0.8)' : 'rgba(244, 63, 94, 0.3)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 8]);
          } else {
            ctx.strokeStyle = '#f43f5e';
            ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#f43f5e';
            ctx.lineWidth = 36;
          }

          boss.gridRows?.forEach((r) => {
            ctx.beginPath();
            ctx.moveTo(0, r);
            ctx.lineTo(CANVAS_WIDTH, r);
            ctx.stroke();
            if (boss.matrixState === 'ACTIVE') {
              ctx.fillRect(0, r - 18, CANVAS_WIDTH, 36);
            }
          });

          boss.gridCols?.forEach((c) => {
            ctx.beginPath();
            ctx.moveTo(c, 0);
            ctx.lineTo(c, CANVAS_HEIGHT);
            ctx.stroke();
            if (boss.matrixState === 'ACTIVE') {
              ctx.fillRect(c - 18, 0, 36, CANVAS_HEIGHT);
            }
          });

          ctx.restore();
        }

        // RENDER UNIQUE BOSS DESIGNS
        ctx.save();
        ctx.translate(boss.x, boss.y);

        if (boss.isSwarmBoss) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#10b981';

          const corePulse = 16 + Math.sin(frameCounter * 0.1) * 4;
          ctx.fillStyle = '#065f46';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, corePulse + 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
          ctx.fill();

          for (let p = 0; p < 5; p++) {
            const podAngle = frameCounter * 0.04 + (p * Math.PI * 2) / 5;
            const px = Math.cos(podAngle) * 55;
            const py = Math.sin(podAngle) * 35;

            ctx.save();
            ctx.translate(px, py);
            ctx.fillStyle = '#047857';
            ctx.strokeStyle = '#6ee7b7';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(-12, 6);
            ctx.lineTo(0, 14);
            ctx.lineTo(12, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#a7f3d0';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else if (boss.isLaserMatrix) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#f43f5e';

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 3.5;

          ctx.beginPath();
          ctx.moveTo(0, boss.height / 2 + 10);
          ctx.lineTo(-boss.width / 2, 0);
          ctx.lineTo(-boss.width / 2 + 20, -boss.height / 2);
          ctx.lineTo(boss.width / 2 - 20, -boss.height / 2);
          ctx.lineTo(boss.width / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-boss.width / 3, -boss.height / 3, boss.width * 0.66, boss.height * 0.5);

          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(-boss.width / 2 + 5, 0, 10, 30);
          ctx.fillRect(boss.width / 2 - 15, 0, 10, 30);

          ctx.fillStyle = boss.matrixState === 'ACTIVE' ? '#ffffff' : '#f43f5e';
          ctx.shadowBlur = boss.matrixState === 'ACTIVE' ? 30 : 15;
          ctx.shadowColor = '#f43f5e';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
        } else if (boss.isCorruptedBrowning) {
          if (boss.deadRingerInvincibleFrames && boss.deadRingerInvincibleFrames > 0) {
            ctx.save();
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#e879f9';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, boss.width / 2 + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(232, 121, 249, 0.2)';
            ctx.fill();
            ctx.restore();
          }

          ctx.shadowBlur = 22;
          ctx.shadowColor = '#c084fc';

          ctx.fillStyle = '#090514';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 3.5;

          ctx.beginPath();
          ctx.moveTo(0, -boss.height / 2 - 8);
          ctx.lineTo(-boss.width / 2, boss.height / 3);
          ctx.lineTo(-boss.width / 3, boss.height / 2);
          ctx.lineTo(boss.width / 3, boss.height / 2);
          ctx.lineTo(boss.width / 2, boss.height / 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-boss.width / 2 - 10, boss.height / 4);
          ctx.lineTo(0, -boss.height / 3);
          ctx.lineTo(boss.width / 2 + 10, boss.height / 4);
          ctx.stroke();

          const coreGlow = 14 + Math.sin(frameCounter * 0.12) * 4;
          ctx.fillStyle = boss.hasTriggeredDeadRinger ? '#f43f5e' : '#a855f7';
          ctx.shadowBlur = 25;
          ctx.shadowColor = boss.hasTriggeredDeadRinger ? '#f43f5e' : '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, coreGlow, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (boss.isAlsaceBoss) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#e2e8f0';
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, -boss.height / 2 - 10);
          ctx.lineTo(-boss.width / 2, boss.height / 4);
          ctx.lineTo(-boss.width / 3, boss.height / 2);
          ctx.lineTo(boss.width / 3, boss.height / 2);
          ctx.lineTo(boss.width / 2, boss.height / 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
        } else if (boss.isOmegaOverlord) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#3b82f6';
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, boss.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const pulse = 16 + Math.sin(frameCounter * 0.1) * 6;
          ctx.fillStyle = '#1d4ed8';
          ctx.beginPath();
          ctx.arc(0, 0, pulse, 0, Math.PI * 2);
          ctx.fill();
        } else if (boss.isRushdownApex) {
          ctx.shadowBlur = 35;
          ctx.shadowColor = '#f43f5e';
          ctx.fillStyle = '#111827';
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, boss.height / 2);
          ctx.lineTo(-boss.width / 2, -boss.height / 3);
          ctx.lineTo(-boss.width / 4, -boss.height / 2);
          ctx.lineTo(boss.width / 4, -boss.height / 2);
          ctx.lineTo(boss.width / 2, -boss.height / 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, boss.height / 2);
          ctx.lineTo(-boss.width / 2, -boss.height / 4);
          ctx.lineTo(-boss.width / 3, -boss.height / 2);
          ctx.lineTo(boss.width / 3, -boss.height / 2);
          ctx.lineTo(boss.width / 2, -boss.height / 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // --- 5. UPDATE & DRAW ENEMY BULLETS ---
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        if (currentStatus === 'PLAYING') {
          const dist = Math.hypot(player.x - b.x, player.y - b.y);
          if (dist < player.width / 2 + b.size / 2) {
            enemyBullets.splice(i, 1);
            handlePlayerHit(25);
            if (gameStatusRef.current === 'GAMEOVER') break;
          }
        }

        if (b.y > CANVAS_HEIGHT + 20 || b.x < -20 || b.x > CANVAS_WIDTH + 20) {
          enemyBullets.splice(i, 1);
        }
      }

      // --- 6. UPDATE & DRAW LASERS ---
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.x += l.vx;
        l.y += l.vy;

        ctx.save();
        if (l.isPiercing) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#c084fc';
          ctx.fillStyle = '#f3e8ff';
          ctx.fillRect(l.x - l.width / 2, l.y - l.height / 2, l.width, l.height);
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 3;
          ctx.strokeRect(l.x - l.width / 2, l.y - l.height / 2, l.width, l.height);
        } else {
          ctx.shadowBlur = 10;
          ctx.shadowColor = l.color;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(l.x - l.width / 2, l.y - l.height / 2, l.width, l.height);
          ctx.strokeStyle = l.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(l.x - l.width / 2, l.y - l.height / 2, l.width, l.height);
        }
        ctx.restore();

        // Laser vs Boss
        if (boss && l.x >= boss.x - boss.width / 2 && l.x <= boss.x + boss.width / 2 && l.y <= boss.y + boss.height / 2 && l.y >= boss.y - boss.height / 2) {
          const bossId = 999999;
          if (!l.hitEnemyIds || !l.hitEnemyIds.has(bossId)) {
            if (l.hitEnemyIds) l.hitEnemyIds.add(bossId);

            if (!boss.deadRingerInvincibleFrames || boss.deadRingerInvincibleFrames <= 0) {
              boss.hp -= l.damage;
            }
            createExplosion(l.x, l.y, l.color, 10, false);

            if (!l.isPiercing) {
              lasers.splice(i, 1);
            }

            if (boss.hp <= 0) {
              if (boss.isCorruptedBrowning && !boss.hasTriggeredDeadRinger) {
                boss.hasTriggeredDeadRinger = true;
                boss.hp = boss.maxHp * 0.5;
                boss.deadRingerInvincibleFrames = 180;
                floatingTexts.push({
                  id: nextEntityId++,
                  x: boss.x,
                  y: boss.y - 30,
                  text: 'OVERDRIVE!',
                  color: '#e879f9',
                  scale: 1.8,
                  alpha: 1.0,
                  vy: -1.0,
                  lifetime: 120,
                });
                soundSystem.playPowerUpCollect();
                soundSystem.playExplosion(true);
                boss.name = 'THE HIDDEN ONE [OVERDRIVE]';
                setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
                addScreenShake(10);
              } else {
                soundSystem.playExplosion(true);
                createExplosion(boss.x, boss.y, '#00f3ff', 80, true);
                scoreRef.current += 300;
                asteroidsDestroyedRef.current += 1;
                setScore(scoreRef.current);
                setDestroyedCount(asteroidsDestroyedRef.current);

                dropPowerUp(boss.x, boss.y, true);

                nextBossScoreTarget = scoreRef.current + 400;
                boss = null;
                setBossInfoUI(null);

                if (!campaignLevelRef.current.isEndless) {
                  unlockNextLevel(campaignLevelRef.current.chapter, campaignLevelRef.current.level);
                  gameStatusRef.current = 'VICTORY';
                  setGameStatus('VICTORY');
                }
              }
            } else {
              setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
            }
            if (!l.isPiercing) continue;
          }
        }

        if (l.y < -30 || l.y > CANVAS_HEIGHT + 30 || l.x < -30 || l.x > CANVAS_WIDTH + 30) {
          lasers.splice(i, 1);
        }
      }

      // --- 7. UPDATE & DRAW HOMING MISSILES ---
      for (let i = homingMissiles.length - 1; i >= 0; i--) {
        const m = homingMissiles[i];

        let targetX: number | null = null;
        let targetY: number | null = null;

        if (boss) {
          targetX = boss.x;
          targetY = boss.y;
        } else if (basicEnemies.length > 0) {
          let closestDist = Infinity;
          basicEnemies.forEach((e) => {
            const d = Math.hypot(e.x - m.x, e.y - m.y);
            if (d < closestDist) {
              closestDist = d;
              targetX = e.x;
              targetY = e.y;
            }
          });
        } else if (asteroids.length > 0) {
          let closestDist = Infinity;
          asteroids.forEach((ast) => {
            const d = Math.hypot(ast.x - m.x, ast.y - m.y);
            if (d < closestDist) {
              closestDist = d;
              targetX = ast.x;
              targetY = ast.y;
            }
          });
        }

        if (targetX !== null && targetY !== null) {
          const angle = Math.atan2(targetY - m.y, targetX - m.x);
          m.vx += Math.cos(angle) * 0.8;
          m.vy += Math.sin(angle) * 0.8;
          const speed = Math.hypot(m.vx, m.vy);
          if (speed > 10) {
            m.vx = (m.vx / speed) * 10;
            m.vy = (m.vy / speed) * 10;
          }
        }

        m.x += m.vx;
        m.y += m.vy;

        particles.push({
          x: m.x,
          y: m.y,
          vx: Math.random() * 0.8 - 0.4,
          vy: Math.random() * 0.8 + 0.5,
          size: 3,
          color: '#a855f7',
          alpha: 0.8,
          decay: 0.08,
          isSquare: false,
        });

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = m.color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (boss && Math.hypot(boss.x - m.x, boss.y - m.y) < boss.width / 2) {
          if (!boss.deadRingerInvincibleFrames || boss.deadRingerInvincibleFrames <= 0) {
            boss.hp -= m.damage;
          }
          createExplosion(m.x, m.y, '#a855f7', 18, false);
          homingMissiles.splice(i, 1);

          if (boss.hp <= 0) {
            if (boss.isCorruptedBrowning && !boss.hasTriggeredDeadRinger) {
              boss.hasTriggeredDeadRinger = true;
              boss.hp = boss.maxHp * 0.5;
              boss.deadRingerInvincibleFrames = 180;
              floatingTexts.push({
                id: nextEntityId++,
                x: boss.x,
                y: boss.y - 30,
                text: 'OVERDRIVE!',
                color: '#e879f9',
                scale: 1.8,
                alpha: 1.0,
                vy: -1.0,
                lifetime: 120,
              });
              soundSystem.playPowerUpCollect();
              soundSystem.playExplosion(true);
              boss.name = 'THE HIDDEN ONE [OVERDRIVE]';
              setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
              addScreenShake(10);
            } else {
              soundSystem.playExplosion(true);
              scoreRef.current += 250;
              nextBossScoreTarget = scoreRef.current + 400;
              boss = null;
              setBossInfoUI(null);
            }
          } else {
            setBossInfoUI({ hp: boss.hp, maxHp: boss.maxHp, name: boss.name });
          }
          continue;
        }

        for (let j = basicEnemies.length - 1; j >= 0; j--) {
          const e = basicEnemies[j];
          if (Math.hypot(e.x - m.x, e.y - m.y) < e.width / 2 + 6) {
            e.hp -= 3;
            createExplosion(m.x, m.y, '#a855f7', 16, false);
            homingMissiles.splice(i, 1);

            if (e.hp <= 0) {
              soundSystem.playExplosion(false);
              createExplosion(e.x, e.y, e.color, 20, true);
              scoreRef.current += 20;
              asteroidsDestroyedRef.current += 1;
              setScore(scoreRef.current);
              setDestroyedCount(asteroidsDestroyedRef.current);
              basicEnemies.splice(j, 1);
            }
            break;
          }
        }

        for (let j = asteroids.length - 1; j >= 0; j--) {
          const ast = asteroids[j];
          if (Math.hypot(ast.x - m.x, ast.y - m.y) < ast.size / 2 + 6) {
            ast.hp -= 3;
            createExplosion(m.x, m.y, '#a855f7', 16, false);
            homingMissiles.splice(i, 1);

            if (ast.hp <= 0) {
              soundSystem.playExplosion(ast.size > 36);
              createExplosion(ast.x, ast.y, ast.color, 20, true);
              scoreRef.current += 20;
              asteroidsDestroyedRef.current += 1;
              setScore(scoreRef.current);
              setDestroyedCount(asteroidsDestroyedRef.current);
              asteroids.splice(j, 1);
            }
            break;
          }
        }

        if (m.y < -40 || m.y > CANVAS_HEIGHT + 40 || m.x < -40 || m.x > CANVAS_WIDTH + 40) {
          homingMissiles.splice(i, 1);
        }
      }

      // --- 7.5 UPDATE & DRAW BASIC ENEMIES (GUNNERS, MISSILES, KAMIKAZES) ---
      for (let i = basicEnemies.length - 1; i >= 0; i--) {
        const e = basicEnemies[i];

        if (e.type === 'GUNNER') {
          e.y += e.vy;
          e.x += e.vx;
          if (e.x < 30 || e.x > CANVAS_WIDTH - 30) e.vx *= -1;

          e.shootTimer = (e.shootTimer || 0) + 1;
          if (e.shootTimer % 45 === 0) {
            enemyBullets.push({ x: e.x - 8, y: e.y + 16, vx: -1, vy: 5, size: 7, color: '#f59e0b' });
            enemyBullets.push({ x: e.x + 8, y: e.y + 16, vx: 1, vy: 5, size: 7, color: '#f59e0b' });
            soundSystem.playLaser();
          }
        } else if (e.type === 'MISSILE') {
          e.y += e.vy;
          if (e.y > 110) e.vy = 0.3; // Hang back

          e.missileTimer = (e.missileTimer || 0) + 1;
          if (e.missileTimer >= 70) {
            e.missileTimer = 0;
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            enemyBullets.push({
              x: e.x,
              y: e.y + 20,
              vx: Math.cos(angle) * 4.5,
              vy: Math.sin(angle) * 4.5,
              size: 9,
              color: '#a855f7',
            });
            soundSystem.playMissile();
          }
        } else if (e.type === 'KAMIKAZE') {
          const dx = player.x - e.x;
          e.x += Math.sign(dx) * Math.min(Math.abs(dx), 2.2);
          e.y += e.vy;
        }

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;

        if (e.type === 'GUNNER') {
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 18);
          ctx.lineTo(-18, -12);
          ctx.lineTo(0, -6);
          ctx.lineTo(18, -12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'MISSILE') {
          ctx.fillStyle = '#2e1065';
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 20);
          ctx.lineTo(-14, -14);
          ctx.lineTo(0, -20);
          ctx.lineTo(14, -14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = e.color;
          ctx.fillRect(-10, -8, 20, 6);
        } else if (e.type === 'KAMIKAZE') {
          ctx.fillStyle = '#450a0a';
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 18);
          ctx.lineTo(-16, -16);
          ctx.lineTo(0, 10);
          ctx.lineTo(16, -16);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (e.y > CANVAS_HEIGHT + 40) {
          basicEnemies.splice(i, 1);
          continue;
        }

        // --- COLLISION: LASER vs BASIC ENEMY ---
        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          if (
            l.x + l.width / 2 >= e.x - e.width / 2 &&
            l.x - l.width / 2 <= e.x + e.width / 2 &&
            l.y <= e.y + e.height / 2 &&
            l.y + l.height >= e.y - e.height / 2
          ) {
            if (l.hitEnemyIds && l.hitEnemyIds.has(e.id)) continue;
            if (l.hitEnemyIds) l.hitEnemyIds.add(e.id);

            e.hp -= l.damage;
            createExplosion(l.x, l.y, e.color, 8, true);

            if (!l.isPiercing) {
              lasers.splice(j, 1);
            }

            if (e.hp <= 0) {
              soundSystem.playExplosion(false);
              createExplosion(e.x, e.y, e.color, 22, true);
              const points = e.type === 'KAMIKAZE' ? 25 : e.type === 'GUNNER' ? 35 : 45;
              scoreRef.current += points;
              asteroidsDestroyedRef.current += 1;
              setScore(scoreRef.current);
              setDestroyedCount(asteroidsDestroyedRef.current);

              if (Math.random() < 0.2) {
                dropPowerUp(e.x, e.y);
              }

              basicEnemies.splice(i, 1);
              break;
            }
          }
        }

        // --- COLLISION: PLAYER vs BASIC ENEMY ---
        if (currentStatus === 'PLAYING') {
          const dx = Math.abs(player.x - e.x);
          const dy = Math.abs(player.y - e.y);
          if (dx < player.width / 2 + e.width / 2 - 4 && dy < player.height / 2 + e.height / 2 - 4) {
            basicEnemies.splice(i, 1);
            handlePlayerHit(e.type === 'KAMIKAZE' ? 40 : 25);
            if (gameStatusRef.current === 'GAMEOVER') break;
          }
        }
      }

      // --- 8. UPDATE & DRAW POWER-UP DROPS ---
      for (let i = powerUpItems.length - 1; i >= 0; i--) {
        const item = powerUpItems[i];

        if (selectedPerksRef.current.includes('MAGNET') && currentStatus === 'PLAYING') {
          const distToPlayer = Math.hypot(player.x - item.x, player.y - item.y);
          if (distToPlayer < 220) {
            const angle = Math.atan2(player.y - item.y, player.x - item.x);
            item.x += Math.cos(angle) * 5.5;
            item.y += Math.sin(angle) * 5.5;
          } else {
            item.y += item.vy;
          }
        } else {
          item.y += item.vy;
        }

        item.rotation += 0.03;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        ctx.shadowBlur = 12;
        ctx.shadowColor = item.color;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const r = item.width / 2;
        for (let a = 0; a < 8; a++) {
          const angle = (a * Math.PI) / 4;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.rotate(-item.rotation);
        ctx.fillStyle = item.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, 0, 0);

        ctx.restore();

        if (currentStatus === 'PLAYING') {
          const dist = Math.hypot(player.x - item.x, player.y - item.y);
          if (dist < player.width / 2 + item.width / 2) {
            soundSystem.playPowerUpCollect();
            createExplosion(item.x, item.y, item.color, 25, false);

            if (item.type === 'NUKE') {
              triggerNuke();
            } else {
              const maxDur = item.type === 'WINGMEN' ? 720 : 480;
              const existingIdx = activePowerUps.findIndex((p) => p.type === item.type);
              if (existingIdx !== -1) {
                activePowerUps[existingIdx].duration = maxDur;
                activePowerUps[existingIdx].maxDuration = maxDur;
              } else {
                activePowerUps.push({ type: item.type, duration: maxDur, maxDuration: maxDur });
              }
            }

            powerUpItems.splice(i, 1);
            continue;
          }
        }

        if (item.y > CANVAS_HEIGHT + 40) {
          powerUpItems.splice(i, 1);
        }
      }

      // --- 9. UPDATE & DRAW SQUARE ASTEROIDS ---
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.y += ast.vy;
        ast.rotation += ast.rotationSpeed;

        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);

        const half = ast.size / 2;
        ctx.fillStyle = ast.color;
        ctx.fillRect(-half, -half, ast.size, ast.size);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-half, -half, ast.size, ast.size);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeRect(-half + 4, -half + 4, ast.size - 8, ast.size - 8);

        if (ast.maxHp > 1 && ast.hp < ast.maxHp) {
          ctx.rotate(-ast.rotation);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
          ctx.fillRect(-half, -half - 8, ast.size, 4);
          ctx.fillStyle = '#00ffcc';
          ctx.fillRect(-half, -half - 8, (ast.size * ast.hp) / ast.maxHp, 4);
        }

        ctx.restore();

        if (ast.y > CANVAS_HEIGHT + ast.size) {
          asteroids.splice(i, 1);
          continue;
        }

        // --- COLLISION: LASER vs SQUARE ASTEROID ---
        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          if (
            l.x + l.width / 2 >= ast.x - ast.size / 2 &&
            l.x - l.width / 2 <= ast.x + ast.size / 2 &&
            l.y <= ast.y + ast.size / 2 &&
            l.y + l.height >= ast.y - ast.size / 2
          ) {
            if (l.hitEnemyIds && l.hitEnemyIds.has(ast.id)) {
              continue; // Already hit this asteroid with piercing beam
            }

            if (l.hitEnemyIds) l.hitEnemyIds.add(ast.id);
            ast.hp -= l.damage;
            createExplosion(l.x, l.y, ast.color, 8, true);

            if (!l.isPiercing) {
              lasers.splice(j, 1);
            }

            if (ast.hp <= 0) {
              soundSystem.playExplosion(ast.size > 36);
              createExplosion(ast.x, ast.y, ast.color, ast.size > 36 ? 30 : 18, true);
              createExplosion(ast.x, ast.y, '#ffd700', 10, false);

              const points = ast.size === 28 ? 10 : ast.size === 40 ? 20 : 35;
              scoreRef.current += points;
              asteroidsDestroyedRef.current += 1;
              setScore(scoreRef.current);
              setDestroyedCount(asteroidsDestroyedRef.current);

              if (scoreRef.current > highScoreRef.current) {
                highScoreRef.current = scoreRef.current;
                setHighScore(scoreRef.current);
                localStorage.setItem('space_shooter_highscore', String(scoreRef.current));
              }

              if (Math.random() < 0.22) {
                dropPowerUp(ast.x, ast.y);
              }

              asteroids.splice(i, 1);
              break;
            }
          }
        }

        // --- COLLISION: PLAYER vs SQUARE ASTEROID ---
        if (currentStatus === 'PLAYING') {
          const dx = Math.abs(player.x - ast.x);
          const dy = Math.abs(player.y - ast.y);
          const hitThresholdX = player.width / 2 + ast.size / 2 - 4;
          const hitThresholdY = player.height / 2 + ast.size / 2 - 4;

          if (dx < hitThresholdX && dy < hitThresholdY) {
            asteroids.splice(i, 1);
            handlePlayerHit(35);
            if (gameStatusRef.current === 'GAMEOVER') break;
          }
        }
      }

      // --- CAMPAIGN SURVIVAL TIMER CHECK ---
      if (currentStatus === 'PLAYING' && !campaignLevelRef.current.isEndless && !campaignLevelRef.current.isBoss) {
        survivalTimerFramesRef.current -= 1;
        if (frameCounter % 30 === 0) {
          setSurvivalTimerUI(Math.max(0, Math.ceil(survivalTimerFramesRef.current / 60)));
        }

        if (survivalTimerFramesRef.current <= 0) {
          soundSystem.playPowerUpCollect();
          unlockNextLevel(campaignLevelRef.current.chapter, campaignLevelRef.current.level);
          gameStatusRef.current = 'VICTORY';
          setGameStatus('VICTORY');
        }
      }

      // --- 10. DRAW SHIP DISTINCTLY ACCORDING TO SHIP TYPE ---
      if (currentStatus === 'PLAYING' || currentStatus === 'IDLE') {
        const isFashingInvincible = player.invincibleFrames > 0 && Math.floor(player.invincibleFrames / 5) % 2 === 0;

        if (!isFashingInvincible) {
          ctx.save();
          ctx.translate(player.x, player.y);

          // Shield Aura
          if (player.hasShield) {
            ctx.save();
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00f3ff';
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, player.width / 2 + 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 243, 255, 0.12)';
            ctx.fill();
            ctx.restore();
          }

          if (player.shipType === 'DEATH') {
            // DEATH DREADNOUGHT: Queen of the Void (Deep Violet & Crimson Gold Void Engine)
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#c084fc';

            // Void Shield Rings
            if (player.deathShieldCharges && player.deathShieldCharges > 0) {
              ctx.save();
              ctx.shadowBlur = 20;
              ctx.shadowColor = '#e879f9';
              ctx.strokeStyle = '#c084fc';
              ctx.lineWidth = 3;
              for (let s = 1; s <= player.deathShieldCharges; s++) {
                ctx.beginPath();
                ctx.arc(0, 0, player.width / 2 + s * 8, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.fillStyle = 'rgba(192, 132, 252, 0.15)';
              ctx.fill();
              ctx.restore();
            }

            // Giant Void Hull
            ctx.fillStyle = '#110321';
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 3.5;

            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2 - 10);
            ctx.lineTo(-player.width / 3, -player.height / 4);
            ctx.lineTo(-player.width / 2 - 6, player.height / 4);
            ctx.lineTo(-player.width / 3, player.height / 2 + 4);
            ctx.lineTo(player.width / 3, player.height / 2 + 4);
            ctx.lineTo(player.width / 2 + 6, player.height / 4);
            ctx.lineTo(player.width / 3, -player.height / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 12 Upward Guns & 12 Downward Guns (24 Gun Muzzles Array)
            ctx.fillStyle = '#e879f9';
            for (let g = -5.5; g <= 5.5; g += 1) {
              ctx.fillRect(g * 9 - 2, -player.height / 2 - 10, 4, 12);
              ctx.fillRect(g * 9 - 2, player.height / 2, 4, 12);
            }

            // Void Core Matrix
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#f43f5e';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
          } else if (player.shipType === 'TEXAN') {
            // TEXAN: Chunky Heavy Tank Fortress (Amber)
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#f59e0b';
            ctx.fillStyle = '#291e03';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;

            // Heavy hull shape
            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2);
            ctx.lineTo(-player.width / 2, player.height / 4);
            ctx.lineTo(-player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 2, player.height / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Twin Heavy Barrels
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-player.width / 3 - 2, -player.height / 2 - 4, 5, 12);
            ctx.fillRect(player.width / 3 - 3, -player.height / 2 - 4, 5, 12);
          } else if (player.shipType === 'AKIRA') {
            // AKIRA: Needle-nosed Drift Ship (Hot Pink)
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#ec4899';
            ctx.fillStyle = '#3b0720';
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2 - 4); // Needle tip
            ctx.lineTo(-player.width / 2, player.height / 2);
            ctx.lineTo(0, player.height / 4);
            ctx.lineTo(player.width / 2, player.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Swept wings
            ctx.strokeStyle = '#f472b6';
            ctx.beginPath();
            ctx.moveTo(-player.width / 2 - 4, player.height / 3);
            ctx.lineTo(0, -player.height / 4);
            ctx.lineTo(player.width / 2 + 4, player.height / 3);
            ctx.stroke();
          } else if (player.shipType === 'FOEHAMMER') {
            // FOEHAMMER / MJOLNIR: Almighty Railgun Artillery (Purple / Violet)
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#a855f7';
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2 - 6);
            ctx.lineTo(-player.width / 4, -player.height / 4);
            ctx.lineTo(-player.width / 2, player.height / 3);
            ctx.lineTo(-player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 2, player.height / 3);
            ctx.lineTo(player.width / 4, -player.height / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Railgun Barrel Core
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(-3, -player.height / 2 - 2, 6, 18);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 2, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (player.shipType === 'BROWNING') {
            // BROWNING OVERLORD: Crimson Triple-Railgun Dreadnought
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#f43f5e';
            ctx.fillStyle = '#2b060d';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2 - 8);
            ctx.lineTo(-player.width / 3, -player.height / 4);
            ctx.lineTo(-player.width / 2, player.height / 3);
            ctx.lineTo(-player.width / 4, player.height / 2);
            ctx.lineTo(player.width / 4, player.height / 2);
            ctx.lineTo(player.width / 2, player.height / 3);
            ctx.lineTo(player.width / 3, -player.height / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Triple Crimson Railgun Cannons
            ctx.fillStyle = '#fb7185';
            ctx.fillRect(-3, -player.height / 2 - 8, 6, 18);
            ctx.fillRect(-player.width / 3 - 2, -player.height / 3, 4, 14);
            ctx.fillRect(player.width / 3 - 2, -player.height / 3, 4, 14);

            // Core Energy Matrix
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
          } else if (player.shipType === 'MARTIN') {
            // MARTIN LOCKHEED: Emerald Tactical Missile Truck
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#10b981';
            ctx.fillStyle = '#064e3b';
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2);
            ctx.lineTo(-player.width / 3, -player.height / 4);
            ctx.lineTo(-player.width / 2 - 4, player.height / 4);
            ctx.lineTo(-player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 2 + 4, player.height / 4);
            ctx.lineTo(player.width / 3, -player.height / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Twin Missile Pods
            ctx.fillStyle = '#059669';
            ctx.fillRect(-player.width / 2 - 2, -player.height / 6, 8, 18);
            ctx.fillRect(player.width / 2 - 6, -player.height / 6, 8, 18);

            // Core Guidance Matrix
            ctx.fillStyle = '#a7f3d0';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // STANDARD APEX: Sleek Cyan Triangle Ship
            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2);
            ctx.lineTo(-player.width / 2, player.height / 2);
            ctx.lineTo(0, player.height / 3);
            ctx.lineTo(player.width / 2, player.height / 2);
            ctx.closePath();

            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00f3ff';
            ctx.fillStyle = '#0a192f';
            ctx.fill();

            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(0, -2, 4, 8, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }

          ctx.restore();
        }
      }

      // --- 11. PARTICLES ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.isSquare) {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // --- 11.5 FLOATING TEXTS ---
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.012;
        ft.lifetime--;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = ft.color;
        ctx.font = `black ${Math.round(28 * ft.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.lifetime <= 0 || ft.alpha <= 0) {
          floatingTexts.splice(i, 1);
        }
      }

      // --- 12. NUKE FLASH ---
      if (nukeFlashFrames > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${nukeFlashFrames / 18})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        nukeFlashFrames--;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const currentShipInfo = SHIPS_LIST.find((s) => s.id === selectedShip) || SHIPS_LIST[0];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-2 sm:p-4 select-none">
      {/* TOP HEADER / STATS BAR */}
      <div className="w-full max-w-[800px] bg-slate-900/95 border border-cyan-500/30 rounded-t-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-lg shadow-cyan-950/40">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* TITLE / LOGO ACCESS */}
          <div className="cursor-pointer group flex flex-col" onClick={handleTitleClick} title="Click 5 times to reveal Browning secret chassis">
            <span className="text-[10px] font-mono text-cyan-500 group-hover:text-cyan-300 transition-colors uppercase font-bold tracking-wider">
              PROJ RUSHDOWN {logoClickCount > 0 && `[${logoClickCount}/5]`}
            </span>
            <span className="text-xs font-black text-slate-200 group-hover:text-cyan-400 transition-colors font-mono tracking-tight">
              SLOT 0{activeSlotId || 1}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Score</span>
              <span className="text-lg sm:text-xl font-black font-mono text-cyan-300 tracking-wider">
                {score.toString().padStart(5, '0')}
              </span>
            </div>
          </div>

          {/* PLAYER HEALTH BAR */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30" />
            <div className="flex flex-col min-w-[80px]">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
                <span>Hull</span>
                <span className="text-slate-200 font-bold">
                  {playerHpUI.hp}/{playerHpUI.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerHpUI.hp / playerHpUI.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* LIVES STOCK BADGES */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Lives</span>
              <div className="flex items-center gap-1 mt-0.5">
                {Array.from({ length: Math.max(0, livesUI) }).map((_, idx) => (
                  <Rocket
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      selectedShip === 'BROWNING'
                        ? 'text-rose-400 fill-rose-500/30'
                        : 'text-cyan-400 fill-cyan-500/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* EQUIPPED SHIP & PERKS BADGES */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border"
            style={{
              backgroundColor: `${currentShipInfo.color}15`,
              borderColor: `${currentShipInfo.color}50`,
              color: currentShipInfo.color,
            }}
          >
            {currentShipInfo.name}
          </span>

          {selectedPerks.map((p) => {
            const info = PERK_LIST.find((item) => item.id === p);
            return (
              <span
                key={p}
                className="px-2 py-0.5 rounded text-[11px] font-bold font-mono border"
                style={{
                  backgroundColor: `${info?.color || '#00f3ff'}15`,
                  borderColor: `${info?.color || '#00f3ff'}50`,
                  color: info?.color || '#00f3ff',
                }}
              >
                {info?.name}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* LOADOUT CONFIGURE MODAL TRIGGER */}
          <button
            onClick={() => {
              gameStatusRef.current = 'PERK_SELECT';
              setGameStatus('PERK_SELECT');
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            title="Configure Ship & Perks Loadout"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Loadout</span>
          </button>

          {/* SOUND TOGGLE */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 transition-colors border border-slate-700 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* ACTIVE POWER-UPS & CAMPAIGN LEVEL HUD COUNTDOWN BAR */}
      <div className="w-full max-w-[800px] bg-slate-950/90 border-x border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded text-cyan-300 font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {campaignLevel.isEndless ? 'ENDLESS MODE' : `SECTOR ${campaignLevel.chapter}-${campaignLevel.level}`}
            {campaignLevel.isBoss && ' (BOSS LEVEL)'}
          </span>

          {!campaignLevel.isEndless && !campaignLevel.isBoss && gameStatus === 'PLAYING' && (
            <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 rounded text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              SURVIVE: {survivalTimerUI}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-500 uppercase tracking-wider shrink-0 text-[10px]">Power-ups:</span>
          {activePowerUpsUI.length === 0 ? (
            <span className="text-slate-600 italic text-[11px]">No active badges</span>
          ) : (
            activePowerUpsUI.map((p) => {
              let label = 'Shield';
              let color = '#00f3ff';
              if (p.type === 'SHOTGUN') {
                label = 'Shotgun';
                color = '#ff6b00';
              } else if (p.type === 'HOMING_MISSILES') {
                label = 'Rockets';
                color = '#a855f7';
              } else if (p.type === 'WINGMEN') {
                label = 'Wingmen';
                color = '#38bdf8';
              }

              return (
                <div
                  key={p.type}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-slate-900 shrink-0 text-[11px]"
                  style={{ borderColor: color, color }}
                >
                  <span className="font-bold">{label}</span>
                  <span className="font-mono text-slate-300">{p.remainingTime}s</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative w-full max-w-[800px] aspect-[4/3] bg-slate-950 border-x border-b border-cyan-500/30 rounded-b-xl overflow-hidden shadow-2xl shadow-cyan-950/50">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full block touch-none" />

        {/* BROWNING OVERDRIVE ACTION BUTTON */}
        {selectedShip === 'BROWNING' && gameStatus === 'PLAYING' && (
          <button
            onClick={handleTriggerOverdrive}
            disabled={browningOverdriveUI.cooldown > 0}
            className={`absolute bottom-4 right-4 z-20 px-4 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 border shadow-2xl transition-all cursor-pointer ${
              browningOverdriveUI.activeTimer > 0
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-4 ring-rose-500/50 scale-105'
                : browningOverdriveUI.cooldown > 0
                ? 'bg-slate-900/90 text-slate-500 border-slate-800 cursor-not-allowed opacity-80'
                : 'bg-rose-950/90 hover:bg-rose-900 text-rose-300 hover:text-white border-rose-500 hover:border-rose-400 active:scale-95 animate-bounce'
            }`}
          >
            <Zap className={`w-4 h-4 ${browningOverdriveUI.activeTimer > 0 ? 'animate-spin text-amber-300' : 'text-rose-400'}`} />
            <span>
              {browningOverdriveUI.activeTimer > 0
                ? `MEME BEAM: ${(browningOverdriveUI.activeTimer / 60).toFixed(1)}s`
                : browningOverdriveUI.cooldown > 0
                ? `OVERDRIVE: ${(browningOverdriveUI.cooldown / 60).toFixed(1)}s`
                : 'MEME BEAM OVERDRIVE [E]'}
            </span>
          </button>
        )}

        {/* SAVE SLOT SELECTOR OVERLAY */}
        {gameStatus === 'SLOT_SELECT' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in overflow-y-auto">
            <SaveSlotSelector
              onSelectSlot={handleSelectSlot}
              onExitToMenu={handleExitToMenu}
              onLogoClick={handleTitleClick}
              activeSlotId={activeSlotId}
            />
          </div>
        )}

        {/* BROWNING SECRET UNLOCK TOAST BANNER */}
        {unlockToast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-rose-950/95 border-2 border-rose-500 px-6 py-3 rounded-2xl shadow-2xl z-50 animate-bounce flex items-center gap-3 backdrop-blur-md">
            <Sparkles className="w-6 h-6 text-rose-400 animate-spin" />
            <div className="text-left">
              <p className="text-rose-300 font-black text-xs font-mono uppercase tracking-wider">
                ⚡ SECRET BROWNING CHEAT UNLOCKED!
              </p>
              <p className="text-[11px] text-slate-200 font-mono">
                Overlord Chassis now unlocked in Ship Selection!
              </p>
            </div>
          </div>
        )}

        {/* CAMPAIGN MAP MAIN SELECTOR OVERLAY */}
        {gameStatus === 'CAMPAIGN' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-30 animate-fade-in overflow-y-auto">
            <CampaignMap
              onSelectLevel={handleSelectLevel}
              onPlayEndless={handlePlayEndless}
              onChangeSlot={handleSwitchSlot}
              onLogoClick={handleTitleClick}
              activeSlotId={activeSlotId}
            />
          </div>
        )}

        {/* BOSS HEALTH BAR HUD OVERLAY */}
        {bossInfoUI && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-slate-900/90 border border-red-500/50 rounded-lg p-2 backdrop-blur-md z-10 shadow-lg shadow-red-950/50">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-red-400 font-extrabold tracking-wider">{bossInfoUI.name}</span>
              <span className="text-slate-300">
                {bossInfoUI.hp} / {bossInfoUI.maxHp} HP
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, (bossInfoUI.hp / bossInfoUI.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* BOSS APPROACHING WARNING BANNER */}
        {bossWarningUI && (
          <div className="absolute inset-x-0 top-1/3 bg-red-950/90 border-y-2 border-red-500 py-3 text-center z-20 animate-pulse backdrop-blur-sm">
            <p className="text-red-400 font-black tracking-widest text-xl uppercase">⚠️ WARNING: MOTHERSHIP APPROACHING ⚠️</p>
          </div>
        )}

        {/* DEAD RINGER TRIGGERED BANNER */}
        {deadRingerTriggeredUI && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-pink-950/90 border border-pink-500 px-4 py-2 rounded-full text-center z-20 animate-bounce backdrop-blur-sm">
            <p className="text-pink-300 font-extrabold text-sm font-mono tracking-wider">⚡ DEAD RINGER SAVED YOU! ⚡</p>
          </div>
        )}

        {/* OVERDRIVE / MEME BEAM BUTTON OVERLAY */}
        {gameStatus === 'PLAYING' && (selectedShip === 'BROWNING' || selectedShip === 'DEATH') && (
          <button
            onClick={handleTriggerOverdrive}
            className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 border-2 border-white/90 text-white font-black text-[11px] shadow-lg shadow-red-500/50 flex flex-col items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-20 font-mono select-none"
          >
            <span>MEME</span>
            <span>BEAM</span>
            {browningOverdriveUI.cooldown > 0 ? (
              <span className="text-[9px] text-yellow-300 font-bold">
                {Math.ceil(browningOverdriveUI.cooldown / 60)}s
              </span>
            ) : (
              <span className="text-[8px] text-cyan-300 uppercase tracking-tighter">[E] READY</span>
            )}
          </button>
        )}

        {/* PRE-GAME LOADOUT SELECTOR MODAL OVERLAY */}
        {gameStatus === 'PERK_SELECT' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-fade-in overflow-y-auto">
            <LoadoutSelector
              selectedShip={selectedShip}
              onSelectShip={setSelectedShip}
              selectedPerks={selectedPerks}
              onTogglePerk={handleTogglePerk}
              onStartGame={startGame}
              browningUnlocked={browningUnlocked}
              deathUnlocked={deathUnlocked}
              onUnlockDeath={unlockDeathShip}
            />
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {gameStatus === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-1 tracking-wider">
              {campaignLevel.isBoss ? 'CHAPTER CLEARED!' : 'SECTOR VICTORY!'}
            </h2>
            <p className="text-slate-300 text-sm mb-5 font-mono">
              Sector {campaignLevel.chapter}-{campaignLevel.level} successfully defended!
            </p>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 w-full max-w-xs mb-6 shadow-inner space-y-2.5 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Score Earned:</span>
                <span className="text-cyan-300 font-bold text-lg">{score}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">Enemies Destroyed:</span>
                <span className="text-emerald-300 font-bold">{destroyedCount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleNextLevel}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base rounded-xl shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>NEXT MISSION</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleReturnToMap}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-base rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span>CAMPAIGN MAP</span>
              </button>
            </div>
          </div>
        )}

        {/* START / IDLE OVERLAY */}
        {gameStatus === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-400/50 flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 mb-2 tracking-wide uppercase">
              Project Rushdown
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-md mb-6 leading-relaxed">
              Blast square asteroids, collect 8-second power-ups, defeat giant mothership bosses, and customize your ship & perk loadout!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={startGame}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                START GAME
              </button>

              <button
                onClick={() => {
                  gameStatusRef.current = 'PERK_SELECT';
                  setGameStatus('PERK_SELECT');
                }}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-base rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                SHIP & PERKS
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-bold">← / →</span> or{' '}
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-bold">A / D</span>
                <span>Move</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-bold">Spacebar</span>
                <span>Shoot</span>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameStatus === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center mb-4 text-red-400 shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-red-400 mb-2 tracking-wider">GAME OVER</h2>
            <p className="text-slate-400 text-sm mb-6">Your ship was destroyed!</p>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 w-full max-w-xs mb-6 shadow-inner space-y-3 font-mono">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Final Score:</span>
                <span className="text-cyan-300 font-bold text-lg">{score}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">Enemies Destroyed:</span>
                <span className="text-slate-200 font-bold">{destroyedCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">High Score:</span>
                <span className="text-amber-400 font-bold">{highScore}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={startGame}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                PLAY AGAIN
              </button>

              <button
                onClick={() => {
                  gameStatusRef.current = 'PERK_SELECT';
                  setGameStatus('PERK_SELECT');
                }}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-base rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                CHANGE LOADOUT
              </button>
            </div>

            <p className="text-xs text-slate-500 font-mono mt-4">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Space</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd> to restart
            </p>
          </div>
        )}
      </div>

      {/* ONSCREEN TOUCH & MOBILE CONTROLS */}
      <div className="w-full max-w-[800px] mt-4 sm:hidden flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => (touchState.current.left = true)}
            onTouchEnd={() => (touchState.current.left = false)}
            onMouseDown={() => (touchState.current.left = true)}
            onMouseUp={() => (touchState.current.left = false)}
            onMouseLeave={() => (touchState.current.left = false)}
            className="w-16 h-16 bg-slate-800 border border-slate-700 active:bg-cyan-600 rounded-xl flex items-center justify-center text-slate-200 text-2xl font-bold select-none touch-none"
          >
            ←
          </button>
          <button
            onTouchStart={() => (touchState.current.right = true)}
            onTouchEnd={() => (touchState.current.right = false)}
            onMouseDown={() => (touchState.current.right = true)}
            onMouseUp={() => (touchState.current.right = false)}
            onMouseLeave={() => (touchState.current.right = false)}
            className="w-16 h-16 bg-slate-800 border border-slate-700 active:bg-cyan-600 rounded-xl flex items-center justify-center text-slate-200 text-2xl font-bold select-none touch-none"
          >
            →
          </button>
        </div>

        <button
          onTouchStart={() => (touchState.current.shoot = true)}
          onTouchEnd={() => (touchState.current.shoot = false)}
          onMouseDown={() => (touchState.current.shoot = true)}
          onMouseUp={() => (touchState.current.shoot = false)}
          onMouseLeave={() => (touchState.current.shoot = false)}
          className="flex-1 h-16 bg-gradient-to-r from-red-600 to-amber-600 active:from-red-500 active:to-amber-500 rounded-xl font-black text-white tracking-widest text-lg shadow-lg flex items-center justify-center select-none touch-none"
        >
          FIRE
        </button>
      </div>

      {/* DESKTOP FOOTER LEGEND */}
      <div className="hidden sm:flex items-center justify-center gap-8 mt-4 text-xs font-mono text-slate-400">
        <div>
          <span className="text-cyan-400 font-bold">Movement:</span> Left/Right Arrows or A/D keys
        </div>
        <div>
          <span className="text-cyan-400 font-bold">Shoot:</span> Spacebar
        </div>
        <div>
          <span className="text-cyan-400 font-bold">Target:</span> Destroy square asteroids & Mothership bosses
        </div>
      </div>
    </div>
  );
};

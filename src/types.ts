export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ShipType = 'STANDARD' | 'TEXAN' | 'AKIRA' | 'FOEHAMMER' | 'BROWNING' | 'MARTIN' | 'DEATH';

export interface SaveSlotData {
  slotId: number; // 1, 2, 3, 4
  updatedAt: number;
  maxUnlockedChapter: number;
  maxUnlockedLevel: number;
  highScore: number;
  browningUnlocked: boolean;
  deathUnlocked?: boolean;
  selectedShip: ShipType;
  selectedPerks: PerkType[];
  isFreeplay?: boolean;
}

export interface ShipInfo {
  id: ShipType;
  name: string;
  tagline: string;
  description: string;
  color: string;
  accentColor: string;
  stats: {
    hp: number;
    speedText: string;
    damageText: string;
    bulletText: string;
  };
}

export interface Player extends Entity {
  shipType: ShipType;
  hp: number;
  maxHp: number;
  speed: number;
  cooldown: number;
  baseCooldown: number;
  bulletScale: number;
  damageMultiplier: number;
  hasShield: boolean;
  shieldDuration: number; // frames
  deadRingerUsed: boolean;
  invincibleFrames: number;
  lastDamageFrame: number;
  deathShieldCharges?: number;
  deathShieldRegenTimer?: number;
  forgeTimer?: number;
}

export interface InterceptorDrone {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  shootTimer: number;
  lifetime: number;
  maxLifetime: number;
}

export interface Laser extends Entity {
  vy: number;
  vx: number;
  color: string;
  damage: number;
  isTurret?: boolean;
  isPiercing?: boolean;
  hitEnemyIds?: Set<number>;
}

export interface CampaignLevel {
  chapter: number;
  level: number;
  id: string; // "1-1", "1-5", etc.
  title: string;
  isBoss: boolean;
  targetSeconds?: number;
}

export interface HomingMissile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId?: number;
  color: string;
  damage: number;
}

export interface Drone {
  x: number;
  y: number;
  shootTimer: number;
  angle: number;
}

export interface Asteroid extends Entity {
  id: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number; // side length of square
  hp: number;
  maxHp: number;
  color: string;
}

export type EnemyType = 'GUNNER' | 'MISSILE' | 'KAMIKAZE';

export interface BasicEnemy extends Entity {
  id: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  color: string;
  shootTimer: number;
  targetX?: number;
  targetY?: number;
  isCharging?: boolean;
  missileTimer?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  scale: number;
  alpha: number;
  vy: number;
  lifetime: number;
}

export interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  hp: number;
  maxHp: number;
  shootTimer: number;
  color: string;
  name: string;
  isLaserMatrix?: boolean;
  matrixState?: 'IDLE' | 'WARNING' | 'ACTIVE';
  matrixTimer?: number;
  gridRows?: number[];
  gridCols?: number[];
  isSwarmBoss?: boolean;
  swarmAngle?: number;
  isCorruptedBrowning?: boolean;
  hasTriggeredDeadRinger?: boolean;
  deadRingerInvincibleFrames?: number;
  spiralAngle?: number;
  isTrackerBoss?: boolean;
  isSplitterBoss?: boolean;
  isRushdownPrime?: boolean;
  isPlutoBoss?: boolean;
  plutoPhase?: 1 | 2 | 3;
  plutoLaserAngle?: number;
  splitterTimer?: number;
  isAlsaceBoss?: boolean;
  isOmegaOverlord?: boolean;
  isRushdownApex?: boolean;
}

export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isSplitter?: boolean;
  isClusterBomb?: boolean;
}

export type PowerUpType = 'SHIELD' | 'SHOTGUN' | 'HOMING_MISSILES' | 'NUKE' | 'WINGMEN';

export interface PowerUpItem extends Entity {
  type: PowerUpType;
  vy: number;
  rotation: number;
  color: string;
  label: string;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number; // in seconds
  maxTime: number;
}

export type PerkType = 'DEAD_RINGER' | 'SPEEDSTER' | 'GLASS_CANNON' | 'MAGNET' | 'EXTRA_TURRET';

export interface PerkInfo {
  id: PerkType;
  name: string;
  description: string;
  iconName: string;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  isSquare?: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export type GameStatus = 'IDLE' | 'PLAYING' | 'GAMEOVER';

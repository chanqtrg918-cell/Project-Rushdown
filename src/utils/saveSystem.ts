import { SaveSlotData } from '../types';

const SAVE_PREFIX = 'rushdown_save_slot_';
const ACTIVE_SLOT_KEY = 'rushdown_active_slot_id';

export const DEFAULT_SLOT_DATA = (slotId: number): SaveSlotData => {
  if (slotId === 4) {
    return {
      slotId: 4,
      updatedAt: Date.now(),
      maxUnlockedChapter: 5,
      maxUnlockedLevel: 5,
      highScore: 0,
      browningUnlocked: true,
      deathUnlocked: true,
      selectedShip: 'STANDARD',
      selectedPerks: [],
      isFreeplay: true,
    };
  }
  return {
    slotId,
    updatedAt: 0,
    maxUnlockedChapter: 1,
    maxUnlockedLevel: 1,
    highScore: 0,
    browningUnlocked: false,
    deathUnlocked: false,
    selectedShip: 'STANDARD',
    selectedPerks: [],
    isFreeplay: false,
  };
};

export function isFreeplayUnlocked(): boolean {
  // Check slots 1, 2, 3 or legacy localStorage key
  for (const id of [1, 2, 3]) {
    const dataStr = localStorage.getItem(`${SAVE_PREFIX}${id}`);
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        if (
          parsed.maxUnlockedChapter > 5 ||
          (parsed.maxUnlockedChapter === 5 && parsed.maxUnlockedLevel >= 5)
        ) {
          return true;
        }
      } catch {
        // ignore
      }
    }
  }

  const savedLegacy = localStorage.getItem('rushdown_campaign_max_unlocked');
  if (savedLegacy) {
    const [c, l] = savedLegacy.split('-').map(Number);
    if (c > 5 || (c === 5 && l >= 5)) return true;
  }

  return false;
}

export function getActiveSlotId(): number | null {
  const saved = localStorage.getItem(ACTIVE_SLOT_KEY);
  if (!saved) return null;
  const num = parseInt(saved, 10);
  return isNaN(num) ? null : num;
}

export function setActiveSlotId(slotId: number | null): void {
  if (slotId === null) {
    localStorage.removeItem(ACTIVE_SLOT_KEY);
  } else {
    localStorage.setItem(ACTIVE_SLOT_KEY, slotId.toString());
  }
}

export function loadSaveSlot(slotId: number): SaveSlotData {
  const dataStr = localStorage.getItem(`${SAVE_PREFIX}${slotId}`);
  if (!dataStr) {
    return DEFAULT_SLOT_DATA(slotId);
  }
  try {
    const parsed = JSON.parse(dataStr);
    return {
      ...DEFAULT_SLOT_DATA(slotId),
      ...parsed,
      slotId,
    };
  } catch (e) {
    console.error('Error loading save slot:', e);
    return DEFAULT_SLOT_DATA(slotId);
  }
}

export function saveSaveSlot(slotData: SaveSlotData): void {
  const updatedData = {
    ...slotData,
    updatedAt: Date.now(),
  };
  localStorage.setItem(`${SAVE_PREFIX}${slotData.slotId}`, JSON.stringify(updatedData));
}

export function clearSaveSlot(slotId: number): SaveSlotData {
  localStorage.removeItem(`${SAVE_PREFIX}${slotId}`);
  const fresh = DEFAULT_SLOT_DATA(slotId);
  return fresh;
}

export function getAllSaveSlots(): SaveSlotData[] {
  return [1, 2, 3, 4].map((id) => loadSaveSlot(id));
}

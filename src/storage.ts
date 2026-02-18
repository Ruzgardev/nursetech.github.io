import type { AppState, Room } from './types'

const STORAGE_KEY = 'nurse-assignment-state'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const rooms: Room[] = (parsed.rooms ?? []).map((r: Room) => ({
        id: r.id || crypto.randomUUID(),
        roomCode: r.roomCode ?? '',
        beds: Math.min(3, Math.max(1, r.beds ?? 2)) as 1 | 2 | 3,
        patients: Math.min(r.beds ?? 2, Math.max(0, r.patients ?? r.beds ?? 2)),
        infected: !!r.infected,
        avoidInfected: !!r.avoidInfected,
        infusion24h: Math.min(r.patients ?? 0, Math.max(0, r.infusion24h ?? 0)),
        infusionTotal: Math.min(20, Math.max(0, r.infusionTotal ?? 0)),
      }))
      return {
        serviceMode: 'infection_transplant' as const,
        nurseCount: Math.min(6, Math.max(2, parsed.nurseCount ?? 4)),
        infectedNurseLimit: parsed.infectedNurseLimit === 2 ? 2 : 1,
        rooms,
      }
    }
  } catch {
    // ignore
  }
  return {
    serviceMode: 'infection_transplant' as const,
    nurseCount: 4,
    infectedNurseLimit: 1,
    rooms: [],
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

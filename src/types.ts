export type Room = {
  id: string
  roomCode: string
  beds: 1 | 2 | 3
  patients: number
  infected: boolean
  avoidInfected: boolean
  infusion24h: number
  infusionTotal: number
}

export type NurseAssignment = {
  nurseIndex: number
  roomIds: string[]
  roomCodes: string[]
  patientsTotal: number
  infectedRoomsCount: number
  avoidInfectedRoomsCount: number
  infusion24hCount: number
  infusionCountTotal: number
}

export type SolverResult = {
  success: boolean
  assignments: NurseAssignment[]
  infeasibleReason?: string
  warnings: string[]
  diagnostics?: {
    patientsGap: number
    infusion24hGap: number
    infusionTotalGap: number
  }
}

export type ServiceMode = 'standard' | 'infection_transplant'

export type AppState = {
  serviceMode: ServiceMode
  nurseCount: number
  infectedNurseLimit: 1 | 2
  rooms: Room[]
}

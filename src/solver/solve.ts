import type { Room, NurseAssignment, SolverResult } from '../types'

const W0 = 5  // hasta sayısı dengesi
const W1 = 5  // infusion24h dengesi
const W2 = 3  // infusionTotal dengesi
const W3 = 1  // proximity
const MAX_IMPROVE_ITERATIONS = 200

function parseProximityKey(roomCode: string, index: number): number {
  const match = roomCode.match(/\d+/)
  return match ? parseInt(match[0], 10) : index
}

type InternalRoom = {
  id: string
  roomCode: string
  proximityKey: number
  patients: number
  infected: boolean
  avoidInfected: boolean
  infusion24h: number
  infusionTotal: number
}

function buildInternalRooms(rooms: Room[]): InternalRoom[] {
  return rooms
    .filter((r) => r.patients > 0)
    .map((r, i) => ({
      id: r.id,
      roomCode: r.roomCode,
      proximityKey: parseProximityKey(r.roomCode, i),
      patients: r.patients,
      infected: r.infected,
      avoidInfected: r.avoidInfected,
      infusion24h: r.infusion24h,
      infusionTotal: r.infusionTotal,
    }))
}

function validateHardConstraints(
  assignments: { infectedRoomsCount: number; avoidInfectedRoomsCount: number; nurseIndex: number }[],
  infectedNurseLimit: number
): { valid: boolean; reason?: string } {
  let nursesWithInfected = 0
  for (const a of assignments) {
    if (a.infectedRoomsCount > 0) {
      nursesWithInfected++
      if (a.avoidInfectedRoomsCount > 0) {
        return {
          valid: false,
          reason: `Hemşire ${a.nurseIndex + 1} hem enfekte hem de nakil/kaçınma hastası içeriyor.`,
        }
      }
    }
  }
  if (nursesWithInfected > infectedNurseLimit) {
    return {
      valid: false,
      reason: `Enfekte hastalar en fazla ${infectedNurseLimit} hemşirede toplanmalı; ${nursesWithInfected} hemşireye atanmış. infectedNurseLimit=2 yapmayı deneyin.`,
    }
  }
  return { valid: true }
}

function computeTotals(
  roomIds: string[],
  roomMap: Map<string, InternalRoom>
): {
  patientsTotal: number
  infectedRoomsCount: number
  avoidInfectedRoomsCount: number
  infusion24hCount: number
  infusionCountTotal: number
  roomCodes: string[]
} {
  let patientsTotal = 0
  let infectedRoomsCount = 0
  let avoidInfectedRoomsCount = 0
  let infusion24hCount = 0
  let infusionCountTotal = 0
  for (const id of roomIds) {
    const r = roomMap.get(id)
    if (r) {
      patientsTotal += r.patients
      if (r.infected) infectedRoomsCount++
      if (r.avoidInfected) avoidInfectedRoomsCount++
      infusion24hCount += r.infusion24h
      infusionCountTotal += r.infusionTotal
    }
  }
  const sortedIds = [...roomIds].sort(
    (a, b) => (roomMap.get(a)?.proximityKey ?? 0) - (roomMap.get(b)?.proximityKey ?? 0)
  )
  const roomCodes = sortedIds.map((id) => roomMap.get(id)?.roomCode ?? id)
  return {
    patientsTotal,
    infectedRoomsCount,
    avoidInfectedRoomsCount,
    infusion24hCount,
    infusionCountTotal,
    roomCodes,
  }
}

function proximityPenalty(room: InternalRoom, nurseRoomIds: string[], roomMap: Map<string, InternalRoom>): number {
  if (nurseRoomIds.length === 0) return 0
  let minDist = Infinity
  for (const id of nurseRoomIds) {
    const r = roomMap.get(id)
    if (r) {
      const d = Math.abs(room.proximityKey - r.proximityKey)
      if (d < minDist) minDist = d
    }
  }
  return minDist
}

function computeImbalanceScore(
  assignments: { patientsTotal: number; infusion24hCount: number; infusionCountTotal: number }[]
): number {
  const imbP = assignments.map((a) => a.patientsTotal)
  const imb24 = assignments.map((a) => a.infusion24hCount)
  const imbC = assignments.map((a) => a.infusionCountTotal)
  const gapP = Math.max(...imbP) - Math.min(...imbP)
  const gap24 = Math.max(...imb24) - Math.min(...imb24)
  const gapC = Math.max(...imbC) - Math.min(...imbC)
  return W0 * gapP + W1 * gap24 + W2 * gapC
}

export function solve(rooms: Room[], nurseCount: number, infectedNurseLimit: 1 | 2): SolverResult {
  const internal = buildInternalRooms(rooms)
  const roomMap = new Map(internal.map((r) => [r.id, r]))

  if (internal.length === 0) {
    return {
      success: true,
      assignments: Array.from({ length: nurseCount }, (_, i) => ({
        nurseIndex: i,
        roomIds: [],
        roomCodes: [],
        patientsTotal: 0,
        infectedRoomsCount: 0,
        avoidInfectedRoomsCount: 0,
        infusion24hCount: 0,
        infusionCountTotal: 0,
      })),
      warnings: ['Hasta sayısı > 0 olan oda yok.'],
      diagnostics: { patientsGap: 0, infusion24hGap: 0, infusionTotalGap: 0 },
    }
  }

  const infectedRooms = internal.filter((r) => r.infected)
  const avoidInfectedRooms = internal.filter((r) => r.avoidInfected)
  const remainingIds = new Set(
    internal.filter((r) => !r.infected && !r.avoidInfected).map((r) => r.id)
  )

  if (infectedRooms.length > 0 && avoidInfectedRooms.length > 0 && nurseCount < 2) {
    return {
      success: false,
      infeasibleReason:
        'Enfekte ve nakil/kaçınma hastaları var; ayrılmaları için en az 2 hemşire gerekli.',
      assignments: [],
      warnings: [],
    }
  }

  const nurseRoomIds: string[][] = Array.from({ length: nurseCount }, () => [])

  if (infectedRooms.length > 0) {
    const sortedInfected = [...infectedRooms].sort((a, b) => a.proximityKey - b.proximityKey)
    if (infectedNurseLimit === 1 || sortedInfected.length === 1) {
      nurseRoomIds[0] = sortedInfected.map((r) => r.id)
    } else {
      const mid = Math.ceil(sortedInfected.length / 2)
      nurseRoomIds[0] = sortedInfected.slice(0, mid).map((r) => r.id)
      nurseRoomIds[1] = sortedInfected.slice(mid).map((r) => r.id)
    }

    let bestStart = 0
    if (infectedNurseLimit === 1) {
      let bestScore = Infinity
      for (let n = 0; n < nurseCount; n++) {
        const temp = nurseRoomIds.map((r) => [...r])
        nurseRoomIds[n] = sortedInfected.map((r) => r.id)
        const as = nurseRoomIds.map((ids, i) => {
          const t = computeTotals(ids, roomMap) as NurseAssignment
          t.nurseIndex = i
          t.roomIds = ids
          return t
        })
        const score = computeImbalanceScore(as)
        if (score < bestScore) {
          bestScore = score
          bestStart = n
        }
        nurseRoomIds[n] = temp[n]
      }
      nurseRoomIds.fill([])
      nurseRoomIds[bestStart] = sortedInfected.map((r) => r.id)
    }
  }

  const infectedNurseSet = new Set<number>()
  for (let i = 0; i < nurseCount; i++) {
    if (nurseRoomIds[i].some((id) => roomMap.get(id)?.infected)) {
      infectedNurseSet.add(i)
    }
  }

  const nonInfectedNurses = Array.from({ length: nurseCount }, (_, i) => i).filter(
    (i) => !infectedNurseSet.has(i)
  )

  if (avoidInfectedRooms.length > 0) {
    if (nonInfectedNurses.length === 0) {
      return {
        success: false,
        infeasibleReason:
          'Nakil/kaçınma hastaları atanacak enfekte olmayan hemşire yok. Enfekte ve nakil ayrışması mümkün değil.',
        assignments: [],
        warnings: [],
      }
    }
    const sortedAvoid = [...avoidInfectedRooms].sort((a, b) => a.proximityKey - b.proximityKey)
    for (let i = 0; i < sortedAvoid.length; i++) {
      const nurseIdx = nonInfectedNurses[i % nonInfectedNurses.length]
      nurseRoomIds[nurseIdx].push(sortedAvoid[i].id)
    }
  }

  const sortedRemaining = [...remainingIds]
    .map((id) => roomMap.get(id)!)
    .filter(Boolean)
    .sort((a, b) => a.proximityKey - b.proximityKey)

  for (const room of sortedRemaining) {
    let bestNurse = 0
    let bestScore = Infinity

    for (let n = 0; n < nurseCount; n++) {
      nurseRoomIds[n].push(room.id)
      const assignments = nurseRoomIds.map((ids, i) => {
        const t = computeTotals(ids, roomMap) as NurseAssignment
        t.nurseIndex = i
        t.roomIds = ids
        return t
      })
      const imb = computeImbalanceScore(assignments)
      const prox = W3 * proximityPenalty(room, nurseRoomIds[n].filter((x) => x !== room.id), roomMap)
      const score = imb + prox
      nurseRoomIds[n].pop()
      if (score < bestScore) {
        bestScore = score
        bestNurse = n
      }
    }
    nurseRoomIds[bestNurse].push(room.id)
  }

  for (let iter = 0; iter < MAX_IMPROVE_ITERATIONS; iter++) {
    let improved = false
    for (let n1 = 0; n1 < nurseCount; n1++) {
      for (let n2 = 0; n2 < nurseCount; n2++) {
        if (n1 === n2) continue
        const rooms1 = nurseRoomIds[n1]
        const rooms2 = nurseRoomIds[n2]
        for (const id1 of rooms1) {
          const r1 = roomMap.get(id1)!
          for (const id2 of rooms2) {
            const r2 = roomMap.get(id2)!
            if ((r1.infected && r2.avoidInfected) || (r1.avoidInfected && r2.infected)) continue
            if (r1.infected && r2.infected && infectedNurseLimit === 1) continue

            const beforeA = nurseRoomIds.map((ids, i) => {
              const t = computeTotals(ids, roomMap) as NurseAssignment
              t.nurseIndex = i
              t.roomIds = ids
              return t
            })
            const scoreBefore = computeImbalanceScore(beforeA)

            nurseRoomIds[n1] = rooms1.filter((x) => x !== id1).concat([id2])
            nurseRoomIds[n2] = rooms2.filter((x) => x !== id2).concat([id1])

            const afterA = nurseRoomIds.map((ids, i) => {
              const t = computeTotals(ids, roomMap) as NurseAssignment
              t.nurseIndex = i
              t.roomIds = ids
              return t
            })
            const valid = validateHardConstraints(
              afterA.map((a) => ({
                infectedRoomsCount: a.infectedRoomsCount,
                avoidInfectedRoomsCount: a.avoidInfectedRoomsCount,
                nurseIndex: a.nurseIndex,
              })),
              infectedNurseLimit
            )
            if (!valid.valid) {
              nurseRoomIds[n1] = rooms1
              nurseRoomIds[n2] = rooms2
              continue
            }
            const scoreAfter = computeImbalanceScore(afterA)
            if (scoreAfter < scoreBefore) {
              improved = true
            } else {
              nurseRoomIds[n1] = rooms1
              nurseRoomIds[n2] = rooms2
            }
          }
        }
      }
    }
    if (!improved) break
  }

  const finalAssignments: NurseAssignment[] = nurseRoomIds.map((ids, i) => {
    const t = computeTotals(ids, roomMap)
    return {
      nurseIndex: i,
      roomIds: ids,
      roomCodes: t.roomCodes as string[],
      patientsTotal: t.patientsTotal,
      infectedRoomsCount: t.infectedRoomsCount,
      avoidInfectedRoomsCount: t.avoidInfectedRoomsCount,
      infusion24hCount: t.infusion24hCount,
      infusionCountTotal: t.infusionCountTotal,
    }
  })

  const validation = validateHardConstraints(
    finalAssignments.map((a) => ({
      infectedRoomsCount: a.infectedRoomsCount,
      avoidInfectedRoomsCount: a.avoidInfectedRoomsCount,
      nurseIndex: a.nurseIndex,
    })),
    infectedNurseLimit
  )
  if (!validation.valid) {
    return {
      success: false,
      infeasibleReason: validation.reason,
      assignments: [],
      warnings: [],
    }
  }

  const imbP = finalAssignments.map((a) => a.patientsTotal)
  const imb24 = finalAssignments.map((a) => a.infusion24hCount)
  const imbC = finalAssignments.map((a) => a.infusionCountTotal)
  const gapP = Math.max(...imbP) - Math.min(...imbP)
  const gap24 = Math.max(...imb24) - Math.min(...imb24)
  const gapC = Math.max(...imbC) - Math.min(...imbC)

  const warnings: string[] = []
  if (gapP > 2) warnings.push(`Hasta sayısı dengesizliği: max-min farkı ${gapP}`)
  if (gap24 > 2) warnings.push(`24h infüzyon dengesizliği: max-min farkı ${gap24}`)
  if (gapC > 5) warnings.push(`Toplam infüzyon dengesizliği: max-min farkı ${gapC}`)

  return {
    success: true,
    assignments: finalAssignments,
    warnings,
    diagnostics: { patientsGap: gapP, infusion24hGap: gap24, infusionTotalGap: gapC },
  }
}

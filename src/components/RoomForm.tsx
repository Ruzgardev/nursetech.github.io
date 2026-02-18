import { useState, useEffect, useCallback } from 'react'
import type { Room, ServiceMode } from '../types'

type Props = {
  room?: Room | null
  existingCodes: string[]
  serviceMode: ServiceMode
  onSave: (room: Omit<Room, 'id'> & { id?: string }) => void
  onCancel: () => void
}

export function RoomForm({ room, existingCodes, serviceMode, onSave, onCancel }: Props) {
  const isEdit = !!room
  const [roomCode, setRoomCode] = useState(room?.roomCode ?? '')
  const [beds, setBeds] = useState<1 | 2 | 3>(room?.beds ?? 2)
  const [patients, setPatients] = useState(room?.patients ?? room?.beds ?? 2)
  const [infected, setInfected] = useState(room?.infected ?? false)
  const [avoidInfected, setAvoidInfected] = useState(room?.avoidInfected ?? false)
  const [infusion24h, setInfusion24h] = useState(room?.infusion24h ?? 0)
  const [infusionTotal, setInfusionTotal] = useState(room?.infusionTotal ?? 0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (infected && avoidInfected) setAvoidInfected(false)
  }, [infected])

  const handleSubmit = useCallback(() => {
    const code = roomCode.trim()
    if (!code) {
      setError('Oda kodu gerekli')
      return
    }
    const others = isEdit ? existingCodes.filter((c) => c !== room!.roomCode) : existingCodes
    if (others.includes(code)) {
      setError('Bu oda kodu zaten kullanılıyor')
      return
    }
    if (patients > beds) {
      setError('Hasta sayısı yatak sayısından fazla olamaz')
      return
    }
    if (infusion24h > patients) {
      setError('24h infüzyon hasta sayısından fazla olamaz')
      return
    }
    setError('')
    onSave({
      id: room?.id,
      roomCode: code,
      beds,
      patients,
      infected: serviceMode === 'infection_transplant' ? infected : false,
      avoidInfected: serviceMode === 'infection_transplant' && !infected ? avoidInfected : false,
      infusion24h,
      infusionTotal: Math.min(20, Math.max(0, infusionTotal)),
    })
  }, [
    roomCode,
    beds,
    patients,
    infected,
    avoidInfected,
    infusion24h,
    infusionTotal,
    room,
    isEdit,
    existingCodes,
    serviceMode,
    onSave,
  ])

  useEffect(() => {
    if (patients > beds) setPatients(beds)
  }, [beds])

  useEffect(() => {
    if (infusion24h > patients) setInfusion24h(patients)
  }, [patients])

  const showSpecial = serviceMode === 'infection_transplant'

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal">
        <h3>{isEdit ? 'Odayı düzenle' : 'Oda ekle'}</h3>
        {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
        {showSpecial && infected && avoidInfected && (
          <div className="alert alert-warning" style={{ marginBottom: '0.75rem' }}>
            Enfekte ve nakil aynı odada olamaz; nakil kapatıldı.
          </div>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label>Oda kodu</label>
            <input
              type="text"
              placeholder="24/2, 12A, 305-B"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Yatak (1–3)</label>
            <select value={beds} onChange={(e) => setBeds(Number(e.target.value) as 1 | 2 | 3)}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <div className="form-group">
            <label>Hasta (0–{beds})</label>
            <input
              type="number"
              min={0}
              max={beds}
              value={patients}
              onChange={(e) => setPatients(Math.min(beds, Math.max(0, parseInt(e.target.value, 10) || 0)))}
            />
          </div>
          {showSpecial && (
            <>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="infected"
                  checked={infected}
                  onChange={(e) => setInfected(e.target.checked)}
                />
                <label htmlFor="infected" style={{ margin: 0 }}>Enfekte</label>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="avoidInfected"
                  checked={avoidInfected}
                  disabled={infected}
                  onChange={(e) => setAvoidInfected(e.target.checked)}
                />
                <label htmlFor="avoidInfected" style={{ margin: 0 }}>Nakil / kaçınma</label>
              </div>
            </>
          )}
          <div className="form-group">
            <label>24h infüzyon (0–{patients})</label>
            <input
              type="number"
              min={0}
              max={patients}
              value={infusion24h}
              onChange={(e) =>
                setInfusion24h(Math.min(patients, Math.max(0, parseInt(e.target.value, 10) || 0)))
              }
            />
          </div>
          <div className="form-group">
            <label>Toplam infüzyon (0–20)</label>
            <input
              type="number"
              min={0}
              max={20}
              value={infusionTotal}
              onChange={(e) =>
                setInfusionTotal(Math.min(20, Math.max(0, parseInt(e.target.value, 10) || 0)))
              }
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            İptal
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

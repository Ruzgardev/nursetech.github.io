import { useState, useEffect, useCallback } from 'react'
import { solve } from './solver/solve'
import { loadState, saveState } from './storage'
import { RoomForm } from './components/RoomForm'
import { RoomTable } from './components/RoomTable'
import { Results } from './components/Results'
import type { Room } from './types'

function generateId(): string {
  return crypto.randomUUID()
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [result, setResult] = useState<ReturnType<typeof solve> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Room | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  const handleSaveRoom = useCallback(
    (data: Omit<Room, 'id'> & { id?: string }) => {
      if (editingRoom) {
        setState((s) => ({
          ...s,
          rooms: s.rooms.map((r) =>
            r.id === editingRoom.id ? { ...r, ...data, id: r.id } : r
          ),
        }))
        setEditingRoom(null)
      } else {
        setState((s) => ({
          ...s,
          rooms: [...s.rooms, { ...data, id: generateId() } as Room],
        }))
      }
      setShowForm(false)
    },
    [editingRoom]
  )

  const handleDelete = useCallback((room: Room) => {
    setDeleteConfirm(room)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteConfirm) {
      setState((s) => ({ ...s, rooms: s.rooms.filter((r) => r.id !== deleteConfirm.id) }))
      setDeleteConfirm(null)
    }
  }, [deleteConfirm])

  return (
    <div>
      <header className="app-header">
        <h1>Hemşire Hasta Atama</h1>
        <p className="app-subtitle">
          Servis odaları için yük dengelemeli hemşire ataması
        </p>
      </header>

      <div className="card">
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          Enfekte hastalar en fazla {state.infectedNurseLimit} hemşirede toplanır; nakil/avoid enfekte hemşireye verilemez.
        </div>

        <div
          className="controls"
          style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}
        >
          <div className="control-group">
            <label>Hemşire sayısı</label>
            <select
              value={state.nurseCount}
              onChange={(e) => setState((s) => ({ ...s, nurseCount: Number(e.target.value) }))}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Enfekte hemşire limiti</label>
            <select
              value={state.infectedNurseLimit}
              onChange={(e) =>
                setState((s) => ({ ...s, infectedNurseLimit: Number(e.target.value) as 1 | 2 }))
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <div className="controls-spacer" />
          <button
            className="btn-primary"
            onClick={() => setResult(solve(state.rooms, state.nurseCount, state.infectedNurseLimit))}
          >
            Çöz
          </button>
          <button
            className="btn-secondary"
            onClick={() => { setState((s) => ({ ...s, serviceMode: 'infection_transplant', nurseCount: 4, infectedNurseLimit: 1, rooms: [] })); setResult(null); }}
          >
            Sıfırla
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Odalar</h2>
          <button className="btn-primary" onClick={() => { setEditingRoom(null); setShowForm(true); }}>
            + Oda ekle
          </button>
        </div>

        <RoomTable
          rooms={state.rooms}
          serviceMode={state.serviceMode}
          onEdit={(r) => { setEditingRoom(r); setShowForm(true); }}
          onDelete={handleDelete}
        />
      </div>

      {result && <Results result={result} serviceMode={state.serviceMode} />}

      {showForm && (
        <RoomForm
          room={editingRoom}
          existingCodes={editingRoom
            ? state.rooms.filter((r) => r.id !== editingRoom.id).map((r) => r.roomCode)
            : state.rooms.map((r) => r.roomCode)}
          serviceMode={state.serviceMode}
          onSave={handleSaveRoom}
          onCancel={() => { setShowForm(false); setEditingRoom(null); }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal">
            <h3>Odayı sil</h3>
            <p style={{ margin: '0 0 1rem' }}>
              <strong>{deleteConfirm.roomCode}</strong> odasını silmek istediğinize emin misiniz?
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                İptal
              </button>
              <button className="btn-primary" onClick={confirmDelete} style={{ background: 'var(--error)' }}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

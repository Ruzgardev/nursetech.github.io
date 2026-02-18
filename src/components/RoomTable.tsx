import type { Room, ServiceMode } from '../types'

type Props = {
  rooms: Room[]
  serviceMode: ServiceMode
  onEdit: (room: Room) => void
  onDelete: (room: Room) => void
}

export function RoomTable({ rooms, serviceMode, onEdit, onDelete }: Props) {
  const showSpecial = serviceMode === 'infection_transplant'

  if (rooms.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
        Henüz oda eklenmedi. + Oda ekle butonuna tıklayın.
      </p>
    )
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Oda</th>
            {showSpecial && (
              <>
                <th>Enfekte</th>
                <th>Nakil</th>
              </>
            )}
            <th>24h inf.</th>
            <th>Top. inf.</th>
            <th style={{ width: 120 }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td style={{ fontWeight: 500 }}>{room.roomCode}</td>
              {showSpecial && (
                <>
                  <td>
                    {room.infected ? (
                      <span className="badge badge-infected">Evet</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {room.avoidInfected ? (
                      <span className="badge badge-avoid">Evet</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </>
              )}
              <td>{room.infusion24h}</td>
              <td>{room.infusionTotal}</td>
              <td className="room-actions">
                <button className="btn-secondary btn-sm" onClick={() => onEdit(room)}>
                  Düzenle
                </button>
                <button className="btn-secondary btn-sm" onClick={() => onDelete(room)}>
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

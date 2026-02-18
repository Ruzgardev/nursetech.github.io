import type { SolverResult, ServiceMode } from '../types'

type Props = {
  result: SolverResult
  serviceMode: ServiceMode
}

export function Results({ result, serviceMode }: Props) {
  const showSpecial = serviceMode === 'infection_transplant'

  return (
    <div className="card">
      <h2>Sonuçlar</h2>
      {!result.success && result.infeasibleReason && (
        <div className="alert alert-error">
          <strong>Çözüm bulunamadı</strong> — {result.infeasibleReason}
        </div>
      )}
      {result.success && result.warnings.length > 0 && (
        <div className="alert alert-warning">
          {result.warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
      {result.success && result.diagnostics && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
          Tanı: hasta farkı {result.diagnostics.patientsGap}, 24h infüzyon farkı{' '}
          {result.diagnostics.infusion24hGap}, toplam infüzyon farkı{' '}
          {result.diagnostics.infusionTotalGap}
        </p>
      )}
      {result.success && result.assignments.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {result.assignments.map((a) => (
            <div key={a.nurseIndex} className="card" style={{ marginBottom: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {a.nurseIndex + 1}
                </span>
                <strong>Hemşire {a.nurseIndex + 1}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Odalar: {a.roomCodes.length > 0 ? a.roomCodes.join(', ') : '—'}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  fontSize: '0.85rem',
                }}
              >
                <span>Hasta: {a.patientsTotal}</span>
                {showSpecial && (
                  <>
                    <span>Enfekte: {a.infectedRoomsCount}</span>
                    <span>Nakil/kaçınma: {a.avoidInfectedRoomsCount}</span>
                  </>
                )}
                <span>24h infüzyon: {a.infusion24hCount}</span>
                <span>Toplam infüzyon: {a.infusionCountTotal}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

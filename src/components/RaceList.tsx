import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { ParsedRace } from '../lib/parseRecording'
import { joinExportText } from '../lib/parseRecording'

type RaceListProps = {
  races: ParsedRace[]
  sourceBaseName: string
}

function formatTickSpan(span: number | null): string {
  if (span === null) return '—'
  return span.toLocaleString()
}

export function RaceList({ races, sourceBaseName }: RaceListProps) {
  const downloadOne = (race: ParsedRace) => {
    const name = `race-${race.index}-${race.safeSlug}.txt`
    const blob = new Blob([joinExportText(race.exportLines)], {
      type: 'text/plain;charset=utf-8',
    })
    saveAs(blob, name)
  }

  const downloadZip = async () => {
    const zip = new JSZip()
    for (const race of races) {
      const name = `race-${race.index}-${race.safeSlug}.txt`
      zip.file(name, joinExportText(race.exportLines))
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const zipName = `${sourceBaseName || 'recording'}-split.zip`
    saveAs(blob, zipName)
  }

  return (
    <div className="race-list">
      <div className="race-list__toolbar">
        <h2 className="race-list__heading">Races ({races.length})</h2>
        <button type="button" className="btn btn--primary" onClick={() => void downloadZip()}>
          Download all (ZIP)
        </button>
      </div>
      <div className="table-wrap">
        <table className="race-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Race</th>
              <th scope="col" className="num">
                Messages
              </th>
              <th scope="col" className="num">
                Tick span
              </th>
              <th scope="col">Download</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => (
              <tr key={race.index}>
                <td>{race.index}</td>
                <td className="race-table__name">{race.displayName}</td>
                <td className="num">{race.messageCount.toLocaleString()}</td>
                <td className="num">{formatTickSpan(race.tickSpan)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => downloadOne(race)}
                  >
                    .txt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

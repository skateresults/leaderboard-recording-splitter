import { useCallback, useMemo, useState } from 'react'
import { FileDropzone } from './components/FileDropzone'
import { RaceList } from './components/RaceList'
import { parseRecording } from './lib/parseRecording'
import './App.css'

function baseNameFromPath(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name || 'recording'
}

export default function App() {
  const [loadedName, setLoadedName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [fileText, setFileText] = useState<string | null>(null)

  const onFileText = useCallback((text: string, name: string) => {
    setParseError(null)
    if (name === '' && text === '') {
      setParseError('Could not read that file.')
      setFileText(null)
      setLoadedName(null)
      return
    }
    setFileText(text)
    setLoadedName(name || 'recording.txt')
  }, [])

  const result = useMemo(() => {
    if (fileText === null) return null
    return parseRecording(fileText)
  }, [fileText])

  const sourceBase = loadedName ? baseNameFromPath(loadedName) : 'recording'

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Recording splitter</h1>
      </header>

      <FileDropzone onFileText={onFileText} />

      {parseError && <p className="app__message app__message--error">{parseError}</p>}

      {result?.kind === 'empty' && (
        <p className="app__message app__message--warn">This file is empty. Choose a non-empty recording.</p>
      )}

      {result?.kind === 'no-races' && (
        <p className="app__message app__message--warn">
          No races found. The recording must contain at least one <code>$B</code> (race start) message.
        </p>
      )}

      {result?.kind === 'ok' && (
        <RaceList races={result.races} sourceBaseName={sourceBase} />
      )}

      {loadedName && result?.kind === 'ok' && (
        <p className="app__meta">Loaded: {loadedName}</p>
      )}
    </div>
  )
}

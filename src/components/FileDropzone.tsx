import { useCallback, useId, useState } from 'react'

type FileDropzoneProps = {
  onFileText: (text: string, fileName: string) => void
  disabled?: boolean
}

export function FileDropzone({ onFileText, disabled }: FileDropzoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled) return
      const file = files[0]
      try {
        const text = await file.text()
        onFileText(text, file.name)
      } catch {
        onFileText('', '')
      }
    },
    [disabled, onFileText],
  )

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone--active' : ''} ${disabled ? 'dropzone--disabled' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        void handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        id={inputId}
        type="file"
        accept=".txt,text/plain,*/*"
        className="dropzone__input"
        disabled={disabled}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <label htmlFor={inputId} className="dropzone__label">
        <span className="dropzone__title">Drop a recording file here</span>
        <span className="dropzone__hint">or click to choose — plain text, one message per line</span>
      </label>
    </div>
  )
}

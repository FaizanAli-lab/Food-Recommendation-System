import React, { useState, useRef } from 'react'
import { recognizeImage } from '../services/api'

export default function ImageUpload({ onResults }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const handleRecognize = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const data = await recognizeImage(fd)
      setResult(data)
      if (data.matched_food) {
        const recs = [{ food: data.matched_food, score: data.confidence / 100, reason: 'Detected from image' }]
        if (data.alternatives?.length) {
          data.alternatives.forEach((f) => recs.push({ food: f, score: 0.8, reason: 'Healthier alternative' }))
        }
        onResults(recs, 'image')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Recognition failed. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div style={{ position: 'relative' }}>
            <img
              src={preview}
              alt="Food preview"
              style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 12, objectFit: 'cover', display: 'block', margin: '0 auto' }}
            />
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
              background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(8px)',
            }}>
              📸 Ready
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>📷</div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Drop a food image here
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              JPG, PNG, or WebP 
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Pipeline explanation */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
         
        ].map(({ step, label, color }) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', background: color,
              color: '#000', fontSize: '0.7rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{step}</span>
            {label}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: 'hsla(0,74%,58%,0.1)', border: '1px solid hsla(0,74%,58%,0.3)',
          color: 'var(--color-red)', fontSize: '0.88rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Detection result */}
      {result && (
        <div style={{
          padding: '16px 18px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-amber-dim)', border: '1px solid var(--color-border-acc)',
        }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-amber)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🎯 Detection Result
          </p>
          <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            {result.message}
          </p>
          {result.matched_food && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Matched: <strong>{result.matched_food.name}</strong> — {result.matched_food.calories} kcal
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setPreview(null); setFile(null); setResult(null); setError('') }}
          style={{ flex: '0 0 auto' }}
          disabled={!preview}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!file || loading}
          onClick={handleRecognize}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analysing…</>
          ) : (
            <><span>🔬</span> Identify Food</>
          )}
        </button>
      </div>
    </div>
  )
}

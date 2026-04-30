import React, { useState } from 'react'
import { queryFoods } from '../services/api'

const EXAMPLE_QUERIES = [
  'I want something light and healthy',
  'High protein meal for gym',
  'Spicy vegetarian Indian dish',
  'Low calorie vegan breakfast',
  'Something sweet and delicious',
  'Quick healthy snack under 200 calories',
  'Protein-rich non-veg dinner',
  'Asian food without gluten',
]

export default function NLQueryInput({ onResults }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)

  const submit = async (query) => {
    const q = query || text
    if (!q.trim()) return
    setText(q)
    setLoading(true)
    setError('')
    setParsed(null)
    try {
      const data = await queryFoods(q)
      setParsed(data.parsed_preferences)
      onResults(data.recommendations, 'nlp', data.parsed_preferences)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not connect to backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Input area */}
      <div style={{ position: 'relative' }}>
        <textarea
          className="form-textarea"
          placeholder="e.g. I want something light, healthy, and vegetarian under 400 calories…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          style={{ minHeight: 110, paddingRight: 52, fontSize: '1rem', lineHeight: 1.6 }}
        />
        <span style={{
          position: 'absolute', top: 14, right: 16,
          fontSize: '1.8rem', pointerEvents: 'none',
        }}>💬</span>
      </div>

      {/* Example chips */}
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Try an example
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              className="btn btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 99 }}
              onClick={() => submit(q)}
            >
              {q}
            </button>
          ))}
        </div>
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

      {/* Parsed preferences preview */}
      {parsed && (
        <div style={{
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: 'hsla(142,69%,47%,0.06)', border: '1px solid hsla(142,69%,47%,0.2)',
        }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-green)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          </p>
          <div className="pref-pills">
            {parsed.diet_type !== 'any' && <span className="pref-pill">🥗 {parsed.diet_type}</span>}
            <span className="pref-pill">🔥 ≤ {parsed.max_calories} kcal</span>
            {parsed.taste_preferences.map((t) => <span key={t} className="pref-pill">✓ {t}</span>)}
            {parsed.cuisines.map((c) => <span key={c} className="pref-pill">🌍 {c}</span>)}
            {parsed.high_protein && <span className="pref-pill">💪 High Protein</span>}
            {parsed.allergies.map((a) => <span key={a} className="pref-pill" style={{ color: 'var(--color-red)' }}>✗ {a}</span>)}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        disabled={loading || !text.trim()}
        onClick={() => submit()}
        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
      >
        {loading ? (
          <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analysing Query…</>
        ) : (
          <><span>🔍</span> Search with AI</>
        )}
      </button>
    </div>
  )
}

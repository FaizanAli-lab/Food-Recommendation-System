import React, { useState } from 'react'
import { getRecommendations } from '../services/api'

const DIET_OPTIONS = [
  { value: 'any', label: 'Any', emoji: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'non-vegetarian', label: 'Non-Veg', emoji: '🍗' },
]

const TASTE_OPTIONS = [
  { value: 'spicy', label:  'Spicy' },
  { value: 'sweet', label:  'Sweet' },
  { value: 'savory', label: 'Savory' },
  { value: 'tangy', label:  'Tangy' },
  { value: 'light', label:  'Light' },
]

const CUISINE_OPTIONS = [
  { value: 'Indian', label: 'Indian' },
  { value: 'Western', label: 'Western' },
  { value: 'Asian', label:   'Asian' },
  { value: 'Mediterranean', label: 'Mediterranean' },
]

export default function PreferenceForm({ onResults }) {
  const [diet, setDiet] = useState('any')
  const [calories, setCalories] = useState(600)
  const [tastes, setTastes] = useState([])
  const [cuisines, setCuisines] = useState([])
  const [allergies, setAllergies] = useState('')
  const [highProtein, setHighProtein] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleTaste = (v) =>
    setTastes((prev) => prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v])

  const toggleCuisine = (v) =>
    setCuisines((prev) => prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const allergyList = allergies
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean)
      const data = await getRecommendations({
        diet_type: diet,
        max_calories: calories,
        taste_preferences: tastes,
        cuisines,
        allergies: allergyList,
        high_protein: highProtein,
      })
      onResults(data.recommendations, 'form')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not connect to backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Diet Type */}
      <div className="form-group">
        <label className="form-label">Dietary Preference</label>
        <div className="chip-group">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${diet === opt.value ? 'active' : ''}`}
              onClick={() => setDiet(opt.value)}
            >
              {opt.image} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calorie Slider */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label">Max Calories</label>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700,
            color: 'var(--color-amber)',
          }}>
            {calories} kcal
          </span>
        </div>
        <div className="range-wrap">
          <input
            type="range"
            min={100} max={4000} step={50}
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, hsl(35,98%,55%) 0%, hsl(35,98%,55%) ${((calories - 100) / ( 4000-100)) * 100}%, rgba(255,255,255,0.08) ${((calories - 100) / (4000-100)) * 100}%, rgba(255,255,255,0.08) 100%)`
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          <span>100 kcal</span><span>4000 kcal</span>
        </div>
      </div>

      {/* Taste */}
      <div className="form-group">
        <label className="form-label">Taste Preferences</label>
        <div className="chip-group">
          {TASTE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${tastes.includes(opt.value) ? 'active' : ''}`}
              onClick={() => toggleTaste(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div className="form-group">
        <label className="form-label">Cuisine Preference <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'none' }}>(leave empty for any)</span></label>
        <div className="chip-group">
          {CUISINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${cuisines.includes(opt.value) ? 'active' : ''}`}
              onClick={() => toggleCuisine(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* High Protein Toggle */}
      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <label className="form-label">High Protein Focus</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Prioritise foods with 20g+ protein</p>
        </div>
        <button
          type="button"
          onClick={() => setHighProtein(!highProtein)}
          style={{
            width: 52, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 3,
            background: highProtein ? 'var(--color-amber)' : 'rgba(255,255,255,0.08)',
            transition: 'background 0.25s',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: '#fff',
            transform: highProtein ? 'translateX(24px)' : 'translateX(0)',
            transition: 'transform 0.25s var(--ease)',
          }} />
        </button>
      </div>

      {/* Allergies */}
      <div className="form-group">
        <label className="form-label">Allergies / Avoid <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.75rem' }}>(comma-separated, e.g. gluten, dairy)</span></label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. gluten, nuts, dairy"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
        />
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

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
        {loading ? (
          <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Getting Recommendations…</>
        ) : (
          <> Get Recommendations</>
        )}
      </button>
    </form>
  )
}

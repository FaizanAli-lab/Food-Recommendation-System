import React from 'react'
import FoodCard from './FoodCard'

export default function RecommendationList({ items, source, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>AI is crunching the numbers…</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>

        </p>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="empty-state">
        <span className="icon">🍽️</span>
        <h3>No recommendations yet</h3>
        <p style={{ fontSize: '0.88rem', marginTop: 6 }}>
          Use the Smart Form, Ask AI, or Scan Food tab above to get personalised meal suggestions.
        </p>
      </div>
    )
  }

  const sourceLabels = {
    form:  {label: 'Smart Form', color: 'var(--color-amber)' },
    nlp:   { label: 'NLP Query',  color: 'var(--color-blue)'  },
    image: { label: 'Image Scan', color: 'var(--color-green)' },
  }
  const src = sourceLabels[source] || sourceLabels.form

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            Recommended for You
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {items.length} dish{items.length !== 1 ? 'es' : ''} ranked by score
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 99,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
          fontSize: '0.8rem', fontWeight: 600, color: src.color,
        }}>
          {src.icon} via {src.label}
        </span>
      </div>

      <div className="food-grid">
        {items.map((item, i) => (
          <FoodCard
            key={item.food?.name || i}
            food={item.food}
            score={item.score}
            reason={item.reason}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}

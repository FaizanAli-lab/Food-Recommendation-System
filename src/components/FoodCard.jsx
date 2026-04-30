import React from 'react'

const CUISINE_COLORS = {
  Indian:        { bg: 'hsla(30,90%,55%,0.12)',  border: 'hsla(30,90%,55%,0.3)',  text: 'hsl(30,90%,65%)' },
  Western:       { bg: 'hsla(210,80%,60%,0.12)', border: 'hsla(210,80%,60%,0.3)', text: 'hsl(210,80%,70%)' },
  Asian:         { bg: 'hsla(350,80%,62%,0.12)', border: 'hsla(350,80%,62%,0.3)', text: 'hsl(350,80%,72%)' },
  Mediterranean: { bg: 'hsla(142,60%,47%,0.12)', border: 'hsla(142,60%,47%,0.3)', text: 'hsl(142,60%,58%)' },
}

const CATEGORY_ICONS = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙',
  snack: '🍿', dessert: '🍰', side: '🥣',
}

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{value}g</span>
      </div>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function FoodCard({ food, score, reason, index = 0 }) {
  if (!food) return null

  const cuisineStyle = CUISINE_COLORS[food.cuisine] || CUISINE_COLORS.Western
  const catIcon = CATEGORY_ICONS[food.category] || '🍽️'

  const calColor =
    food.calories < 250 ? 'var(--color-green)' :
    food.calories < 450 ? 'var(--color-amber)' :
    'var(--color-red)'

  return (
    <div
      className="glass fade-up"
      style={{
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animationDelay: `${index * 60}ms`,
        transition: 'transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-amber)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Emoji */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          overflow:'hidden',
          border: `1px solid ${cuisineStyle.border}`,}}>
        <img
    src={`http://localhost:8000${food.image}`}
    alt={food.name}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}
  />
</div>

        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '0.98rem', fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginBottom: 6,
          }}>
            {food.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {/* Cuisine */}
            <span style={{
              padding: '2px 9px', borderRadius: 99,
              background: cuisineStyle.bg, border: `1px solid ${cuisineStyle.border}`,
              fontSize: '0.7rem', fontWeight: 700, color: cuisineStyle.text,
            }}>
              {food.cuisine}
            </span>
            {/* Category */}
            <span style={{
              padding: '2px 9px', borderRadius: 99,
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)',
              fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)',
            }}>
              {catIcon} {food.category}
            </span>
            {/* Diet tag */}
            {food.tags?.includes('vegan') && <span className="badge badge-green">Vegan</span>}
            {!food.tags?.includes('vegan') && food.tags?.includes('vegetarian') && <span className="badge badge-green">Veg</span>}
            {food.tags?.includes('gluten-free') && <span className="badge badge-blue">Glutenfree</span>}
            {food.tags?.includes('high-protein') && <span className="badge badge-purple">High Protein</span>}
          </div>
        </div>

        {/* Score ring */}
        <div className="score-ring" title={`AI match score: ${Math.round(score * 100)}%`}>
          {Math.round(score * 100)}%
        </div>
      </div>

      {/* Calorie highlight */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
      }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Calories</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: calColor, lineHeight: 1 }}>
            {food.calories}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 3 }}>kcal</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Cuisine</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: cuisineStyle.text }}>{food.cuisine}</p>
        </div>
      </div>

      {/* Macro bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MacroBar label="Protein" value={food.protein} max={50} color="hsl(258,80%,68%)" />
        <MacroBar label="Carbs"   value={food.carbs}   max={100} color="hsl(35,98%,55%)" />
        <MacroBar label="Fat"     value={food.fat}      max={40}  color="hsl(142,69%,47%)" />
      </div>

      {/* Description */}
      {food.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {food.description}
        </p>
      )}

      {/* Reason */}
      {reason && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-amber-dim)', border: '1px solid var(--color-border-acc)',
          fontSize: '0.78rem', color: 'var(--color-amber-soft)', fontWeight: 500, lineHeight: 1.4,
        }}>
          {reason}
        </div>
      )}
    </div>
  )
}

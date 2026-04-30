import React, { useEffect, useState } from 'react'
import { getHealth } from '../services/api'
import { useAuth } from '../pages/Login'

export default function Header() {
  const [status, setStatus] = useState(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    getHealth()
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  return (
    <header style={{ padding: '32px 0 16px', textAlign: 'center', position: 'relative' }}>
      {/* User info + Logout — top right */}
      {user && (
        <div style={{
          position: 'absolute', top: 32, right: 0,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
          }}>
             {user.name}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '6px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-red)', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'hsla(0,74%,58%,0.12)'
              e.target.style.borderColor = 'hsla(0,74%,58%,0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.04)'
              e.target.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            Log out
          </button>
        </div>
      )}

      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(135deg, hsl(35,98%,55%), hsl(28,95%,45%))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, boxShadow: '0 4px 24px hsla(35,98%,55%,0.45)',
        }}>
          🥗
        </div>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #f0f4ff 30%, hsl(35,98%,65%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}>
            Smart Eats<span style={{ color: 'var(--color-amber)', WebkitTextFillColor: 'var(--color-amber)' }}></span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 2 }}>
            Fuel Your Day —One Perfect kcal at a Time.
          </p>
        </div>
      </div>

      {/* Tagline */}
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 18px' }}>
         <strong style={{ color: 'var(--color-amber)' }}></strong> 
      </p>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: '', icon: '🧠', color: 'var(--color-purple)' },
          { label: '', icon: '⚡', color: 'var(--color-amber)' },
          { label: '', icon: '💬', color: 'var(--color-blue)' },
          { label: '', icon: '📷', color: 'var(--color-green)' },
          { label: '', icon: '🗄️', color: '#4db33d' },
        ].map(({ label, icon, color }) => (
          <span key={label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.75rem', fontWeight: 600, color,
          }}>
            {icon} {label}
          </span>
        ))}
      </div>

      {/* Backend status */}
      {status && (
        <div style={{
          marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 999,
          background: status.recommender_ready ? 'hsla(142,69%,47%,0.1)' : 'hsla(35,98%,55%,0.1)',
          border: `1px solid ${status.recommender_ready ? 'hsla(142,69%,47%,0.3)' : 'hsla(35,98%,55%,0.3)'}`,
          fontSize: '0.78rem', color: status.recommender_ready ? 'var(--color-green)' : 'var(--color-amber)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: status.recommender_ready ? 'var(--color-green)' : 'var(--color-amber)',
            boxShadow: `0 0 6px ${status.recommender_ready ? 'var(--color-green)' : 'var(--color-amber)'}`,
          }} />
        </div>
      )}
    </header>
  )
}

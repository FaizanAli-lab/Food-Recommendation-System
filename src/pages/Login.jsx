import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { authLogin, authRegister, authMe } from '../services/api'
import heroImage from '../assets/download.jpg'



const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — check for saved token
  useEffect(() => {
    const token = localStorage.getItem('smarteats_token')
    if (token) {
      authMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('smarteats_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (name, password) => {
    const data = await authLogin(name, password)
    localStorage.setItem('smarteats_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  const register = async (name, password) => {
    const data = await authRegister(name, password)
    localStorage.setItem('smarteats_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('smarteats_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}


/* 
   AUTH MODAL — Simple Name + Password*/

function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('')
      setName('')
      setPassword('')
      setIsLogin(true)
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isLogin) {
        await login(name, password)
      } else {
        await register(name, password)
      }
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Authentication failed. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal fade-up" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🥗</span>
          <span className="auth-logo-text">Smart Eats</span>
        </div>

        <p className="auth-subtitle">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Auth form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="auth-name">Your Name</label>
            <input
              id="auth-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="auth-field" style={{ marginTop: '16px' }}>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
          </div>

          <button
            type="submit"
            className="landing-cta-primary"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={submitting}
          >
            {submitting ? (
              <span className="auth-spinner" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-blue)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}







/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — hero + features + auth modal
   ═══════════════════════════════════════════════════════════ */

export default function LoginSection() {
  const [showAuth, setShowAuth] = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)

  // Trigger entrance animation
  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* ── HERO SECTION ──────────────────────────────── */}
      <section className="landing-hero">
        {/* Background */}
        <div className="landing-hero-bg">
          <img
            src={heroImage}
            alt="Healthy food spread"
            width={1920}
            height={1080}
          />
          <div className="landing-hero-overlay" />
        </div>

        {/* Content */}
        <div className={`landing-hero-content ${heroLoaded ? 'visible' : ''}`}>
          <span className="landing-badge">
            🍽️ Intelligence for Every Bite
          </span>

          <h1 className="landing-title">
            Eat Smart,{' '}
            <span className="landing-title-accent">Live Well</span>
          </h1>

          <p className="landing-desc">
            Tell us your cravings, dietary needs, or simply describe what you're in
            the mood for. Our intelligent system finds the perfect dish for you.
          </p>

          <div className="landing-cta-row">
            <button
              className="landing-cta-primary"
              onClick={() => setShowAuth(true)}
            >
             Don’t Wait—Start Now
            </button>
         
          </div>

          {/* Stats row */}
          <div className="landing-stats">
            {[
              { value: '90+', label: 'Foods' },
              { value: '3', label: 'ML Models' },
              { value: '4', label: 'Cuisines' },
              { value: '24/7', label: 'Available' },
            ].map((s) => (
              <div key={s.label} className="landing-stat">
                <span className="landing-stat-value">{s.value}</span>
                <span className="landing-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────── */}
      

       
  

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span>🥗 Smart Eats © 2026</span>
          
        </div>
      </footer>

      {/* ── AUTH MODAL ────────────────────────────────── */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}

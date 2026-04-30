import React, { useState } from 'react'
import Header from './components/Header'
import PreferenceForm from './components/PreferenceForm'
import NLQueryInput from './components/NLQueryInput'
import ImageUpload from './components/ImageUpload'
import RecommendationList from './components/RecommendationList'
import LoginSection, { AuthProvider, useAuth } from './pages/Login'

const TABS = [
  { id: 'form',  label: 'Smart Form',  desc: 'Structured preferences' },
  { id: 'nlp',   label: 'Ask AI',   desc: 'Natural language query' },
  { id: 'image', label: 'Scan Food',  desc: 'Image recognition' },
]

function Dashboard() {
  const [activeTab, setActiveTab] = useState('form')
  const [results, setResults] = useState([])
  const [source, setSource] = useState('form')

  const handleResults = (recs, src) => {
    setResults(recs || [])
    setSource(src)
    // Smooth scroll to results on mobile
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="page-wrapper">
      <Header />

      <div style={{ height: 32 }} />

      {/* Main panel */}
      <div className="glass" style={{ padding: 'clamp(20px, 4vw, 36px)' }}>
        {/* Tab navigation */}
        <div className="tabs" style={{ marginBottom: 32 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 400,
                  opacity: 0.7,
                  display: window.innerWidth < 480 ? 'none' : 'block',
                }}>
                  {tab.desc}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ minHeight: 300 }}>
          {activeTab === 'form' && (
            <div className="fade-up">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                  🧠 Smart Preference
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Set your dietary requirements your perfect meals.
                </p>
              </div>
              <PreferenceForm onResults={handleResults} />
            </div>
          )}

          {activeTab === 'nlp' && (
            <div className="fade-up">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                  💬 Natural Language Query
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Describe what you want in plain English, extracts dietary intent automatically.
                </p>
              </div>
              <NLQueryInput onResults={handleResults} />
            </div>
          )}

          {activeTab === 'image' && (
            <div className="fade-up">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                  📷 Food Image Recognition
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Upload a food photo. 
                </p>
              </div>
              <ImageUpload onResults={handleResults} />
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 48 }} />

      {/* Results section */}
      <div id="results-section">
        <RecommendationList items={results} source={source} />
      </div>

      {/* Divider / Footer */}
      {results.length > 0 && (
        <>
          <div className="divider" style={{ marginTop: 56 }} />
          <footer style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <p>@Smart Eats 2026</p>
          </footer>
        </>
      )}
    </div>
  )
}

/* ── App Shell — auth gating ─────────────────────────────── */

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 16,
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginSection />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

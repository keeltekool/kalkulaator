'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CALCULATORS = [
  { href: '/automaks', title: 'Automaksu kalkulaator', desc: 'Arvuta sõiduki aastamaks ja registreerimistasu', icon: '🚗', tag: 'UUS' },
  { href: '/palgakalkulaator', title: 'Palgakalkulaator 2026', desc: 'Tööandja kulu, bruto- ja netopalk', icon: '💰', tag: 'UUS' },
]

export default function Home() {
  const [theme, setTheme] = useState<string>('light')
  useEffect(() => {
    try { setTheme(localStorage.getItem('kalku-theme') || 'light') } catch {}
  }, [])
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('kalku-theme', next) } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline" style={{ color: 'var(--text)' }}>
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <div className="text-xl font-bold tracking-tight leading-none">Kalku</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Eesti kalkulaatorid</div>
            </span>
          </a>
          <button type="button" onClick={toggleTheme} aria-label="Vaheta värviteema"
            className="w-10 h-10 rounded-full grid place-items-center border cursor-pointer"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)', color: 'var(--text-muted)' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-3" style={{ color: 'var(--text)' }}>Eesti kalkulaatorid</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-lg">Täpsed, reklaamivabad, mobiilisõbralikud</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CALCULATORS.map(c => (
              <Link key={c.href} href={c.href} className="group rounded-2xl p-6 no-underline transition-all"
                style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>{c.tag}</span>
                </div>
                <h2 className="text-lg font-semibold mb-1 group-hover:underline">{c.title}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-5 text-[13px] border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          © 2026 Kalkulaator — Täpsed arvutused, puhas disain
        </div>
      </footer>
    </div>
  )
}

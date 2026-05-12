'use client'

import { useState, useEffect, useMemo } from 'react'
import { calculateVat } from '@/calculators/vat/calculate'
import { VAT_RATES, DEFAULT_VAT_RATE } from '@/calculators/vat/constants'
import type { VatRate, VatInputMode, VatResult } from '@/calculators/vat/types'

function Segmented({ value, options, onChange }: {
  value: string; options: { value: string; label: string; detail?: string }[]; onChange: (v: string) => void
}) {
  return (
    <div className="seg responsive">
      {options.map(opt => (
        <button key={opt.value} type="button"
          className={`seg-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <label className="text-[13px] font-semibold text-[var(--text)]">{label}</label>
      {children}
      {help && <div className="text-xs text-[var(--text-muted)] leading-snug">{help}</div>}
    </div>
  )
}

const MODE_OPTIONS = [
  { value: 'net', label: 'Tean hinda ilma KM-ta' },
  { value: 'vat', label: 'Tean käibemaksu' },
  { value: 'gross', label: 'Tean hinda koos KM-ga' },
]

const MODE_LABELS: Record<VatInputMode, string> = {
  net: 'Hind käibemaksuta',
  vat: 'Käibemaks',
  gross: 'Hind käibemaksuga',
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000]

export default function VatCalculator() {
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

  const [rate, setRate] = useState<VatRate>(DEFAULT_VAT_RATE)
  const [mode, setMode] = useState<VatInputMode>('net')
  const [amount, setAmount] = useState<number | null>(null)
  const [showCoefficients, setShowCoefficients] = useState(false)

  const hasAmount = amount != null && amount > 0

  const result: VatResult | null = useMemo(
    () => hasAmount ? calculateVat({ rate, mode, amount: amount! }) : null,
    [rate, mode, amount, hasAmount]
  )

  const rateDetail = VAT_RATES.find(r => r.value === rate)?.detail

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

      <main className="flex-1 pb-14 sm:pb-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-2" style={{ color: 'var(--text)' }}>Käibemaksukalkulaator</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-base">Arvuta hind koos ja ilma käibemaksuta</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-start">
            {/* INPUT */}
            <section className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <Field label="Käibemaksumäär" help={rateDetail}>
                <Segmented value={String(rate)}
                  options={VAT_RATES.map(r => ({ value: String(r.value), label: r.label }))}
                  onChange={v => setRate(Number(v) as VatRate)} />
              </Field>

              <Field label="Mida tead?">
                <Segmented value={mode} options={MODE_OPTIONS} onChange={v => setMode(v as VatInputMode)} />
              </Field>

              <Field label={MODE_LABELS[mode]}>
                <div className="relative">
                  <input type="number" inputMode="decimal" className="calc-input" style={{ paddingRight: 32 }}
                    placeholder="nt. 100" value={amount ?? ''}
                    onChange={e => setAmount(e.target.value === '' ? null : Number(e.target.value))} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)] pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>€</span>
                </div>
              </Field>

              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(q => (
                  <button key={q} type="button" onClick={() => setAmount(q)}
                    className="text-xs px-3 py-1.5 rounded-full border cursor-pointer"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {q.toLocaleString('et-EE')}
                  </button>
                ))}
              </div>
            </section>

            {/* RESULTS */}
            <section className="flex flex-col gap-4 lg:sticky lg:top-6">
              {!result && (
                <div className="rounded-2xl p-14 text-center fade-up" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-elev)', color: 'var(--text-muted)' }}>
                  <div className="w-14 h-14 rounded-xl grid place-items-center mx-auto mb-4" style={{ background: 'var(--bg-subtle)', color: 'var(--text-subtle)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2"/></svg>
                  </div>
                  <p className="text-[15px] max-w-[28ch] mx-auto">Sisesta summa tulemuse nägemiseks</p>
                </div>
              )}

              {result && (
                <div className="result-card fade-up">
                  <div className="p-6 sm:px-8">
                    <div className="flex flex-col gap-5">
                      {/* Net */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hind käibemaksuta</span>
                        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: mode === 'net' ? 'var(--text-muted)' : 'var(--text)' }}>
                          {result.netPrice.toFixed(2)} €
                        </span>
                      </div>

                      {/* VAT */}
                      <div className="flex items-baseline justify-between p-4 rounded-xl" style={{ background: 'var(--accent-soft)' }}>
                        <span className="text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>Käibemaks ({(rate * 100).toFixed(0)}%)</span>
                        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>
                          {result.vatAmount.toFixed(2)} €
                        </span>
                      </div>

                      {/* Gross */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hind käibemaksuga</span>
                        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: mode === 'gross' ? 'var(--text-muted)' : 'var(--text)' }}>
                          {result.grossPrice.toFixed(2)} €
                        </span>
                      </div>

                      {/* Breakdown bar */}
                      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-subtle)' }}>
                        <div style={{ width: `${(result.netPrice / result.grossPrice * 100)}%`, background: 'var(--info)', borderRadius: 'var(--r-pill) 0 0 var(--r-pill)' }} />
                        <div style={{ width: `${(result.vatAmount / result.grossPrice * 100)}%`, background: 'var(--accent)' }} />
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>Hind ({((result.netPrice / result.grossPrice) * 100).toFixed(1)}%)</span>
                        <span>KM ({((result.vatAmount / result.grossPrice) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Coefficients */}
                    <button type="button" onClick={() => setShowCoefficients(!showCoefficients)}
                      className="text-[12px] font-medium mt-4 cursor-pointer flex items-center gap-1 border-0 bg-transparent p-0"
                      style={{ color: 'var(--text-muted)' }}>
                      {showCoefficients ? '▾' : '▸'} Arvutuskoefitsiendid
                    </button>
                    {showCoefficients && (
                      <div className="mt-2 text-xs flex flex-col gap-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        <span>KM koguhinnast: × {result.coefficients.vatFromGross.toFixed(6)}</span>
                        <span>KM netohinnast: × {result.coefficients.vatFromNet.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="py-5 text-[13px] border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-4">
          <span>© 2026 Kalkulaator</span>
          <span>Andmed põhinevad <a href="https://www.riigiteataja.ee/akt/kms" target="_blank" rel="noreferrer"
            className="underline decoration-[var(--border)] hover:text-[var(--text)]">käibemaksuseadusel</a></span>
        </div>
      </footer>

      {/* Mobile sticky bar */}
      {result && (
        <div className="sticky-bar is-visible">
          <div className="flex gap-3 flex-wrap">
            <span><span className="text-[var(--text-muted)]">Ilma KM: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{result.netPrice.toFixed(2)} €</span></span>
            <span><span className="text-[var(--text-muted)]">KM-ga: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>{result.grossPrice.toFixed(2)} €</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

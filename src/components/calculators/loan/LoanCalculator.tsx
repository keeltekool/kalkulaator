'use client'

import { useState, useEffect, useMemo } from 'react'
import { calculateLoan } from '@/calculators/loan/calculate'
import type { LoanInput, LoanSolveMode, LoanPeriodUnit, LoanResult } from '@/calculators/loan/types'

function Segmented({ value, options, onChange }: {
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <div className="seg responsive">
      {options.map(opt => (
        <button key={opt.value} type="button"
          className={`seg-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}>{opt.label}</button>
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

function NumInput({ value, onChange, placeholder, suffix, disabled = false }: {
  value: number | null; onChange: (v: number | null) => void; placeholder: string; suffix?: string; disabled?: boolean
}) {
  return (
    <div className="relative">
      <input type="number" inputMode="decimal" className="calc-input"
        style={{ paddingRight: suffix ? 48 : undefined, opacity: disabled ? 0.5 : 1 }}
        placeholder={placeholder} value={value ?? ''} disabled={disabled}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)] pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>{suffix}</span>}
    </div>
  )
}

const SOLVE_OPTIONS = [
  { value: 'monthlyPayment', label: 'Kuumakse' },
  { value: 'loanAmount', label: 'Laenusumma' },
  { value: 'annualInterest', label: 'Intress' },
  { value: 'period', label: 'Periood' },
]

const PERIOD_OPTIONS = [
  { value: 'years', label: 'Aastates' },
  { value: 'months', label: 'Kuudes' },
]

export default function LoanCalculator() {
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

  const [solveMode, setSolveMode] = useState<LoanSolveMode>('monthlyPayment')
  const [periodUnit, setPeriodUnit] = useState<LoanPeriodUnit>('years')
  const [principal, setPrincipal] = useState<number | null>(null)
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null)
  const [interest, setInterest] = useState<number | null>(null)
  const [period, setPeriod] = useState<number | null>(null)

  const hasInputs = useMemo(() => {
    if (solveMode === 'loanAmount') return monthlyPayment != null && interest != null && period != null && interest > 0
    if (solveMode === 'monthlyPayment') return principal != null && interest != null && period != null && interest > 0
    if (solveMode === 'annualInterest') return principal != null && monthlyPayment != null && period != null
    if (solveMode === 'period') return principal != null && monthlyPayment != null && interest != null && interest > 0
    return false
  }, [solveMode, principal, monthlyPayment, interest, period])

  const result: LoanResult | null = useMemo(() => {
    if (!hasInputs) return null
    return calculateLoan({
      solveMode, periodUnit,
      principal: principal ?? 0,
      monthlyPayment: monthlyPayment ?? 0,
      annualInterestPercent: interest ?? 0,
      period: period ?? 0,
    })
  }, [solveMode, periodUnit, principal, monthlyPayment, interest, period, hasInputs])

  const isValid = result && !result.totalRepayment.includes('NaN')
  const solvedValue = result ? (
    solveMode === 'loanAmount' ? result.principal :
    solveMode === 'monthlyPayment' ? result.monthlyPayment :
    solveMode === 'annualInterest' ? result.annualInterestPercent :
    result.period
  ) : null

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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-2" style={{ color: 'var(--text)' }}>Laenukalkulaator</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-base">Arvuta laenu kuumakse, intress, periood või maksimaalne laenusumma</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-6 lg:gap-8 items-start">
            <section className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <Field label="Arvutan" help="Vali, mida soovid arvutada">
                <Segmented value={solveMode} options={SOLVE_OPTIONS} onChange={v => setSolveMode(v as LoanSolveMode)} />
              </Field>

              <Field label="Laenusumma">
                <NumInput value={principal} onChange={setPrincipal} placeholder="nt. 10000" suffix="€" disabled={solveMode === 'loanAmount'} />
              </Field>

              <Field label="Kuumakse (annuiteet)">
                <NumInput value={monthlyPayment} onChange={setMonthlyPayment} placeholder="nt. 200" suffix="€/kuu" disabled={solveMode === 'monthlyPayment'} />
              </Field>

              <Field label="Aastane intressimäär">
                <NumInput value={interest} onChange={setInterest} placeholder="nt. 5" suffix="%" disabled={solveMode === 'annualInterest'} />
              </Field>

              <Field label="Laenu periood">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <NumInput value={period} onChange={setPeriod} placeholder={periodUnit === 'years' ? 'nt. 5' : 'nt. 60'} disabled={solveMode === 'period'} />
                  </div>
                  <div className="flex-1">
                    <Segmented value={periodUnit} options={PERIOD_OPTIONS} onChange={v => setPeriodUnit(v as LoanPeriodUnit)} />
                  </div>
                </div>
              </Field>

              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Kalkulaator eeldab fikseeritud annuiteetmakset kogu laenuperioodi vältel.
              </div>
            </section>

            <section className="flex flex-col gap-4 lg:sticky lg:top-6">
              {!result && (
                <div className="rounded-2xl p-14 text-center fade-up" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-elev)', color: 'var(--text-muted)' }}>
                  <div className="w-14 h-14 rounded-xl grid place-items-center mx-auto mb-4" style={{ background: 'var(--bg-subtle)', color: 'var(--text-subtle)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2"/></svg>
                  </div>
                  <p className="text-[15px] max-w-[28ch] mx-auto">Sisesta laenu andmed tulemuse nägemiseks</p>
                </div>
              )}

              {result && isValid && (
                <>
                  <div className="result-card fade-up">
                    <header className="result-head">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold tracking-wide uppercase text-[var(--text-muted)]">
                          {solveMode === 'loanAmount' ? 'Laenusumma' : solveMode === 'monthlyPayment' ? 'Kuumakse' : solveMode === 'annualInterest' ? 'Intressimäär' : 'Laenu periood'}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="result-num">{solvedValue}{solveMode !== 'annualInterest' && ' €'}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          {solveMode === 'monthlyPayment' ? 'kuus' : solveMode === 'period' ? (periodUnit === 'years' ? 'aastat' : 'kuud') : ''}
                        </div>
                      </div>
                    </header>
                    <div className="p-5 sm:px-6">
                      <div className="flex flex-col gap-3">
                        <div className="breakdown-line">
                          <span className="text-sm">Tagasimaksed kokku</span>
                          <span className="amt text-sm">{result.totalRepayment} €</span>
                        </div>
                        <div className="breakdown-line">
                          <span className="text-sm">Intressid kokku</span>
                          <span className="amt text-sm">{result.totalInterest} €</span>
                        </div>
                        <div className="h-px bg-[var(--border)] my-1" />
                        <div className="breakdown-line breakdown-total">
                          <span className="lbl">Laenusumma</span>
                          <span className="amt">{result.principal} €</span>
                        </div>
                      </div>

                      {/* Breakdown bar */}
                      {Number(result.totalRepayment) > 0 && (
                        <div className="mt-4">
                          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-subtle)' }}>
                            <div style={{ width: `${(Number(result.principal) / Number(result.totalRepayment) * 100)}%`, background: 'var(--info)', borderRadius: 'var(--r-pill) 0 0 var(--r-pill)' }} />
                            <div style={{ width: `${(Number(result.totalInterest) / Number(result.totalRepayment) * 100)}%`, background: 'var(--warn)' }} />
                          </div>
                          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            <span>Põhiosa ({((Number(result.principal) / Number(result.totalRepayment)) * 100).toFixed(1)}%)</span>
                            <span>Intress ({((Number(result.totalInterest) / Number(result.totalRepayment)) * 100).toFixed(1)}%)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {result && !isValid && (
                <div className="banner is-warn">
                  <span className="flex-shrink-0">⚠️</span>
                  <div style={{ color: 'var(--warn-text)' }}>
                    {solveMode === 'period' ? 'Kuumakse on liiga väike laenu tagasimaksmiseks valitud intressiga.' :
                     solveMode === 'monthlyPayment' && interest === 0 ? 'Kalkulaator ei toeta 0% intressi. Nullintressiga kuumakse = laenusumma ÷ kuude arv.' :
                     'Sisendandmetega ei saa arvutust teha. Kontrolli väärtusi.'}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="py-5 text-[13px] border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          © 2026 Kalkulaator — Täpsed arvutused, puhas disain
        </div>
      </footer>

      {result && isValid && (
        <div className="sticky-bar is-visible">
          <div className="flex gap-3 flex-wrap">
            <span><span className="text-[var(--text-muted)]">Kuumakse: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{result.monthlyPayment} €</span></span>
            <span><span className="text-[var(--text-muted)]">Intress kokku: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--warn-text)' }}>{result.totalInterest} €</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

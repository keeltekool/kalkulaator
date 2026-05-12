'use client'

import { useState, useEffect, useMemo } from 'react'
import { calculateSalary } from '@/calculators/salary/calculate'
import { DEFAULT_SALARY_INPUT } from '@/calculators/salary/types'
import type { SalaryInput, SalaryYear, SalaryInputMode, SalaryPeriod, SalaryResult } from '@/calculators/salary/types'
import { SALARY_LABELS } from '@/calculators/salary/format'

function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`field-collapse${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="field-inner">{children}</div>
    </div>
  )
}

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

function NumInput({ value, onChange, placeholder, suffix }: {
  value: number | null; onChange: (v: number | null) => void; placeholder: string; suffix?: string
}) {
  return (
    <div className="relative">
      <input type="number" inputMode="decimal" className="calc-input" style={suffix ? { paddingRight: 48 } : undefined}
        placeholder={placeholder} value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)] pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>{suffix}</span>}
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

function ResultRow({ label, eur, pct, bold = false }: { label: string; eur: number; pct?: number; bold?: boolean }) {
  return (
    <div className={`breakdown-line ${bold ? 'breakdown-total' : ''}`}>
      <span className="lbl text-sm">{label}</span>
      <span className="flex gap-4 items-baseline">
        {pct != null && <span className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)', minWidth: 52, textAlign: 'right' }}>{pct.toFixed(2)}%</span>}
        <span className="amt text-sm" style={{ minWidth: 80, textAlign: 'right' }}>{eur.toFixed(2)} €</span>
      </span>
    </div>
  )
}

const YEAR_OPTIONS: { value: string; label: string }[] = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
]

const MODE_OPTIONS = [
  { value: 'employerCost', label: 'Tööandja kulu' },
  { value: 'gross', label: 'Brutopalk' },
  { value: 'net', label: 'Netopalk' },
]

const PERIOD_OPTIONS = [
  { value: 'hourly', label: 'Tunnis' },
  { value: 'monthly', label: 'Kuus' },
  { value: 'annual', label: 'Aastas' },
]

const PENSION_RATE_OPTIONS = [
  { value: '0.02', label: '2%' },
  { value: '0.04', label: '4%' },
  { value: '0.06', label: '6%' },
]

export default function SalaryCalculator() {
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

  const [year, setYear] = useState<SalaryYear>(2026)
  const [inputMode, setInputMode] = useState<SalaryInputMode>('gross')
  const [amount, setAmount] = useState<number | null>(null)
  const [period, setPeriod] = useState<SalaryPeriod>('monthly')
  const [workHours, setWorkHours] = useState<number>(160)

  const [taxFreeEnabled, setTaxFreeEnabled] = useState(true)
  const [retired, setRetired] = useState(false)
  const [applyMinSocTax, setApplyMinSocTax] = useState(false)
  const [inclEmployerUI, setInclEmployerUI] = useState(true)
  const [inclEmployeeUI, setInclEmployeeUI] = useState(true)
  const [inclPension, setInclPension] = useState(true)
  const [pensionRate, setPensionRate] = useState<0.02 | 0.04 | 0.06>(0.02)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasAmount = amount != null && amount > 0

  const input: SalaryInput = useMemo(() => ({
    ...DEFAULT_SALARY_INPUT,
    year, inputMode, amount: amount ?? 0, period,
    workHoursPerMonth: workHours,
    taxFreeEnabled, retired,
    applyMinimumSocialTax: applyMinSocTax,
    includeEmployerUnemployment: inclEmployerUI,
    includeEmployeeUnemployment: inclEmployeeUI,
    includeFundedPension: inclPension,
    fundedPensionRate: pensionRate,
  }), [year, inputMode, amount, period, workHours, taxFreeEnabled, retired,
    applyMinSocTax, inclEmployerUI, inclEmployeeUI, inclPension, pensionRate])

  const result: SalaryResult | null = useMemo(
    () => hasAmount ? calculateSalary(input) : null,
    [input, hasAmount]
  )

  const periodLabel = period === 'hourly' ? 'kuus' : period === 'annual' ? 'aastas' : 'kuus'

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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-2" style={{ color: 'var(--text)' }}>Palgakalkulaator {year}</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-base">Arvuta palga ja maksude jaotus — tööandja kulu, bruto- ja netopalk</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-6 lg:gap-8 items-start">
            {/* INPUT */}
            <section className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <Field label="Aasta">
                <Segmented value={String(year)} options={YEAR_OPTIONS} onChange={v => setYear(Number(v) as SalaryYear)} />
              </Field>

              <Field label="Sisestamise viis" help={inputMode === 'employerCost' ? 'Sisesta tööandja kogukulu (palgafond)' : inputMode === 'net' ? 'Sisesta soovitud netopalk' : 'Sisesta brutopalk'}>
                <Segmented value={inputMode} options={MODE_OPTIONS} onChange={v => setInputMode(v as SalaryInputMode)} />
              </Field>

              <Field label="Periood">
                <Segmented value={period} options={PERIOD_OPTIONS} onChange={v => setPeriod(v as SalaryPeriod)} />
              </Field>

              <Collapse open={period === 'hourly'}>
                <Field label="Töötunnid kuus">
                  <NumInput value={workHours} onChange={v => setWorkHours(v ?? 160)} placeholder="160" suffix="h" />
                </Field>
              </Collapse>

              <Field label={inputMode === 'employerCost' ? 'Tööandja kulu' : inputMode === 'net' ? 'Netopalk' : 'Brutopalk'}>
                <NumInput value={amount} onChange={setAmount} placeholder="nt. 2000" suffix="€" />
              </Field>

              {/* Advanced controls */}
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[13px] font-medium mb-4 cursor-pointer flex items-center gap-1 border-0 bg-transparent p-0"
                style={{ color: 'var(--accent)' }}>
                {showAdvanced ? '▾' : '▸'} Täpsemad valikud
              </button>

              <Collapse open={showAdvanced}>
                <div className="flex flex-col gap-3 mb-4">
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={taxFreeEnabled} onChange={e => setTaxFreeEnabled(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Arvesta maksuvaba tulu ({year === 2026 ? '700' : year >= 2023 ? '654' : '500'} € {periodLabel})
                  </label>

                  <Collapse open={year >= 2025}>
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" checked={retired} onChange={e => setRetired(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                      Töötaja on vanaduspensioniealine
                    </label>
                  </Collapse>

                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={applyMinSocTax} onChange={e => setApplyMinSocTax(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Arvesta sotsiaalmaksu min. kuumäära alusel
                  </label>

                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={inclEmployerUI} onChange={e => setInclEmployerUI(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Tööandja töötuskindlustusmakse (0.8%)
                  </label>

                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={inclEmployeeUI} onChange={e => setInclEmployeeUI(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Töötaja töötuskindlustusmakse (1.6%)
                  </label>

                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={inclPension} onChange={e => setInclPension(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Kogumispension (II sammas)
                  </label>

                  <Collapse open={inclPension && year >= 2025}>
                    <Field label="Kogumispensioni määr">
                      <Segmented value={String(pensionRate)} options={PENSION_RATE_OPTIONS} onChange={v => setPensionRate(Number(v) as 0.02 | 0.04 | 0.06)} />
                    </Field>
                  </Collapse>
                </div>
              </Collapse>
            </section>

            {/* RESULTS */}
            <section className="flex flex-col gap-4 lg:sticky lg:top-6" data-results>
              {!result && (
                <div className="rounded-2xl p-14 text-center fade-up" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-elev)', color: 'var(--text-muted)' }}>
                  <div className="w-14 h-14 rounded-xl grid place-items-center mx-auto mb-4" style={{ background: 'var(--bg-subtle)', color: 'var(--text-subtle)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2"/></svg>
                  </div>
                  <p className="text-[15px] max-w-[28ch] mx-auto">Sisesta summa tulemuse nägemiseks</p>
                </div>
              )}

              {result && !isNaN(result.gross) && (
                <div className="result-card fade-up">
                  <header className="result-head">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold tracking-wide uppercase text-[var(--text-muted)]">Palga jaotus</span>
                      <span className="text-[13px] text-[var(--text-muted)] mt-1">Kõik summad {periodLabel}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="result-num">{result.net.toFixed(2)} €</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">netopalk</div>
                    </div>
                  </header>
                  <div className="p-5 sm:px-6">
                    <div className="flex flex-col gap-3">
                      <ResultRow label={SALARY_LABELS.employerCost} eur={result.employerCost} pct={result.percentages.employerCost} bold />

                      <div className="h-px bg-[var(--border)] my-1" />

                      <ResultRow label={SALARY_LABELS.socialTax} eur={result.socialTax} pct={result.percentages.socialTax} />
                      {result.employerUnemployment > 0 && (
                        <ResultRow label={SALARY_LABELS.employerUnemployment} eur={result.employerUnemployment} pct={result.percentages.employerUnemployment} />
                      )}

                      <div className="h-px bg-[var(--border)] my-1" />

                      <ResultRow label={SALARY_LABELS.gross} eur={result.gross} pct={result.percentages.gross} bold />

                      <div className="h-px bg-[var(--border)] my-1" />

                      {result.fundedPensionEmployee > 0 && (
                        <ResultRow label={SALARY_LABELS.fundedPensionEmployee} eur={result.fundedPensionEmployee} pct={result.percentages.fundedPensionEmployee} />
                      )}
                      {result.employeeUnemployment > 0 && (
                        <ResultRow label={SALARY_LABELS.employeeUnemployment} eur={result.employeeUnemployment} pct={result.percentages.employeeUnemployment} />
                      )}
                      <ResultRow label={SALARY_LABELS.incomeTax} eur={result.incomeTax} pct={result.percentages.incomeTax} />

                      <div className="h-px bg-[var(--border)] my-1" />

                      <ResultRow label={SALARY_LABELS.net} eur={result.net} pct={result.percentages.net} bold />
                    </div>

                    {/* Tax-free info */}
                    <div className="mt-4 text-xs text-[var(--text-muted)] flex flex-col gap-1">
                      <span>Maksuvaba tulu: <strong style={{ color: 'var(--text)' }}>{result.taxFreeApplied.toFixed(2)} €</strong></span>
                      <span>Tulumaksumäär: {(result.derived.incomeTaxRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {result && !isNaN(result.gross) && (
                <div className="result-card is-info fade-up">
                  <header className="result-head">
                    <span className="text-[13px] font-semibold tracking-wide uppercase text-[var(--text-muted)]">Maksujaotus</span>
                  </header>
                  <div className="p-5 sm:px-6">
                    <div className="flex flex-col gap-3">
                      <ResultRow label="Riiklikud maksud" eur={result.chart.stateTaxes} />
                      <ResultRow label="Kohalikud maksud" eur={result.chart.localGovernmentTaxes} />
                      <ResultRow label="Pensionifond" eur={result.chart.pensionFund} />
                      <ResultRow label="Netopalk" eur={result.chart.netWage} />
                    </div>
                  </div>
                </div>
              )}

              {result && result.warnings.length > 0 && result.warnings.map((w, i) => (
                <div key={i} className="banner is-warn">
                  <span className="flex-shrink-0">⚠️</span>
                  <div style={{ color: 'var(--warn-text)' }}>{w}</div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>

      <footer className="py-5 text-[13px] border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-4">
          <span>© 2026 Kalkulaator</span>
          <span>Andmed põhinevad <a href="https://www.riigiteataja.ee/akt/TuMS" target="_blank" rel="noreferrer"
            className="underline decoration-[var(--border)] hover:text-[var(--text)]">tulumaksuseadusel</a></span>
        </div>
      </footer>

      {/* Mobile sticky bar */}
      {result && !isNaN(result.gross) && (
        <div className="sticky-bar is-visible">
          <div className="flex gap-3 flex-wrap">
            <span><span className="text-[var(--text-muted)]">Bruto: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{result.gross.toFixed(2)} €</span></span>
            <span><span className="text-[var(--text-muted)]">Neto: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>{result.net.toFixed(2)} €</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

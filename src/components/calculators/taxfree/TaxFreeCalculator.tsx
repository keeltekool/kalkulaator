'use client'

import { useState, useEffect, useMemo } from 'react'
import { calculateTaxFree } from '@/calculators/taxfree/calculate'
import type { TaxFreeInput, TaxFreeYear, TaxFreeInputMode, TaxFreeInputPeriod, TaxFreeOutputPeriod } from '@/calculators/taxfree/types'

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

function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`field-collapse${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="field-inner">{children}</div>
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

export default function TaxFreeCalculator() {
  const [theme, setTheme] = useState<string>('light')
  useEffect(() => { try { setTheme(localStorage.getItem('kalku-theme') || 'light') } catch {} }, [])
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next); document.documentElement.dataset.theme = next
    try { localStorage.setItem('kalku-theme', next) } catch {}
  }

  const [year, setYear] = useState<TaxFreeYear>(2025)
  const [inputMode, setInputMode] = useState<TaxFreeInputMode>('gross')
  const [amount, setAmount] = useState<number | null>(null)
  const [inputPeriod, setInputPeriod] = useState<TaxFreeInputPeriod>('monthly')
  const [workHours, setWorkHours] = useState<number>(160)
  const [inclUI, setInclUI] = useState(true)
  const [inclPension, setInclPension] = useState(true)
  const [pensionRate, setPensionRate] = useState<0.02 | 0.04 | 0.06>(0.02)
  const [outputPeriod, setOutputPeriod] = useState<TaxFreeOutputPeriod>('monthly')
  const [retired, setRetired] = useState(false)

  const hasAmount = amount != null && amount > 0

  const input: TaxFreeInput = useMemo(() => ({
    year, inputMode, amount: amount ?? 0, inputPeriod, workHoursPerMonth: workHours,
    includeEmployeeUnemployment: inclUI, includeFundedPension: inclPension,
    fundedPensionRate: pensionRate, outputPeriod, retired,
  }), [year, inputMode, amount, inputPeriod, workHours, inclUI, inclPension, pensionRate, outputPeriod, retired])

  const result = useMemo(() => hasAmount ? calculateTaxFree(input) : null, [input, hasAmount])

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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-2" style={{ color: 'var(--text)' }}>Maksuvaba tulu kalkulaator</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-base">Arvuta oma maksuvaba tulu suurus sissetuleku põhjal</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-start">
            <section className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <Field label="Aasta">
                <Segmented value={String(year)} options={[{ value: '2026', label: '2026' }, { value: '2025', label: '2025' }]} onChange={v => setYear(Number(v) as TaxFreeYear)} />
              </Field>

              <Collapse open={year === 2026}>
                <label className="flex items-center gap-3 text-sm cursor-pointer mb-5">
                  <input type="checkbox" checked={retired} onChange={e => setRetired(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                  Vanaduspensioniealine
                </label>
              </Collapse>

              <Collapse open={year === 2025}>
                <Field label="Sisestamise viis">
                  <Segmented value={inputMode} options={[{ value: 'gross', label: 'Brutopalk' }, { value: 'net', label: 'Netopalk' }]} onChange={v => setInputMode(v as TaxFreeInputMode)} />
                </Field>

                <Field label="Periood">
                  <Segmented value={inputPeriod} options={[{ value: 'hourly', label: 'Tunnis' }, { value: 'monthly', label: 'Kuus' }, { value: 'annual', label: 'Aastas' }]}
                    onChange={v => setInputPeriod(v as TaxFreeInputPeriod)} />
                </Field>

                <Collapse open={inputPeriod === 'hourly'}>
                  <Field label="Töötunnid kuus">
                    <div className="relative">
                      <input type="number" className="calc-input" style={{ paddingRight: 32 }} placeholder="160" value={workHours}
                        onChange={e => setWorkHours(Number(e.target.value) || 160)} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)]" style={{ fontFamily: 'var(--font-mono)' }}>h</span>
                    </div>
                  </Field>
                </Collapse>

                <Field label={inputMode === 'net' ? 'Netopalk' : 'Brutopalk'}>
                  <div className="relative">
                    <input type="number" inputMode="decimal" className="calc-input" style={{ paddingRight: 32 }}
                      placeholder="nt. 1600" value={amount ?? ''}
                      onChange={e => setAmount(e.target.value === '' ? null : Number(e.target.value))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)]" style={{ fontFamily: 'var(--font-mono)' }}>€</span>
                  </div>
                </Field>

                <div className="flex flex-col gap-3 mb-5">
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={inclUI} onChange={e => setInclUI(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Töötuskindlustusmakse (1.6%)
                  </label>
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={inclPension} onChange={e => setInclPension(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
                    Kogumispension (II sammas)
                  </label>
                  <Collapse open={inclPension}>
                    <Segmented value={String(pensionRate)}
                      options={[{ value: '0.02', label: '2%' }, { value: '0.04', label: '4%' }, { value: '0.06', label: '6%' }]}
                      onChange={v => setPensionRate(Number(v) as 0.02 | 0.04 | 0.06)} />
                  </Collapse>
                </div>

                <Field label="Tulemuse periood">
                  <Segmented value={outputPeriod} options={[{ value: 'monthly', label: 'Kuus' }, { value: 'annual', label: 'Aastas' }]}
                    onChange={v => setOutputPeriod(v as TaxFreeOutputPeriod)} />
                </Field>
              </Collapse>
            </section>

            <section className="flex flex-col gap-4 lg:sticky lg:top-6">
              {!result && year === 2025 && (
                <div className="rounded-2xl p-14 text-center fade-up" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-elev)', color: 'var(--text-muted)' }}>
                  <p className="text-[15px]">Sisesta summa tulemuse nägemiseks</p>
                </div>
              )}

              {(result || year === 2026) && (
                <div className="result-card fade-up">
                  <header className="result-head">
                    <span className="text-[13px] font-semibold tracking-wide uppercase text-[var(--text-muted)]">Maksuvaba tulu</span>
                    <div className="text-right flex-shrink-0">
                      <div className="result-num">{result ? result.taxFreeAmount : (retired ? '776.00' : '700.00')} €</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{outputPeriod === 'annual' ? 'aastas' : 'kuus'}</div>
                    </div>
                  </header>
                  {result && year === 2025 && (
                    <div className="p-5 sm:px-6">
                      <div className="text-sm flex flex-col gap-2" style={{ color: 'var(--text-muted)' }}>
                        <span>Aastatulu arvestuses: <strong style={{ color: 'var(--text)' }}>{result.annualRevenue} €</strong></span>
                        {Number(result.annualRevenue) < 14400 && <span className="text-xs">Aastatulu alla 14 400 € — täielik maksuvabastus</span>}
                        {Number(result.annualRevenue) >= 14400 && Number(result.annualRevenue) <= 25200 && <span className="text-xs">Aastatulu 14 400–25 200 € vahemikus — vähendatud maksuvaba tulu</span>}
                        {Number(result.annualRevenue) > 25200 && <span className="text-xs">Aastatulu üle 25 200 € — maksuvaba tulu puudub</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="banner" style={{ color: 'var(--text-muted)' }}>
                <span className="flex-shrink-0">ℹ️</span>
                <div className="text-[13px]">
                  {year === 2026
                    ? `2026. aastal on maksuvaba tulu ${retired ? '776' : '700'} €/kuus (${retired ? '9 312' : '8 400'} €/aastas). ${retired ? 'Vanaduspensioniea' : 'Fikseeritud'} summa, ei sõltu sissetulekust.`
                    : 'Kuni 14 400 € aastatuluga: täismäär 654 €/kuus. Tuluga 14 400–25 200 €: vähenev. Üle 25 200 €: 0 €.'}
                </div>
              </div>
            </section>
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

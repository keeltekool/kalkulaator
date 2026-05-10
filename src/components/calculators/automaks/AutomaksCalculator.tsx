'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { calculateAutomaks } from '@/calculators/automaks/calculate'
import { VehicleType, EngineType, Co2Standard, FuelType } from '@/calculators/automaks/types'
import type { AutomaksInput, AutomaksResult, TaxComponents } from '@/calculators/automaks/types'

// ── Collapse wrapper ──
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`field-collapse${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="field-inner">{children}</div>
    </div>
  )
}

// ── Segmented toggle ──
function Segmented({ value, options, onChange, responsive = false }: {
  value: string; options: { value: string; label: string }[]
  onChange: (v: string) => void; responsive?: boolean
}) {
  return (
    <div className={`seg${responsive ? ' responsive' : ''}`}>
      {options.map(opt => (
        <button key={opt.value} type="button"
          className={`seg-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}>{opt.label}</button>
      ))}
    </div>
  )
}

// ── Toggle switch ──
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="toggle-row">
      <span className="text-sm font-medium">{label}</span>
      <button type="button" className={`toggle${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)} aria-pressed={checked} />
    </div>
  )
}

// ── Number input with suffix ──
function NumInput({ value, onChange, placeholder, suffix }: {
  value: number | null; onChange: (v: number | null) => void; placeholder: string; suffix?: string
}) {
  return (
    <div className="relative">
      <input type="number" inputMode="numeric" className="calc-input" style={suffix ? { paddingRight: 48 } : undefined}
        placeholder={placeholder} value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)] pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>{suffix}</span>}
    </div>
  )
}

// ── Animated number ──
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  useEffect(() => {
    const from = fromRef.current; const to = value
    if (from === to) return
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 300)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span>{display.toFixed(2)} €</span>
}

// ── Field wrapper ──
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <label className="text-[13px] font-semibold text-[var(--text)]">{label}</label>
      {children}
      {help && <div className="text-xs text-[var(--text-muted)] leading-snug">{help}</div>}
    </div>
  )
}

// ── Result card ──
function ResultCard({ variant, title, amount, caption, meta, lines, totalLabel }: {
  variant: 'accent' | 'info'; title: string; amount: number; caption: string; meta?: string
  lines: { label: string; amount: number | null; dash?: boolean; explain?: string }[]
  totalLabel: string
}) {
  return (
    <div className={`result-card fade-up${variant === 'info' ? ' is-info' : ''}`}>
      <header className="result-head">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold tracking-wide uppercase text-[var(--text-muted)]">{title}</span>
          {meta && <span className="text-[13px] text-[var(--text-muted)] mt-1 max-w-[32ch]">{meta}</span>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="result-num"><AnimatedNumber value={amount} /></div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{caption}</div>
        </div>
      </header>
      <div className="p-5 sm:px-6">
        <div className="flex flex-col gap-4">
          {lines.map((l, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="breakdown-line">
                <span className="text-sm text-[var(--text)]">{l.label}</span>
                <span className="amt text-sm">{l.dash ? '—' : `${(l.amount ?? 0).toFixed(2)} €`}</span>
              </div>
              {l.explain && <div className="text-xs text-[var(--text-muted)] leading-snug">{l.explain}</div>}
            </div>
          ))}
          <div className="h-px bg-[var(--border)] my-1" />
          <div className="breakdown-line breakdown-total">
            <span className="lbl">{totalLabel}</span>
            <span className="amt">{amount.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// VEHICLE OPTIONS
// ══════════════════════════════════════════════
const VEHICLE_OPTIONS = [
  { value: VehicleType.M1_M1G, label: 'Sõiduauto (M1)', glyph: '🚗' },
  { value: VehicleType.N1_N1G, label: 'Kaubik (N1)', glyph: '🚐' },
  { value: VehicleType.L3e_L4e_L5e_L6e_L7e, label: 'Mootorratas / ATV', glyph: '🏍️' },
  { value: VehicleType.MS2, label: 'Maastikusõiduk (MS2)', glyph: '🛻' },
  { value: VehicleType.T1b_T5, label: 'Traktor (T1b/T5)', glyph: '🚜' },
  { value: VehicleType.T3, label: 'Traktor (T3)', glyph: '🚜' },
]

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
export default function AutomaksCalculator() {
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

  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.M1_M1G)
  const [engine, setEngine] = useState<EngineType>(EngineType.ICE)
  const [regDate, setRegDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [co2Std, setCo2Std] = useState<Co2Standard>(Co2Standard.WLTP)
  const [co2, setCo2] = useState<number | null>(null)
  const [grossWeight, setGrossWeight] = useState<number | null>(null)
  const [isCamper, setIsCamper] = useState(false)
  const [fuel, setFuel] = useState<FuelType>(FuelType.PETROL)
  const [powerKw, setPowerKw] = useState<number | null>(null)
  const [kerbMass, setKerbMass] = useState<number | null>(null)
  const [engineCcm, setEngineCcm] = useState<number | null>(null)

  const isM1 = vehicleType === VehicleType.M1_M1G
  const isN1 = vehicleType === VehicleType.N1_N1G
  const isMoto = vehicleType === VehicleType.L3e_L4e_L5e_L6e_L7e
  const isOff = vehicleType === VehicleType.MS2 || vehicleType === VehicleType.T1b_T5 || vehicleType === VehicleType.T3
  const isEV = engine === EngineType.ELECTRIC

  const showEngineSelector = !isMoto && !isOff
  const showMotoEngine = isMoto
  const showCo2Std = (isM1 || isN1) && !isEV
  const showCo2Input = showCo2Std && (co2Std === Co2Standard.WLTP || co2Std === Co2Standard.NEDC)
  const showGrossMass = isM1 || isN1
  const showCamper = isM1
  const showFuel = (isM1 || isN1) && co2Std === Co2Standard.NOT_AVAILABLE && !isEV
  const showPowerKw = isN1 || ((isM1 || isN1) && co2Std === Co2Standard.NOT_AVAILABLE && !isEV)
  const showKerbMass = isN1 || ((isM1 || isN1) && co2Std === Co2Standard.NOT_AVAILABLE && !isEV) || vehicleType === VehicleType.MS2 || vehicleType === VehicleType.T1b_T5
  const showCcm = (isMoto || vehicleType === VehicleType.MS2 || vehicleType === VehicleType.T1b_T5 || vehicleType === VehicleType.T3) && !isEV

  useEffect(() => {
    if (isMoto && (engine === EngineType.NOVC_HEV || engine === EngineType.OVC_HEV)) setEngine(EngineType.ICE)
  }, [isMoto, engine])

  const input: AutomaksInput = useMemo(() => ({
    vehicleType, isHouse: showCamper ? isCamper : false,
    initialRegDate: regDate, grossWeight: showGrossMass ? grossWeight : null,
    generalEngineType: engine, co2Standard: showCo2Std ? co2Std : Co2Standard.NOT_AVAILABLE,
    co2Emission: showCo2Input ? co2 : null, fuelType: showFuel ? fuel : FuelType.PETROL,
    maxNetPower: showPowerKw ? powerKw : null, kerbMass: showKerbMass ? kerbMass : null,
    engineCapacity: showCcm ? engineCcm : null,
  }), [vehicleType, engine, regDate, co2Std, co2, grossWeight, isCamper, fuel, powerKw, kerbMass, engineCcm,
    showCo2Std, showCo2Input, showGrossMass, showCamper, showFuel, showPowerKw, showKerbMass, showCcm])

  const hasEnough = useMemo(() => {
    if (!regDate) return false
    if (isMoto) return isEV || (engineCcm != null && engineCcm > 0)
    if (isOff) return showCcm ? (engineCcm != null && engineCcm > 0) : true
    if (isEV) return grossWeight != null && grossWeight > 0
    if (co2Std === Co2Standard.NOT_AVAILABLE) return powerKw != null && powerKw > 0 && kerbMass != null && kerbMass > 0 && grossWeight != null && grossWeight > 0
    return co2 != null && co2 > 0 && grossWeight != null && grossWeight > 0
  }, [regDate, isMoto, isOff, isEV, co2Std, co2, grossWeight, powerKw, kerbMass, engineCcm, showCcm])

  const result: AutomaksResult | null = useMemo(() => hasEnough ? calculateAutomaks(input) : null, [input, hasEnough])

  const vanRatio = isN1 && powerKw && kerbMass && kerbMass > 0 ? powerKw / kerbMass : null
  const vanLabel = vanRatio != null ? (vanRatio > 0.20 ? 'Klassifitseeritud: võimsam kaubik' : 'Klassifitseeritud: nõrgem kaubik') : null
  const vanStrong = vanRatio != null ? vanRatio > 0.20 : null

  const engineOptions = isMoto
    ? [{ value: EngineType.ICE, label: 'Sisepõlemis' }, { value: EngineType.ELECTRIC, label: 'Elektri' }]
    : [{ value: EngineType.ICE, label: 'Sisepõlemis' }, { value: EngineType.NOVC_HEV, label: 'Hübriid' },
       { value: EngineType.OVC_HEV, label: 'Pistikhübriid' }, { value: EngineType.ELECTRIC, label: 'Elektri' }]

  function buildLines(comp: TaxComponents, isAnnual: boolean): { label: string; amount: number | null; dash?: boolean; explain?: string }[] {
    const lines: { label: string; amount: number | null; dash?: boolean; explain?: string }[] = []
    lines.push({ label: 'Baasosa', amount: comp.baseAmount, explain: 'Fikseeritud baasosa' })

    const isPHEVMissing = engine === EngineType.OVC_HEV && co2Std === Co2Standard.NOT_AVAILABLE
    if (result?.derived.vehicleGroup === 'car_or_powerful_van' || result?.derived.vehicleGroup === 'weak_van_or_dwelling') {
      if (isAnnual && isPHEVMissing) {
        lines.push({ label: 'CO₂ eriheite osa', amount: null, dash: true, explain: 'Pistikhübriidil puuduva CO₂ andmetega CO₂ osa aastamaksust ei arvestata' })
      } else {
        const co2Explain = result?.derived.effectiveCo2Emission != null
          ? `CO₂ heide ${Math.round(result.derived.effectiveCo2Emission)} g/km${result.derived.estimatedCo2 ? ' (hinnanguline)' : ''}, vanuskoefitsient ${isAnnual ? result.derived.annualAgeMultiplier.toFixed(2) : result.derived.registrationAgeMultiplier.toFixed(2)}`
          : undefined
        lines.push({ label: 'CO₂ eriheite osa', amount: comp.co2Amount, explain: co2Explain })
      }
      if (result?.derived.vehicleGroup === 'car_or_powerful_van') {
        lines.push({ label: 'Massiosa', amount: comp.massAmount,
          explain: grossWeight ? `Täismass ${grossWeight} kg, vanuskoefitsient ${isAnnual ? result?.derived.annualAgeMultiplier.toFixed(2) : result?.derived.registrationAgeMultiplier.toFixed(2)}` : undefined })
      }
    }
    return lines
  }

  const scrollToResults = () => document.querySelector('[data-results]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 no-underline" style={{ color: 'var(--text)' }}>
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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-2" style={{ color: 'var(--text)' }}>Automaksu kalkulaator</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-base">Arvuta oma sõiduki aastamaks ja registreerimistasu</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-6 lg:gap-8 items-start">
            {/* INPUT COLUMN */}
            <section className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <Field label="Sõiduki tüüp">
                <select className="calc-select" value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)}>
                  {VEHICLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.glyph}  {o.label}</option>)}
                </select>
              </Field>

              {(showEngineSelector || showMotoEngine) && (
                <Field label="Mootori tüüp">
                  <Segmented value={engine} options={engineOptions.map(o => ({ value: o.value, label: o.label }))}
                    onChange={v => setEngine(v as EngineType)} responsive={!isMoto} />
                </Field>
              )}

              <Field label="Esmaregistreerimise kuupäev" help="Leitav sõiduki registreerimistunnistuselt">
                <input type="date" className="calc-input" value={regDate} onChange={e => setRegDate(e.target.value)} />
              </Field>

              <Collapse open={showCo2Std}>
                <Field label="CO₂ heitme standard" help="Leitav sõiduki registreerimistunnistuselt">
                  <Segmented value={co2Std}
                    options={[{ value: Co2Standard.WLTP, label: 'WLTP' }, { value: Co2Standard.NEDC, label: 'NEDC' }, { value: Co2Standard.NOT_AVAILABLE, label: 'Puudub' }]}
                    onChange={v => setCo2Std(v as Co2Standard)} />
                </Field>
              </Collapse>

              <Collapse open={showCo2Input}>
                <Field label="CO₂ heide (g/km)">
                  <NumInput value={co2} onChange={setCo2} placeholder="nt. 145" suffix="g/km" />
                </Field>
              </Collapse>

              <Collapse open={showFuel}>
                <Field label="Kütuse tüüp">
                  <Segmented value={fuel}
                    options={[{ value: FuelType.PETROL, label: 'Bensiin' }, { value: FuelType.DIESEL, label: 'Diisel' }]}
                    onChange={v => setFuel(v as FuelType)} />
                </Field>
              </Collapse>

              <Collapse open={showPowerKw}>
                <Field label="Mootori võimsus (kW)">
                  <NumInput value={powerKw} onChange={setPowerKw} placeholder="nt. 100" suffix="kW" />
                </Field>
              </Collapse>

              <Collapse open={showKerbMass}>
                <Field label="Tühimass (kg)">
                  <NumInput value={kerbMass} onChange={setKerbMass} placeholder="nt. 1600" suffix="kg" />
                </Field>
              </Collapse>

              {vanLabel && <div className={`badge mb-5 ${vanStrong ? '' : 'is-info'}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{vanLabel}</div>}

              <Collapse open={showGrossMass}>
                <Field label="Täismass (kg)" help="Sõiduki täismass kilogrammides">
                  <NumInput value={grossWeight} onChange={setGrossWeight} placeholder="nt. 2100" suffix="kg" />
                </Field>
              </Collapse>

              <Collapse open={showCamper}>
                <Field label="Sõiduki eriotstarve">
                  <Toggle checked={isCamper} onChange={setIsCamper} label="Sõiduk on elamu (matkaauto)" />
                </Field>
              </Collapse>

              <Collapse open={showCcm}>
                <Field label="Mootori töömaht (cm³)">
                  <NumInput value={engineCcm} onChange={setEngineCcm} placeholder="nt. 600" suffix="cm³" />
                </Field>
              </Collapse>
            </section>

            {/* RESULTS COLUMN */}
            <section className="flex flex-col gap-4 lg:sticky lg:top-6" data-results>
              {!result && (
                <div className="rounded-2xl p-14 text-center fade-up" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-elev)', color: 'var(--text-muted)' }}>
                  <div className="w-14 h-14 rounded-xl grid place-items-center mx-auto mb-4" style={{ background: 'var(--bg-subtle)', color: 'var(--text-subtle)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2"/></svg>
                  </div>
                  <p className="text-[15px] max-w-[28ch] mx-auto">Sisesta sõiduki andmed tulemuse nägemiseks</p>
                </div>
              )}

              {result && (
                <ResultCard variant="accent" title="Aastamaks" amount={result.annualTax} caption="aastas"
                  meta="Makstakse kahes osas: 50% 15. juuniks, 50% 15. detsembriks"
                  lines={buildLines(result.annual, true)} totalLabel="Aastamaks kokku" />
              )}

              {result && result.derived.vehicleGroup !== 'motorcycle_atv_tractor' && result.derived.vehicleGroup !== 'unsupported' && (
                <ResultCard variant="info" title="Registreerimistasu" amount={result.registrationFee} caption="ühekordne tasu omanikuvahetusel"
                  lines={buildLines(result.registration, false)} totalLabel="Registreerimistasu kokku" />
              )}

              {result && (
                <div className="banner is-warn">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warn-text)' }}>ℹ️</span>
                  <div>
                    <div className="font-semibold mb-0.5">2026. aastal vähendatakse automaksu 100 € iga alla 18-aastase lapse kohta.</div>
                    <div style={{ color: 'var(--text-muted)' }}>Soodustust arvestab Maksu- ja Tolliamet automaatselt. Kalkulaator soodustust ei arvesta.</div>
                  </div>
                </div>
              )}

              {result && (
                <div className="banner" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex-shrink-0 mt-0.5">ℹ️</span>
                  <div className="text-[13px]">
                    Maks arvutatakse 1. jaanuari seisuga. Sõiduki vanus arvestatakse järgmise maksuaasta algusest (01.01.{new Date().getFullYear() + 1}).
                    <div className="mt-1">Sõiduki vanus: <strong style={{ color: 'var(--text)' }}>{result.derived.yearsSinceRegistration.toFixed(2)} aastat</strong></div>
                  </div>
                </div>
              )}

              {result?.warnings.map((w, i) => (
                <div key={i} className="banner is-warn">
                  <span className="flex-shrink-0">⚠️</span>
                  <div style={{ color: 'var(--warn-text)' }}>{w}</div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-[13px] border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-4">
          <span>© 2026 Kalkulaator</span>
          <span>Andmed põhinevad <a href="https://www.riigiteataja.ee/akt/103042025021" target="_blank" rel="noreferrer"
            className="underline decoration-[var(--border)] hover:text-[var(--text)]">mootorsõidukimaksu seadusel</a></span>
        </div>
      </footer>

      {/* Mobile sticky bar */}
      {result && (
        <div className={`sticky-bar${result ? ' is-visible' : ''}`}>
          <div className="flex gap-3 flex-wrap">
            <span><span className="text-[var(--text-muted)]">Aastamaks: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>{result.annualTax.toFixed(2)} €</span></span>
            {result.derived.vehicleGroup !== 'motorcycle_atv_tractor' && result.derived.vehicleGroup !== 'unsupported' && (
              <span><span className="text-[var(--text-muted)]">Reg.tasu: </span><span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--info-text)' }}>{result.registrationFee.toFixed(2)} €</span></span>
            )}
          </div>
          <button onClick={scrollToResults} className="px-3.5 py-2 rounded-full text-[13px] font-semibold border-0 cursor-pointer"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}>Vaata</button>
        </div>
      )}
    </div>
  )
}

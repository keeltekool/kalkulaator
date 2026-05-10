/* global React, ReactDOM, TaxLogic */
const { useState, useEffect, useMemo, useRef } = React;
const T = TaxLogic;

// =============================================================
// Small UI atoms
// =============================================================
function Field({ label, help, children, error }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {error ? <div className="field-help" style={{ color: "var(--danger)" }}>{error}</div> : help ? <div className="field-help">{help}</div> : null}
    </div>
  );
}

function Collapse({ open, children }) {
  return (
    <div className={"field-collapse" + (open ? " is-open" : "")} aria-hidden={!open}>
      <div className="field-inner">{children}</div>
    </div>
  );
}

function Segmented({ value, options, onChange, responsive = false }) {
  return (
    <div className={"seg" + (responsive ? " responsive" : "")}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={"seg-btn" + (value === opt.value ? " is-active" : "")}
          onClick={() => onChange(opt.value)}
        >{opt.label}</button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">{label}</span>
      <button type="button" className={"toggle" + (checked ? " is-on" : "")} onClick={() => onChange(!checked)} aria-pressed={checked} />
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, suffix }) {
  return (
    <div className="input-wrap">
      <input
        type="number"
        inputMode="numeric"
        className="input"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
      />
      {suffix ? <span className="input-icon" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{suffix}</span> : null}
    </div>
  );
}

// =============================================================
// Animated counting number
// =============================================================
function AnimatedNumber({ value, duration = 300 }) {
  const [display, setDisplay] = useState(value || 0);
  const fromRef = useRef(value || 0);
  const startRef = useRef(performance.now());
  useEffect(() => {
    const from = fromRef.current;
    const to = value || 0;
    if (from === to) return;
    const start = performance.now();
    startRef.current = start;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * eased;
      setDisplay(cur);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display.toFixed(2)} €</span>;
}

// =============================================================
// Icons (small set, original)
// =============================================================
const Icon = {
  Sun: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  Moon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Calc: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0M8 19h2M12 19h2M16 19h0"/></svg>,
  Info: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h0"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
};

const VEHICLE_OPTIONS = [
  { value: "M1",     label: "Sõiduauto (M1)",       glyph: "🚗" },
  { value: "N1",     label: "Kaubik (N1)",          glyph: "🚐" },
  { value: "MOTO",   label: "Mootorratas / ATV",    glyph: "🏍️" },
  { value: "MS2",    label: "Maastikusõiduk (MS2)", glyph: "🛻" },
  { value: "T1B_T5", label: "Traktor (T1b/T5)",     glyph: "🚜" },
  { value: "T3",     label: "Traktor (T3)",         glyph: "🚜" },
];

// =============================================================
// MAIN APP
// =============================================================
function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("kalku-theme") || "light"; }
    catch { return "light"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("kalku-theme", theme); } catch {}
  }, [theme]);

  // ---- Form state ----
  const [vehicleType, setVehicleType] = useState("M1");
  const [engine, setEngine] = useState("ICE");
  const today = new Date().toISOString().slice(0, 10);
  const [registrationDate, setRegistrationDate] = useState(today);
  const [co2Std, setCo2Std] = useState("WLTP");
  const [co2, setCo2] = useState(160);
  const [grossMassKg, setGrossMassKg] = useState(2100);
  const [isCamper, setIsCamper] = useState(false);
  const [fuel, setFuel] = useState("PETROL");
  const [powerKw, setPowerKw] = useState(null);
  const [kerbMassKg, setKerbMassKg] = useState(null);
  const [engineCcm, setEngineCcm] = useState(null);

  // ---- Conditional visibility flags ----
  const isM1   = vehicleType === "M1";
  const isN1   = vehicleType === "N1";
  const isMoto = vehicleType === "MOTO";
  const isOff  = vehicleType === "MS2" || vehicleType === "T1B_T5" || vehicleType === "T3";
  const isEV   = engine === "EV";

  const showEngineSelector  = !isMoto && !isOff;
  const showMotoEngine      = isMoto;
  const showCo2Std          = (isM1 || isN1) && !isEV;
  const showCo2Input        = showCo2Std && (co2Std === "WLTP" || co2Std === "NEDC");
  const showGrossMass       = isM1 || isN1;
  const showCamper          = isM1;
  const showFuel            = (isM1 || isN1) && co2Std === "NONE" && !isEV;
  const showPowerKw         = (isN1) || ((isM1 || isN1) && co2Std === "NONE" && !isEV);
  const showKerbMass        = isN1 || ((isM1 || isN1) && co2Std === "NONE" && !isEV) || vehicleType === "MS2" || vehicleType === "T1B_T5" || vehicleType === "T3";
  const showCcm             = (isMoto || vehicleType === "MS2" || vehicleType === "T1B_T5" || vehicleType === "T3") && !isEV;

  // ---- Build input object ----
  const input = useMemo(() => ({
    vehicleType, engine, registrationDate,
    co2Std: showCo2Std ? co2Std : "NONE",
    co2: showCo2Input ? co2 : null,
    grossMassKg: showGrossMass ? grossMassKg : null,
    isCamper: showCamper ? isCamper : false,
    fuel: showFuel ? fuel : "PETROL",
    powerKw: showPowerKw ? powerKw : null,
    kerbMassKg: showKerbMass ? kerbMassKg : null,
    engineCcm: showCcm ? engineCcm : null,
  }), [
    vehicleType, engine, registrationDate, co2Std, co2, grossMassKg, isCamper,
    fuel, powerKw, kerbMassKg, engineCcm,
    showCo2Std, showCo2Input, showGrossMass, showCamper, showFuel, showPowerKw, showKerbMass, showCcm
  ]);

  const ready = T.hasMinimumInputs(input);
  const annual = useMemo(() => ready ? T.computeAnnual(input) : null, [input, ready]);
  const reg    = useMemo(() => ready ? T.computeRegistration(input) : null, [input, ready]);
  const vanClass = useMemo(() => isN1 ? T.vanClassification(powerKw, kerbMassKg) : null, [isN1, powerKw, kerbMassKg]);

  const ageInfo = T.vehicleAge(registrationDate);

  // Sticky bar visibility for mobile
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setStickyVisible(true), 100);
      return () => clearTimeout(t);
    } else {
      setStickyVisible(false);
    }
  }, [ready]);

  const scrollToResults = () => {
    const el = document.querySelector("[data-scroll-target]");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Engine options change for moto
  const engineOptions = isMoto
    ? [{ value: "ICE", label: "Sisepõlemis" }, { value: "EV", label: "Elektri" }]
    : [
        { value: "ICE",  label: "Sisepõlemis" },
        { value: "HEV",  label: "Hübriid" },
        { value: "PHEV", label: "Pistikhübriid" },
        { value: "EV",   label: "Elektri" },
      ];

  // If user switches to moto and engine was HEV/PHEV, snap to ICE
  useEffect(() => {
    if (isMoto && (engine === "HEV" || engine === "PHEV")) setEngine("ICE");
  }, [isMoto]); // eslint-disable-line

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <div className="brand-name">Kalku</div>
              <div className="brand-tag">Eesti kalkulaatorid</div>
            </span>
          </a>
          <button
            type="button"
            className="theme-toggle"
            aria-label="Vaheta värviteema"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Icon.Moon /> : <Icon.Sun />}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="page-head">
            <h1>Automaksu kalkulaator</h1>
            <p>Arvuta oma sõiduki aastamaks ja registreerimistasu</p>
          </div>

          <div className="grid">
            {/* INPUT COLUMN */}
            <section className="card" aria-label="Sisendid">
              {/* Vehicle type */}
              <Field label="Sõiduki tüüp">
                <select className="select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  {VEHICLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.glyph}  {o.label}</option>
                  ))}
                </select>
              </Field>

              {/* Engine (cars/vans) */}
              {(showEngineSelector || showMotoEngine) && (
                <Field label="Mootori tüüp">
                  <Segmented value={engine} options={engineOptions} onChange={setEngine} responsive={!isMoto} />
                </Field>
              )}

              {/* Registration date */}
              <Field label="Esmaregistreerimise kuupäev" help="Leitav sõiduki registreerimistunnistuselt">
                <input type="date" className="input" value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} />
              </Field>

              {/* CO2 standard */}
              <Collapse open={showCo2Std}>
                <Field label="CO₂ heitme standard" help="Leitav sõiduki registreerimistunnistuselt">
                  <Segmented
                    value={co2Std}
                    options={[
                      { value: "WLTP", label: "WLTP" },
                      { value: "NEDC", label: "NEDC" },
                      { value: "NONE", label: "Puudub" },
                    ]}
                    onChange={setCo2Std}
                  />
                </Field>
              </Collapse>

              {/* CO2 input */}
              <Collapse open={showCo2Input}>
                <Field label="CO₂ heide (g/km)">
                  <NumberInput value={co2} onChange={setCo2} placeholder="nt. 145" suffix="g/km" />
                </Field>
              </Collapse>

              {/* Fuel (when CO2 absent) */}
              <Collapse open={showFuel}>
                <Field label="Kütuse tüüp">
                  <Segmented
                    value={fuel}
                    options={[{ value: "PETROL", label: "Bensiin" }, { value: "DIESEL", label: "Diisel" }]}
                    onChange={setFuel}
                  />
                </Field>
              </Collapse>

              {/* Power kW */}
              <Collapse open={showPowerKw}>
                <Field label="Mootori võimsus (kW)">
                  <NumberInput value={powerKw} onChange={setPowerKw} placeholder="nt. 100" suffix="kW" />
                </Field>
              </Collapse>

              {/* Kerb mass */}
              <Collapse open={showKerbMass}>
                <Field label="Tühimass (kg)">
                  <NumberInput value={kerbMassKg} onChange={setKerbMassKg} placeholder="nt. 1600" suffix="kg" />
                </Field>
              </Collapse>

              {/* Van classification badge */}
              {isN1 && vanClass && (
                <div className={"badge " + (vanClass.strong ? "" : "is-info")} style={{ marginBottom: "var(--s-5)" }}>
                  <span className="dot" />
                  {vanClass.label}
                </div>
              )}

              {/* Gross mass */}
              <Collapse open={showGrossMass}>
                <Field label="Täismass (kg)" help="Sõiduki täismass kilogrammides">
                  <NumberInput value={grossMassKg} onChange={setGrossMassKg} placeholder="nt. 2100" suffix="kg" />
                </Field>
              </Collapse>

              {/* Camper toggle */}
              <Collapse open={showCamper}>
                <Field label="Sõiduki eriotstarve">
                  <Toggle checked={isCamper} onChange={setIsCamper} label="Sõiduk on elamu (matkaauto)" />
                </Field>
              </Collapse>

              {/* Engine ccm */}
              <Collapse open={showCcm}>
                <Field label="Mootori töömaht (cm³)">
                  <NumberInput value={engineCcm} onChange={setEngineCcm} placeholder="nt. 600" suffix="cm³" />
                </Field>
              </Collapse>
            </section>

            {/* RESULTS COLUMN */}
            <section className="results-col" data-scroll-target>
              {!ready && (
                <div className="card-empty fade-up">
                  <div className="empty-icon"><Icon.Calc /></div>
                  <p>Sisesta sõiduki andmed tulemuse nägemiseks</p>
                </div>
              )}

              {ready && annual && (
                <ResultCard
                  variant="accent"
                  title="Aastamaks"
                  amount={annual.total}
                  caption="aastas"
                  meta="Makstakse kahes osas: 50% 15. juuniks, 50% 15. detsembriks"
                  lines={annual.lines}
                  totalLabel="Aastamaks kokku"
                  notes={annual.notes}
                />
              )}

              {ready && reg && !reg.hidden && (
                <ResultCard
                  variant="info"
                  title="Registreerimistasu"
                  amount={reg.total}
                  caption="ühekordne tasu omanikuvahetusel"
                  lines={reg.lines}
                  totalLabel="Registreerimistasu kokku"
                  notes={reg.notes}
                />
              )}

              {ready && (
                <CollapsibleBanner
                  variant="warn"
                  title="2026. aastal vähendatakse automaksu 100 € iga alla 18-aastase lapse kohta."
                  body="Soodustust arvestab Maksu- ja Tolliamet automaatselt. Kalkulaator soodustust ei arvesta."
                />
              )}

              {ready && (
                <div className="banner is-neutral">
                  <span className="banner-icon"><Icon.Info /></span>
                  <div className="banner-body">
                    <div className="b-body">
                      Maks arvutatakse 1. jaanuari seisuga. Sõiduki vanus arvestatakse järgmise maksuaasta algusest (01.01.{new Date().getFullYear() + 1}).
                      <div style={{ marginTop: 4 }}>
                        Sõiduki vanus: <strong>{ageInfo.toFixed(2)} aastat</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <span>© 2026 Kalkulaator</span>
          <span>
            Andmed põhinevad <a href="https://www.riigiteataja.ee/akt/123" target="_blank" rel="noreferrer">mootorsõidukimaksu seadusel</a>
          </span>
        </div>
      </footer>

      {/* Mobile sticky summary */}
      {ready && annual && (
        <div className={"sticky-bar" + (stickyVisible ? " is-visible" : "")}>
          <div className="summary-pair">
            <span><span className="lbl">Aastamaks: </span><span className="amt a">{annual.total.toFixed(2)} €</span></span>
            {reg && !reg.hidden && <span><span className="lbl">Reg.tasu: </span><span className="amt b">{reg.total.toFixed(2)} €</span></span>}
          </div>
          <button className="scroll-btn" onClick={scrollToResults}>Vaata</button>
        </div>
      )}
    </div>
  );
}

// =============================================================
// Result card
// =============================================================
function ResultCard({ variant, title, amount, caption, meta, lines, totalLabel, notes }) {
  return (
    <div className={"result fade-up" + (variant === "info" ? " is-info" : "")}>
      <header className="result-head">
        <div className="result-title-block">
          <span className="result-title">{title}</span>
          {meta && <span className="result-meta">{meta}</span>}
        </div>
        <div className="result-amount">
          <div className="num"><AnimatedNumber value={amount} /></div>
          <div className="label">{caption}</div>
        </div>
      </header>
      <div className="result-body">
        <div className="breakdown">
          {lines.map((l) => (
            <div className="breakdown-row" key={l.key}>
              <div className="breakdown-line">
                <span className="lbl">{l.label}</span>
                <span className="amt">{l.dash ? "—" : (l.amount.toFixed(2) + " €")}</span>
              </div>
              {l.explain && <div className="breakdown-explain">{l.explain}</div>}
            </div>
          ))}
          <div className="breakdown-divider" />
          <div className="breakdown-line breakdown-total">
            <span className="lbl">{totalLabel}</span>
            <span className="amt">{amount.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// Collapsible banner
// =============================================================
function CollapsibleBanner({ variant, title, body }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={"banner " + (variant === "warn" ? "is-warn" : "is-neutral")}>
      <span className="banner-icon"><Icon.Info /></span>
      <div className="banner-body">
        <div className="b-title">{title}</div>
        {open && <div className="b-body">{body}</div>}
      </div>
      <button className="banner-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <Icon.ChevronDown />
      </button>
    </div>
  );
}

// =============================================================
// Mount
// =============================================================
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

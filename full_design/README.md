# Automaksu Kalkulaator — Handover Package

**Estonian Vehicle Tax Calculator**
A clean, mobile-first single-page app that calculates Estonian annual vehicle tax (Aastamaks) and registration fee (Registreerimistasu) live as the user types. No build step — just open `index.html`.

---

## What's in the box

```
.
├── index.html               # Calculator app — entry point
├── design-system.html       # Visual design system: tokens, type, components, states
├── styles.css               # All design tokens + component CSS (single source of truth)
├── src/
│   ├── tax-logic.js         # Pure JS tax math — framework-free, easy to port/test
│   └── app.jsx              # React app (Babel-transpiled in-browser)
├── README.md                # This file
└── screenshots/             # Reference screenshots
```

---

## Running

No build step. Open `index.html` directly in a browser, or serve the folder:

```bash
# Any static server works
npx serve .
# or
python3 -m http.server 8080
```

For production, swap the in-browser Babel transpiler for a precompiled bundle (Vite/Parcel/etc.).

---

## Design system at a glance

Open **`design-system.html`** for the full visual reference — tokens, typography, components, all interactive states.

| Token group | Notes |
|---|---|
| **Color** | Warm-neutral whites/blacks, single green accent (`oklch(0.62 0.15 155)`), blue + amber semantics. All tokens in `:root`; dark mode in `[data-theme="dark"]`. |
| **Type** | Plus Jakarta Sans (UI) + JetBrains Mono (numerics). 5 size steps. |
| **Spacing** | 8-pt scale (`--s-1` 4px → `--s-10` 72px). |
| **Radius** | 6 / 8 / 12 / 16 / 20 px + pill. |
| **Shadow** | 4 elevation steps, tuned for both themes. |
| **Motion** | 120 / 200 / 300 ms. `--ease-out` for UI, `--ease-spring` for toggles. |

Dark mode: persisted to `localStorage` under `kalku-theme`.

---

## Architecture

### `src/tax-logic.js` — pure calculation
Framework-agnostic, side-effect-free. Exports `window.TaxLogic` with:

- `computeAnnual(input) → { total, base, co2Component, massComponent, lines, notes, age, ageCoef }`
- `computeRegistration(input) → same shape (+ `hidden` for vehicle types without reg fee)`
- `vehicleAge(date)` — age at start of next tax year
- `annualAgeCoef(age)` / `regAgeCoef(age)` — separate decay curves
- `estimateCo2({ powerKw, kerbMassKg, age, fuel })` — fallback when CO₂ unknown
- `vanClassification(powerKw, kerbMassKg)` — N1 strong/weak split (0.20 ratio threshold)
- `hasMinimumInputs(input)` — gate for showing results

**Input shape** (all optional, presence drives logic):
```js
{
  vehicleType: "M1" | "N1" | "MOTO" | "MS2" | "T1B_T5" | "T3",
  engine:      "ICE" | "HEV" | "PHEV" | "EV",
  registrationDate: "YYYY-MM-DD",
  co2Std:      "WLTP" | "NEDC" | "NONE",
  co2:         number | null,         // g/km
  grossMassKg: number | null,
  isCamper:    boolean,
  fuel:        "PETROL" | "DIESEL",
  powerKw:     number | null,
  kerbMassKg:  number | null,
  engineCcm:   number | null,
}
```

> ⚠️ **Tax-band coefficients** in `tax-logic.js` (`co2BandAnnual`, `co2BandReg`, age coefficients, mass thresholds) are an approximation that matches the brief's example output (M1 / 160 g/km / 2100 kg → 210 € / 829 €). Before going live, replace them with the official values from the *Mootorsõidukimaksu seadus* and have the calculator audited by Maksu- ja Tolliamet.

### `src/app.jsx` — React UI
- Controlled form state (`useState` per field).
- Conditional visibility flags computed from form state, then fed to `<Collapse>` wrappers that animate height + opacity.
- `useMemo` re-runs the tax math only when inputs change.
- `<AnimatedNumber>` tweens the headline figure over 300ms when results change.
- `<ResultCard>` renders both Aastamaks and Registreerimistasu with the same component, swapping the accent (`accent` vs `info` variant) via a prop.

---

## Conditional field rules (matches brief)

| Field | Visible when |
|---|---|
| Mootori tüüp | not motorcycle/off-road/tractor (motorcycles get a 2-option variant) |
| CO₂ standard | (M1 ∨ N1) ∧ ¬EV |
| CO₂ heide (g/km) | CO₂ standard ∈ {WLTP, NEDC} |
| Kütuse tüüp | (M1 ∨ N1) ∧ CO₂ = NONE ∧ ¬EV |
| Mootori võimsus (kW) | N1 always; or CO₂ = NONE |
| Tühimass (kg) | N1 always; or CO₂ = NONE; or off-road/tractor |
| Täismass (kg) | M1 ∨ N1 |
| Sõiduk on elamu | M1 only |
| Mootori töömaht (cm³) | motorcycle ∨ off-road ∨ tractor; ∧ ¬EV |

Each appearance/disappearance animates 200 ms via CSS `grid-template-rows` 0fr↔1fr.

---

## State coverage

All special states from the brief are implemented in `app.jsx`:

- ✅ Motorcycle / ATV — only annual base, no reg fee
- ✅ Electric motorcycle — `0.00 €` + maksuvaba note
- ✅ Electric car — CO₂ rows = 0 €, mass threshold raised to 2400 kg
- ✅ Van (N1) — always asks power + kerb mass, classification badge appears
- ✅ Missing CO₂ — derives estimate from power/mass/age/fuel; shows `(hinnanguline)` tag
- ✅ PHEV + missing CO₂ — annual CO₂ row dashed; reg CO₂ pinned at fixed 230 €
- ✅ Vehicle ≥ 20 years — annual = 0 €, reg fee still calculated at 0.05× multiplier
- ✅ Camper (matkaauto) — CO₂ + mass components scaled 0.5×
- ✅ Insufficient inputs — empty placeholder card, no calculation noise

---

## Responsive behaviour

| Breakpoint | Layout |
|---|---|
| `< 768px`  | Single column, results stack below inputs. Sticky bottom bar shows summary; tapping scrolls to results. Native mobile date / number inputs. |
| `768–1024px` | 50/50 split. Results column `position: sticky`. |
| `> 1024px` | 45/55 split, max-width 1200, results sticky. |

---

## Branding

The brand mark in the header is an **original** mark drawn purely in CSS (rounded-square + plus-glyph clip-path). It is *not* a copy of any existing logo. Replace with your final brand asset when ready.

---

## License & legal

Calculator output is illustrative. The official assessment is performed by Maksu- ja Tolliamet. The footer links to *Riigi Teataja* for the canonical text of the law. Confirm exact band rates and thresholds against the act before publishing public-facing numbers.

---

## Next steps for production

1. Replace in-browser Babel with a real bundler (Vite recommended).
2. Swap the heuristic CO₂ bands for officially published values.
3. Add `vitest` unit tests for `tax-logic.js` covering every state in the brief.
4. Add i18n scaffolding (currently Estonian-only — `et-EE` formatting baked in).
5. Add analytics-free event hooks if usage stats are required.
6. Replace the placeholder Riigi Teataja link with the canonical act URL.

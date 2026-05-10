# Automaks MVP — Product Requirements Document

**Project:** Kalkulaator (Estonian calculator aggregator)
**Calculator:** Automaksu kalkulaator (Vehicle Tax Calculator)
**Date:** 2026-05-10 (updated after design review)
**Status:** AWAITING APPROVAL
**Source authority:** `CALCULATOR_MVP_SOURCE_HANDOFF.md` (Codex extraction, verified 2026-05-10)
**Design authority:** `full_design/` (Claude Design output — UI/UX layer only)

---

## 1. WHAT

A standalone Estonian vehicle tax calculator — the first calculator in a new aggregator site that will compete with kalkulaator.ee. Calculates annual motor vehicle tax and one-time registration fee with full component breakdowns.

## 2. WHY THIS FIRST

- Estonia's car tax is **brand new** (2025) — high search volume, public confusion
- kalkulaator.ee's version is buried in ads, ugly, no mobile optimization
- Complex enough to prove trust, simple enough for a focused MVP
- No external APIs needed — all client-side math from published law

## 3. TECH STACK

- **Next.js 16** (App Router)
- **Tailwind CSS** (design tokens ported from `full_design/styles.css`)
- **TypeScript** (strict)
- **Vitest** (unit tests)
- **Vercel** (deploy)
- **No database** — pure client-side calculation
- **Fonts:** Plus Jakarta Sans (UI) + JetBrains Mono (numbers) — from design output

## 4. DESIGN INTEGRATION STRATEGY

The `full_design/` directory contains a complete UI package from Claude Design. After thorough review, the integration plan is:

### 4.1 KEEP FROM DESIGN (UI/UX layer — all excellent)

| Asset | Source | Use as |
|-------|--------|--------|
| Design tokens | `styles.css` `:root` block | Port to `tailwind.config.ts` custom theme |
| Color system | oklch-based light + dark tokens | Exact values into Tailwind `extend.colors` |
| Typography | Plus Jakarta Sans + JetBrains Mono | Google Fonts import, Tailwind font config |
| Spacing scale | `--s-1` through `--s-10` (4px–72px) | Tailwind spacing overrides |
| Border radii | 6/8/12/16/20px + pill | Tailwind `borderRadius` config |
| Shadow system | 4 elevation steps, both themes | Tailwind `boxShadow` config |
| Motion system | 120/200/300ms with custom easings | CSS custom properties in `globals.css` |
| Component: `<Collapse>` | `grid-template-rows: 0fr↔1fr` animation | Port to TSX, keep CSS approach |
| Component: `<Segmented>` | Pill-shaped toggle button group | Port to TSX |
| Component: `<Toggle>` | iOS-style switch with spring animation | Port to TSX |
| Component: `<NumberInput>` | Input with suffix unit label | Port to TSX |
| Component: `<AnimatedNumber>` | Cubic-eased counting animation (300ms) | Port to TSX |
| Component: `<ResultCard>` | Green/blue accent cards with breakdown rows | Port to TSX |
| Component: `<CollapsibleBanner>` | Info/warning banners with chevron toggle | Port to TSX |
| Layout: grid | 45%/55% desktop, 50/50 tablet, stacked mobile | Tailwind responsive grid |
| Layout: sticky results | `position: sticky; top: 24px` on results column | Tailwind `sticky top-6` |
| Empty state | Dashed border card with calculator icon + prompt | Port to TSX |
| Mobile sticky bar | Fixed bottom summary with spring slide-up | Port to TSX + CSS |
| Brand mark | CSS-only green square + plus glyph clip-path | Keep as-is |
| Dark mode toggle | Sun/Moon SVG icons, `data-theme` attribute | Port to Next.js `ThemeProvider` |
| Field visibility rules | Conditional show/hide based on vehicle/engine type | Port logic to TSX state |
| Estonian labels | All UI text in natural Estonian | Keep exact strings |

### 4.2 REPLACE FROM DESIGN (calculation logic — all wrong)

The design's `tax-logic.js` is explicitly an approximation (README states: *"an approximation that matches the brief's example output... replace with official values"*). **Every formula is wrong.** Full replacement with handoff-authority logic:

| Discrepancy | Design (WRONG) | Handoff (CORRECT) |
|------------|---------------|-------------------|
| Annual age multiplier | Linear: `max(0.30, 1 - 0.014 * age)` | 13-tier step function: `<5yr→1.00, 5→0.92, 6→0.84, 7→0.75, 8→0.67, 9→0.59, 10→0.51, 11→0.43, 12→0.35, 13→0.26, 14→0.18, 15-19→0.10, 20+→0` |
| Registration age multiplier | Linear: `max(0.05, 1 - 0.092 * age)` | 21-tier step function: `<1yr→1.00, 1→0.87, 2→0.75, 3→0.65, 4→0.56, 5→0.48, 6→0.42, 7→0.36, 8→0.31, 9→0.26, 10→0.22, 11→0.19, 12→0.16, 13→0.14, 14→0.12, 15→0.10, 16→0.09, 17→0.08, 18→0.07, 19→0.06, 20+→0.05` |
| CO₂ annual bands (car/powerful van) | `g*0.30 / 1.20 / 2.00 / 3.00` | `<118: 0€; 118-150: (co2-117)*3; 151-200: (co2-150)*3.5 + 33*3; 201+: (co2-200)*4 + 50*3.5 + 33*3` |
| CO₂ reg bands (car/powerful van) | `g*0.5 / 4.0 / 7.5 / 12.0` | `<118: co2*5; 118-150: (co2-117)*10 + 117*5; 151-200: (co2-150)*30 + 33*10 + 117*5; 201+: (co2-200)*50 + 50*30 + 33*10 + 117*5` |
| Mass annual rate | `over * 0.20`, no cap | `over * 0.4`, cap 400€ (EV cap 440€) |
| Mass reg rate | `over * 1.0`, no cap | `over * 2`, cap 2000€ (EV cap 2200€) |
| PHEV (OVC-HEV) mass threshold | 2000kg (same as ICE) | 2200kg |
| Weak van / dwelling car | MISSING — not implemented | Entirely separate branch: CO₂ thresholds 205/250/300, base tax 50€ (ICE) / 30€ (EV), reg base 300€ (ICE) / 200€ (EV), NO mass component |
| CO₂ bands (weak van/dwelling) | N/A (missing) | `<205: 0€; 205-250: (co2-204)*3; 251-300: (co2-250)*3.5 + 46*3; 301+: (co2-300)*4 + 50*3.5 + 46*3` |
| CO₂ reg bands (weak van/dwelling) | N/A (missing) | `<205: co2*2; 205-250: (co2-204)*30 + 204*2; 251-300: (co2-250)*35 + 46*30 + 204*2; 301+: (co2-300)*40 + 50*35 + 46*30 + 204*2` |
| Motorcycle/ATV | Single `30 * ageCoef` | Engine capacity tiers: ≤10yr: 51-125cc→30€, 126-500→45€, 501-1000→60€, 1001-1500→75€, >1500→90€; 10-20yr: shifted tiers; 20+yr: 0€ |
| MS2/T1b_T5/T3 handling | Arbitrary base (40/50/25) | MS2 ≤1000kg and T1b_T5 ≤1000kg use motorcycle engine tiers; T3 uses motorcycle tiers |
| NEDC coefficient | Always 1.21 | 1.21 for car/powerful van; 1.30 for weak van/dwelling |
| Missing CO₂ estimation | Heuristic: `80 + 0.5*kW + 0.04*mass + 0.6*age` | Car: `power*0.29 + mass*0.07 + age*4.92` with adjustments (diesel -35, diesel+HEV -52, petrol+HEV -39, PHEV→0); Weak van: `power*0.40 + mass*0.07 + age*5.16` with different adjustments; Cap at 350 |
| OVC-HEV missing CO₂ reg (weak van) | N/A (missing) | Fixed 69*2 = 138€ (no age multiplier) |
| Age calculation divisor | 365.25 days | 365 days (exact match to kalkulaator.ee source) |
| Camper handling | 50% factor applied to CO₂ + mass | Camper = M1 + isHouse → falls into "weak van/dwelling" group (different thresholds, no mass, no 50% factor) |

### 4.3 FILE MAPPING

```
DESIGN SOURCE                          → PRODUCTION TARGET
─────────────────────────────────────────────────────────────
full_design/styles.css (tokens only)   → tailwind.config.ts + app/globals.css
full_design/src/app.jsx (UI shell)     → components/calculators/automaks/AutomaksCalculator.tsx
full_design/src/tax-logic.js           → DELETE. Replace with:
                                          ├── calculators/automaks/types.ts
                                          ├── calculators/automaks/constants.ts
                                          ├── calculators/automaks/calculate.ts
                                          └── calculators/automaks/format.ts
full_design/design-system.html         → Reference only (not deployed)
full_design/screenshots/               → Reference only (not deployed)
```

## 5. SCOPE — IN

### Vehicle Support
- **Cars (M1/M1G):** Standard cars and dwelling vehicles (matkaauto)
- **Vans (N1/N1G):** Split into powerful (power/mass > 0.20) and weak (≤ 0.20)
- **Motorcycles/ATVs (L3e-L7e):** Engine capacity tiers
- **Off-road (MS2):** ≤1000kg uses motorcycle tiers, >1000kg unsupported branch
- **Tractors (T1b/T5, T3):** T1b/T5 ≤1000kg uses motorcycle tiers, T3 uses motorcycle tiers

### Engine Types
- ICE, NOVC-HEV (non-plug-in hybrid), OVC-HEV (plug-in hybrid), ELECTRIC

### CO₂ Modes
- WLTP (coefficient 1.0)
- NEDC (coefficient 1.21 for car/powerful van, 1.30 for weak van/dwelling)
- Missing (estimated from power + mass + age + fuel, with fuel/engine adjustments, cap 350)

### Tax Components
- Annual tax: base + CO₂ + mass (with annual age multiplier, vehicle-group-specific thresholds)
- Registration fee: base + CO₂ + mass (with registration age multiplier, separate thresholds)
- OVC-HEV + missing CO₂ exception: annual excludes CO₂ from total; reg uses fixed 230€ (car) / 138€ (weak van)

### UX Features
- Dynamic field visibility (fields appear/disappear based on selections)
- Live calculation as user types (no submit button)
- Component breakdown with per-line explanations
- Family discount notice (informational, not subtracted)
- Age calculation notice (shows exact age and next-year anchor)
- Van classification badge (powerful vs weak)
- Estimated CO₂ notice when using missing-CO₂ mode
- Dark mode with localStorage persistence
- Mobile sticky summary bar
- Shareable URL with calculation state (query params)

## 6. SCOPE — OUT (MVP)

- Other calculators (salary, VAT, loan — future phases)
- Vehicle comparison mode
- Car model database / autocomplete
- Family discount subtraction
- Russian language
- User accounts / saved vehicles
- Official registry API integration
- PDF export

## 7. ARCHITECTURE

```
src/
├── calculators/automaks/
│   ├── types.ts              # Enums (VehicleType, EngineType, Co2Standard, FuelType)
│   │                         # AutomaksInput, AutomaksResult, VehicleGroup
│   ├── constants.ts          # ANNUAL_AGE_MULTIPLIERS (13 tiers)
│   │                         # REG_AGE_MULTIPLIERS (21 tiers)
│   │                         # CO₂ thresholds per vehicle group
│   │                         # Mass rates, caps, thresholds per engine type
│   │                         # Motorcycle engine capacity tiers
│   │                         # NEDC coefficients per group
│   │                         # Missing CO₂ estimation coefficients
│   ├── calculate.ts          # calculateAutomaks(input, options?) → AutomaksResult
│   │                         # Pure, stateless, no DOM, no side effects
│   │                         # Sub-functions: vehicleAge(), getAnnualAgeMultiplier(),
│   │                         # getRegAgeMultiplier(), classifyVehicle(),
│   │                         # getEffectiveCo2(), estimateCo2(),
│   │                         # calcAnnualTax(), calcRegistrationFee()
│   ├── calculate.test.ts     # Golden fixtures A-D + unit tests per sub-function
│   └── format.ts             # formatEur(), formatAge(), Estonian labels map
├── components/calculators/automaks/
│   ├── AutomaksCalculator.tsx # Main calculator UI (calls calculateAutomaks)
│   ├── ResultCard.tsx         # Reusable green/blue result card with breakdown
│   ├── Collapse.tsx           # Animated field visibility wrapper
│   ├── Segmented.tsx          # Pill-shaped toggle button group
│   ├── NumberInput.tsx        # Input with suffix unit label
│   ├── AnimatedNumber.tsx     # Counting animation for result numbers
│   └── InfoBanner.tsx         # Collapsible info/warning banners
├── app/
│   ├── page.tsx              # Homepage — renders AutomaksCalculator
│   ├── layout.tsx            # Root layout (fonts, metadata, theme provider)
│   └── globals.css           # Design tokens (motion, custom properties)
└── lib/
    └── theme.ts              # Dark mode provider (localStorage + data-theme)
```

**Iron rule:** All formula logic lives in `calculate.ts`. Components call `calculateAutomaks(input)` and render the structured result. No math in TSX files.

## 8. CALCULATION PARITY — GOLDEN FIXTURES

Must match kalkulaator.ee output exactly. All fixtures use `referenceDate: 2026-05-10` (anchor: 2027-01-01, age: ~5.67 years).

### Fixture A: M1 ICE WLTP
```
Input: M1, ICE, reg 01.05.2021, WLTP, 160 g/km, 2100 kg
Annual:  50.00 (base) + 123.28 (CO₂) + 36.80 (mass) = 210.08 €
RegFee: 150.00 (base) + 583.20 (CO₂) + 96.00 (mass) = 829.20 €
Age multipliers: annual 0.92, registration 0.48
```

### Fixture B: M1 OVC-HEV Missing CO₂
```
Input: M1, OVC-HEV, reg 01.05.2021, missing CO₂, 2300 kg, 100 kW, 1800 kg kerb
Annual:  50.00 (base) + 0.00 (CO₂ excluded) + 36.80 (mass) = 86.80 €
RegFee: 150.00 (base) + 230.00 (fixed CO₂) + 96.00 (mass) = 476.00 €
```

### Fixture C: M1 Electric Heavy
```
Input: M1, EV, reg 01.05.2021, 2600 kg
Annual:  50.00 (base) + 0.00 (CO₂) + 73.60 (mass) = 123.60 €
RegFee: 150.00 (base) + 0.00 (CO₂) + 192.00 (mass) = 342.00 €
Mass calc: annual 0.92 * min((2600-2400)*0.4, 440) = 73.60; reg 0.48 * min((2600-2400)*2, 2200) = 192.00
```

### Fixture D: Motorcycle 600cc
```
Input: L3e, ICE, reg 01.05.2021, 600 cm³
Annual: 60.00 € (base only — 501-1000cc tier, ≤10 years)
RegFee: 0.00 € (motorcycles have no registration fee)
```

## 9. DESIGN SYSTEM — TOKEN MIGRATION

### Colors (from `styles.css`, ported to Tailwind)
```
Light:
  bg:          oklch(0.985 0.003 120)    → bg-primary
  bg-elev:     #ffffff                    → bg-card
  accent:      oklch(0.62 0.15 155)      → brand (green)
  info:        oklch(0.55 0.16 245)      → blue (registration fee)
  warn:        oklch(0.72 0.16 75)       → amber (warnings)
  
Dark: full oklch-based overrides via data-theme="dark" attribute
```

### Typography
```
UI font:      Plus Jakarta Sans (weights 400, 500, 600, 700)
Number font:  JetBrains Mono (tabular nums, weight 600, 700)
Base size:    15px
Result large: clamp(28px, 4vw, 34px)
```

### Layout
```
Desktop (>1024px):  45fr / 55fr grid, max-width 1200px
Tablet (768-1024):  1fr / 1fr grid
Mobile (<768px):    1fr stacked, sticky bottom bar
Results column:     position sticky, top 24px (desktop/tablet only)
```

## 10. UX IMPROVEMENTS OVER kalkulaator.ee

| Area | kalkulaator.ee | Our version |
|------|---------------|-------------|
| Ads | 5-7 ad units, 40% viewport | Zero ads |
| Layout | HTML tables, 2015 styling | Modern cards, oklch colors, Plus Jakarta Sans |
| Mobile | Not optimized | Mobile-first, sticky summary bar, native inputs |
| Results | Flat number grid | Animated number cards with green/blue accent borders |
| Fields | All visible at once, confusing | Dynamic visibility — only relevant fields shown |
| Feedback | Enter value → static result | Live calculation with 300ms counting animation |
| Education | Tiny `?` tooltip images | Inline explanation per result component |
| Dark mode | None | System-aware with localStorage persistence |
| Sharing | None | URL query parameters with full state |
| Annual vs Reg | Mixed in one table | Visually separate cards with different accent colors |
| Vehicle age | Not shown | Explicit display: "Sõiduki vanus: 5.67 aastat" |
| Van classification | Hidden | Badge: "Klassifitseeritud: võimsam/nõrgem kaubik" |
| Family discount | Text note, easy to miss | Prominent amber warning banner |

## 11. BUILD ORDER

### Phase A: Calculation Engine (types + constants + pure function)
- `types.ts` — all enums and input/output types from handoff Section 4-5
- `constants.ts` — all lookup tables from handoff Section 10-11
- `calculate.ts` — pure `calculateAutomaks()` from handoff Section 6-14
- No UI work in this phase

### Phase B: Test Suite (must pass before any UI)
- Unit tests for: `vehicleAge()`, `getAnnualAgeMultiplier()`, `getRegAgeMultiplier()`, `classifyVehicle()`, `getEffectiveCo2()`, `estimateCo2()`
- Golden fixture tests A-D from handoff Section 18
- Edge cases: 20+ year vehicle, OVC-HEV + missing CO₂, EV, motorcycle tiers, weak van branch
- **GATE: Phase C cannot start until all tests pass**

### Phase C: Next.js Project + UI Components
- `npx create-next-app` with TypeScript + Tailwind + App Router
- Port design tokens from `styles.css` to `tailwind.config.ts`
- Port UI components from `app.jsx` to TSX (Collapse, Segmented, Toggle, NumberInput, AnimatedNumber, ResultCard, InfoBanner)
- Wire `AutomaksCalculator.tsx` to call `calculateAutomaks()` and render results
- **Do NOT copy `tax-logic.js`** — use `calculate.ts` from Phase A

### Phase D: Polish + Responsive
- Mobile sticky summary bar
- Dark mode provider
- Field visibility animations (200ms grid-template-rows transition)
- Result number counting animation (300ms cubic ease)
- Empty state placeholder card
- Estonian labels and formatting
- URL state via query parameters

### Phase E: Cross-verify Against kalkulaator.ee
- Open both calculators side by side in browser
- Test minimum 5 vehicle configurations:
  1. M1 ICE WLTP (standard car)
  2. M1 OVC-HEV missing CO₂ (plug-in hybrid exception)
  3. M1 EV (electric car)
  4. N1 weak van (power/mass ≤ 0.20)
  5. Motorcycle 600cc
- Results must match to the cent

### Phase F: Deploy + Final E2E
- `vercel` CLI deploy
- Chrome DevTools verification on production URL
- Console errors check, network tab check
- Mobile viewport test
- Dark mode test

## 12. SUCCESS CRITERIA

- [ ] All golden fixture tests pass (A, B, C, D)
- [ ] All unit tests pass for sub-functions
- [ ] Manual cross-check against kalkulaator.ee matches for 5+ inputs
- [ ] No calculation logic in UI components
- [ ] Mobile-friendly layout with sticky summary bar
- [ ] Dark mode works with persistence
- [ ] Field visibility transitions are smooth (200ms)
- [ ] Family discount notice is visible
- [ ] Age calculation basis shown in UI
- [ ] Van classification badge shown for N1 vehicles
- [ ] Live at Vercel
- [ ] Page load < 2s, zero layout shift
- [ ] Zero console errors

## 13. RISK REGISTER

| Risk | Mitigation |
|------|-----------|
| Calculation doesn't match kalkulaator.ee | Golden fixtures as gate. Phase E cross-verification mandatory. |
| Design tokens don't port cleanly to Tailwind | oklch() has good browser support. Fallback hex values if needed. |
| Font loading delays | `next/font` with `display: swap`, preload both fonts |
| URL state breaks on special characters | Use `URLSearchParams` with proper encoding |
| Future calculator additions need different layout | Homepage will become aggregator index; calculator pages stay standalone |

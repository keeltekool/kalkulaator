# Kalkulaator — STACK

**Last updated:** 2026-05-12

## Overview
Estonian calculator aggregator. Two calculators live: Automaksu kalkulaator (vehicle tax) + Palgakalkulaator (salary/payroll). Competing with kalkulaator.ee.

## Live URLs
- **Production:** https://kalkulaator-six.vercel.app
- **GitHub:** https://github.com/keeltekool/kalkulaator

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + oklch design tokens |
| Fonts | Plus Jakarta Sans + JetBrains Mono (next/font) |
| Testing | Vitest (85 tests, 4 golden fixtures) |
| Hosting | Vercel |
| Database | None (pure client-side calculation) |

## Routes
- `/` — Aggregator homepage with calculator cards
- `/automaks` — Vehicle tax calculator
- `/palgakalkulaator` — Salary/payroll calculator

## Features
- Automaks calculator with exact parity to kalkulaator.ee
- Salary calculator with exact parity (185 total tests, 12 salary golden fixtures)
- All vehicle types: M1/N1/motorcycles/ATVs/tractors
- All engine types: ICE, hybrid, plug-in hybrid, electric
- CO₂ modes: WLTP, NEDC (with coefficient), missing (estimated)
- Annual tax + registration fee with component breakdowns
- Dynamic field visibility based on vehicle/engine selection
- Dark mode with localStorage persistence
- Mobile sticky summary bar
- Family discount notice (informational)
- Van classification badge (powerful vs weak)

## Architecture
- Calculation logic: `src/calculators/automaks/calculate.ts` (pure, stateless, tested)
- Constants: `src/calculators/automaks/constants.ts` (law-derived lookup tables)
- UI: `src/components/calculators/automaks/AutomaksCalculator.tsx`
- No calculation logic in UI components — iron rule

## Gotchas
- Age calculation uses 365 divisor (not 365.25) — matches kalkulaator.ee source exactly
- Age anchor is Jan 1 of NEXT calendar year, not current year
- OVC-HEV + missing CO₂ has special exceptions: annual excludes CO₂, reg uses fixed 230€/138€
- Camper (isHouse) = "weak van/dwelling" group, NOT a 50% factor
- NEDC coefficient differs by vehicle group: 1.21 (car/powerful van) vs 1.30 (weak van/dwelling)
- Design output's `tax-logic.js` was entirely wrong — replaced with exact formulas from law

## Environment Variables
None required. Pure client-side.

## Future Phases
- Phase 2: Salary calculator (palgakalkulaator) source handoff ready in `docs/handoffs/2026-05-12-salary-calculator-source-handoff.md`
- Phase 3: VAT calculator (käibemaksukalkulaator)
- Phase 3 handoff: `docs/handoffs/2026-05-12-vat-calculator-source-handoff.md`
- Phase 4: Loan calculator (laenukalkulaator)
- Aggregator homepage when 4+ calculators exist

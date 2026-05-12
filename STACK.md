# Kalkulaator — STACK

**Last updated:** 2026-05-12

## Overview
Estonian calculator aggregator with 5 calculators live. Competing with kalkulaator.ee. Zero ads, modern UX, exact calculation parity.

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
| Testing | Vitest (301 tests, 58 golden fixtures) |
| Hosting | Vercel |
| Database | None (pure client-side calculation) |

## Routes
- `/` — Aggregator homepage with calculator cards
- `/automaks` — Vehicle tax calculator (85 tests, 4 fixtures)
- `/palgakalkulaator` — Salary/payroll calculator (100 tests, 12 fixtures)
- `/kaibemaksukalkulaator` — VAT calculator (40 tests, 11 fixtures)
- `/laenukalkulaator` — Loan calculator (40 tests, 13 fixtures)
- `/maksuvaba-tulu-kalkulaator` — Tax-free income calculator (36 tests, 18 fixtures)

## Architecture
- Pattern: `src/calculators/{name}/types.ts + constants.ts + calculate.ts + calculate.test.ts`
- UI: `src/components/calculators/{name}/{Name}Calculator.tsx`
- Pages: `src/app/{route}/page.tsx`
- No calculation logic in UI components — iron rule
- All calculators share design tokens from `globals.css`

## Flywheel Workflow
Codex investigates kalkulaator.ee source → writes handoff document → Claude builds from handoff.
Handoffs stored in `docs/handoffs/`.

## Features (all calculators)
- Exact calculation parity with kalkulaator.ee (E2E verified for each)
- Dark mode with localStorage persistence
- Mobile sticky summary bar
- Live calculation as user types
- Responsive layout (45/55 desktop, stacked mobile)
- Dynamic field visibility

## Calculator-Specific Features
- **Automaks:** All vehicle types, engine types, CO₂ modes, age multiplier tables, mass caps, OVC-HEV exceptions
- **Palgakalkulaator:** Bidirectional gross/net/employer-cost, 2022-2026, sliding tax-free, pension/unemployment toggles
- **Käibemaksukalkulaator:** 9/13/22/24% rates, 3 input modes, quick amount chips, coefficient display
- **Laenukalkulaator:** 4 solve modes, RATE solver (secant method), years/months toggle, principal/interest bar
- **Maksuvaba tulu:** 2025 source-parity with sliding formula, 2026 flat mode, net reverse calculation

## Gotchas
- Automaks age uses 365 divisor (not 365.25), anchor is Jan 1 of NEXT year
- OVC-HEV + missing CO₂: annual excludes CO₂, reg uses fixed 230€/138€
- Camper = "weak van/dwelling" group, NOT a 50% factor
- NEDC coefficient: 1.21 (car/powerful van) vs 1.30 (weak van/dwelling)
- Salary: revenueCalc() runs before wageCalc() — two-step flow matters
- Loan: PMT rounded before total is computed (source parity)
- Loan: zero interest produces NaN (source quirk, UI shows friendly message)
- Tax-free: `taxfreeCalc.js` only has 2025; 2026 is product extension from salary constants

## Environment Variables
None required. Pure client-side.

## Future Phases
- More calculators: annuity, interest rate impact, unit converter, BMI, fuel consumption, currency converter
- SEO optimization per calculator page
- URL state (query params for shareable calculations)

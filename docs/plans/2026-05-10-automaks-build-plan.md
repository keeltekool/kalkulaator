# Automaks MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a modern Estonian vehicle tax calculator that produces identical results to kalkulaator.ee, with superior UX.

**Architecture:** Pure TypeScript calculation engine (tested in isolation) + Next.js 16 App Router UI (ported from Claude Design output). Calculation logic is separated into `src/calculators/automaks/` modules. UI components in `src/components/`. Design tokens from `full_design/styles.css` ported to Tailwind config.

**Tech Stack:** Next.js 16, TypeScript (strict), Tailwind CSS, Vitest, Vercel

**Source of Truth:**
- Calculation formulas: PRD Section 4.2 + conversation context (Codex handoff, kalkulaator.ee source extraction)
- UI/UX: `full_design/` directory (styles.css, app.jsx, design-system.html)
- Golden fixtures: PRD Section 8

---

## MILESTONE 1: Project Scaffold + Calculation Engine Types
**Gate:** Project compiles. Types importable. No tests yet.

---

### Task 1: Create Next.js project

**Files:**
- Create: `C:\Users\Kasutaja\Claude_Projects\kalkulaator\` (project root)

**Step 1: Initialize project**

Run:
```bash
cd "C:\Users\Kasutaja\Claude_Projects\kalkulaator"
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --no-import-alias --turbopack
```

Accept defaults. If directory has existing files (docs/, full_design/), say yes to proceed.

**Step 2: Install test dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Step 3: Add vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 4: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Verify project compiles**

Run: `npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js 16 project with Tailwind + Vitest"
```

---

### Task 2: Create type definitions

**Files:**
- Create: `src/calculators/automaks/types.ts`

**Step 1: Write the types file**

```ts
export enum VehicleType {
  M1_M1G = 'M1_M1G',
  N1_N1G = 'N1_N1G',
  L3e_L4e_L5e_L6e_L7e = 'L3e_L4e_L5e_L6e_L7e',
  MS2 = 'MS2',
  T1b_T5 = 'T1b_T5',
  T3 = 'T3',
}

export enum EngineType {
  ICE = 'ICE',
  NOVC_HEV = 'NOVC_HEV',
  OVC_HEV = 'OVC_HEV',
  ELECTRIC = 'ELECTRIC',
}

export enum Co2Standard {
  WLTP = 'WLTP',
  NEDC = 'NEDC',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  OTHER = 'OTHER',
}

export type VehicleGroup =
  | 'car_or_powerful_van'
  | 'weak_van_or_dwelling'
  | 'motorcycle_atv_tractor'
  | 'unsupported'

export interface AutomaksInput {
  vehicleType: VehicleType
  isHouse: boolean
  initialRegDate: string          // dd.mm.yyyy or yyyy-mm-dd
  grossWeight: number | null      // kg
  generalEngineType: EngineType
  co2Standard: Co2Standard
  co2Emission: number | null      // g/km
  fuelType: FuelType
  maxNetPower: number | null      // kW
  kerbMass: number | null         // kg
  engineCapacity: number | null   // cm³
}

export interface TaxComponents {
  baseAmount: number
  co2Amount: number
  massAmount: number
}

export interface AutomaksResult {
  annualTax: number
  annual: TaxComponents
  registrationFee: number
  registration: TaxComponents
  derived: {
    yearsSinceRegistration: number
    annualAgeMultiplier: number
    registrationAgeMultiplier: number
    effectiveCo2Emission: number | null
    emissionCoefficient: number | null
    vehicleGroup: VehicleGroup
    estimatedCo2: boolean
  }
  warnings: string[]
}

export interface CalculationOptions {
  referenceDate?: Date
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/calculators/automaks/types.ts`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/calculators/automaks/types.ts && git commit -m "feat(automaks): add type definitions for input, output, and enums"
```

---

### Task 3: Create constants

**Files:**
- Create: `src/calculators/automaks/constants.ts`

**Step 1: Write the constants file**

All values from PRD Section 4.2 and handoff Sections 10-14. Every number is law-derived from kalkulaator.ee source.

```ts
export const ANNUAL_AGE_MULTIPLIERS: Array<{ minAge: number; multiplier: number }> = [
  { minAge: 20, multiplier: 0 },
  { minAge: 15, multiplier: 0.10 },
  { minAge: 14, multiplier: 0.18 },
  { minAge: 13, multiplier: 0.26 },
  { minAge: 12, multiplier: 0.35 },
  { minAge: 11, multiplier: 0.43 },
  { minAge: 10, multiplier: 0.51 },
  { minAge: 9,  multiplier: 0.59 },
  { minAge: 8,  multiplier: 0.67 },
  { minAge: 7,  multiplier: 0.75 },
  { minAge: 6,  multiplier: 0.84 },
  { minAge: 5,  multiplier: 0.92 },
  { minAge: 0,  multiplier: 1.00 },
]

export const REG_AGE_MULTIPLIERS: Array<{ minAge: number; multiplier: number }> = [
  { minAge: 20, multiplier: 0.05 },
  { minAge: 19, multiplier: 0.06 },
  { minAge: 18, multiplier: 0.07 },
  { minAge: 17, multiplier: 0.08 },
  { minAge: 16, multiplier: 0.09 },
  { minAge: 15, multiplier: 0.10 },
  { minAge: 14, multiplier: 0.12 },
  { minAge: 13, multiplier: 0.14 },
  { minAge: 12, multiplier: 0.16 },
  { minAge: 11, multiplier: 0.19 },
  { minAge: 10, multiplier: 0.22 },
  { minAge: 9,  multiplier: 0.26 },
  { minAge: 8,  multiplier: 0.31 },
  { minAge: 7,  multiplier: 0.36 },
  { minAge: 6,  multiplier: 0.42 },
  { minAge: 5,  multiplier: 0.48 },
  { minAge: 4,  multiplier: 0.56 },
  { minAge: 3,  multiplier: 0.65 },
  { minAge: 2,  multiplier: 0.75 },
  { minAge: 1,  multiplier: 0.87 },
  { minAge: 0,  multiplier: 1.00 },
]

export const MOTO_TAX_YOUNG: Array<{ minCc: number; maxCc: number; tax: number }> = [
  { minCc: 1501, maxCc: Infinity, tax: 90 },
  { minCc: 1001, maxCc: 1500,     tax: 75 },
  { minCc: 501,  maxCc: 1000,     tax: 60 },
  { minCc: 126,  maxCc: 500,      tax: 45 },
  { minCc: 51,   maxCc: 125,      tax: 30 },
]

export const MOTO_TAX_OLD: Array<{ minCc: number; maxCc: number; tax: number }> = [
  { minCc: 1501, maxCc: Infinity, tax: 75 },
  { minCc: 1001, maxCc: 1500,     tax: 60 },
  { minCc: 501,  maxCc: 1000,     tax: 45 },
  { minCc: 126,  maxCc: 500,      tax: 30 },
]

export const MASS_CONFIG = {
  car_or_powerful_van: {
    ICE:      { threshold: 2000, annualRate: 0.4, annualCap: 400, regRate: 2, regCap: 2000 },
    NOVC_HEV: { threshold: 2000, annualRate: 0.4, annualCap: 400, regRate: 2, regCap: 2000 },
    OVC_HEV:  { threshold: 2200, annualRate: 0.4, annualCap: 400, regRate: 2, regCap: 2000 },
    ELECTRIC: { threshold: 2400, annualRate: 0.4, annualCap: 440, regRate: 2, regCap: 2200 },
  },
} as const

export const NEDC_COEFFICIENTS = {
  car_or_powerful_van: 1.21,
  weak_van_or_dwelling: 1.30,
} as const

export const MISSING_CO2_CAP = 350

export const OVC_HEV_MISSING_CO2_REG_FIXED = {
  car_or_powerful_van: 230,     // 46 * 5
  weak_van_or_dwelling: 138,    // 69 * 2
} as const
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/calculators/automaks/constants.ts`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/calculators/automaks/constants.ts && git commit -m "feat(automaks): add all law-derived constants and lookup tables"
```

---

## MILESTONE 2: Pure Calculation Engine + Tests
**Gate:** All golden fixtures pass. All unit tests green. Zero UI code written yet.

---

### Task 4: Implement calculate.ts — helper functions

**Files:**
- Create: `src/calculators/automaks/calculate.ts`

**Step 1: Write helper functions**

```ts
import {
  VehicleType, EngineType, Co2Standard, FuelType,
  VehicleGroup, AutomaksInput, AutomaksResult,
  TaxComponents, CalculationOptions,
} from './types'
import {
  ANNUAL_AGE_MULTIPLIERS, REG_AGE_MULTIPLIERS,
  MOTO_TAX_YOUNG, MOTO_TAX_OLD,
  MASS_CONFIG, NEDC_COEFFICIENTS,
  MISSING_CO2_CAP, OVC_HEV_MISSING_CO2_REG_FIXED,
} from './constants'

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function parseRegDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // Support dd.mm.yyyy
  const dotParts = dateStr.split('.')
  if (dotParts.length === 3) {
    const [day, month, year] = dotParts.map(Number)
    return new Date(year, month - 1, day)
  }
  // Support yyyy-mm-dd
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function vehicleAge(regDate: Date, referenceDate: Date): number {
  const anchor = new Date(referenceDate.getFullYear() + 1, 0, 1)
  const diffMs = anchor.getTime() - regDate.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365))
}

export function getAnnualAgeMultiplier(age: number): number {
  for (const tier of ANNUAL_AGE_MULTIPLIERS) {
    if (age >= tier.minAge) return tier.multiplier
  }
  return 1.0
}

export function getRegAgeMultiplier(age: number): number {
  for (const tier of REG_AGE_MULTIPLIERS) {
    if (age >= tier.minAge) return tier.multiplier
  }
  return 1.0
}

export function classifyVehicle(input: AutomaksInput): VehicleGroup {
  const { vehicleType, isHouse, generalEngineType, maxNetPower, kerbMass, engineCapacity } = input

  if (vehicleType === VehicleType.M1_M1G && !isHouse) return 'car_or_powerful_van'
  if (vehicleType === VehicleType.M1_M1G && isHouse) return 'weak_van_or_dwelling'

  if (vehicleType === VehicleType.N1_N1G) {
    if (maxNetPower != null && kerbMass != null && kerbMass > 0) {
      return (maxNetPower / kerbMass) > 0.20 ? 'car_or_powerful_van' : 'weak_van_or_dwelling'
    }
    return 'car_or_powerful_van'
  }

  const isMotoLike =
    vehicleType === VehicleType.L3e_L4e_L5e_L6e_L7e ||
    (vehicleType === VehicleType.MS2 && (kerbMass ?? 0) <= 1000) ||
    (vehicleType === VehicleType.T1b_T5 && (kerbMass ?? 0) <= 1000) ||
    vehicleType === VehicleType.T3

  if (isMotoLike && generalEngineType !== EngineType.ELECTRIC) {
    return 'motorcycle_atv_tractor'
  }

  return 'unsupported'
}

export function estimateCo2CarPowerful(
  maxNetPower: number, kerbMass: number, age: number,
  fuelType: FuelType, engineType: EngineType
): number {
  let co2 = Math.round(maxNetPower * 0.29 + kerbMass * 0.07 + age * 4.92)

  if (fuelType === FuelType.DIESEL && engineType === EngineType.NOVC_HEV) {
    co2 -= 52
  } else if (fuelType === FuelType.DIESEL && engineType !== EngineType.NOVC_HEV && engineType !== EngineType.OVC_HEV) {
    co2 -= 35
  } else if (fuelType === FuelType.PETROL && engineType === EngineType.NOVC_HEV) {
    co2 -= 39
  } else if (engineType === EngineType.OVC_HEV) {
    co2 = 0
  }

  return Math.min(co2, MISSING_CO2_CAP)
}

export function estimateCo2WeakVan(
  maxNetPower: number, kerbMass: number, age: number,
  fuelType: FuelType, engineType: EngineType
): number {
  let co2 = Math.round(maxNetPower * 0.40 + kerbMass * 0.07 + age * 5.16)

  if (fuelType === FuelType.PETROL && engineType !== EngineType.NOVC_HEV && engineType !== EngineType.OVC_HEV) {
    co2 += 22
  } else if (fuelType === FuelType.DIESEL && engineType === EngineType.NOVC_HEV) {
    co2 -= 20
  } else if (fuelType === FuelType.PETROL && engineType === EngineType.NOVC_HEV) {
    co2 -= 20
  } else if (engineType === EngineType.OVC_HEV) {
    co2 = 0
  }

  return Math.min(co2, MISSING_CO2_CAP)
}
```

This is the first half. Continue in Task 5.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/calculators/automaks/calculate.ts`
Expected: No errors.

---

### Task 5: Implement calculate.ts — CO₂ band functions + annual/reg tax

**Files:**
- Modify: `src/calculators/automaks/calculate.ts` (append below helpers)

**Step 1: Add CO₂ band functions and main calculator**

Append to `calculate.ts`:

```ts
// ── CO₂ annual bands: car or powerful van ──
export function co2AnnualCarPowerful(co2: number): number {
  if (co2 < 118) return 0
  if (co2 <= 150) return (co2 - 117) * 3
  if (co2 <= 200) return ((co2 - 150) * 3.5) + (33 * 3)
  return ((co2 - 200) * 4) + (50 * 3.5) + (33 * 3)
}

// ── CO₂ reg bands: car or powerful van ──
export function co2RegCarPowerful(co2: number): number {
  if (co2 < 118) return co2 * 5
  if (co2 <= 150) return ((co2 - 117) * 10) + (117 * 5)
  if (co2 <= 200) return ((co2 - 150) * 30) + (33 * 10) + (117 * 5)
  return ((co2 - 200) * 50) + (50 * 30) + (33 * 10) + (117 * 5)
}

// ── CO₂ annual bands: weak van or dwelling ──
export function co2AnnualWeakVan(co2: number): number {
  if (co2 < 205) return 0
  if (co2 <= 250) return (co2 - 204) * 3
  if (co2 <= 300) return ((co2 - 250) * 3.5) + ((250 - 204) * 3)
  return ((co2 - 300) * 4) + ((300 - 250) * 3.5) + ((250 - 204) * 3)
}

// ── CO₂ reg bands: weak van or dwelling ──
export function co2RegWeakVan(co2: number): number {
  if (co2 < 205) return co2 * 2
  if (co2 <= 250) return ((co2 - 204) * 30) + (204 * 2)
  if (co2 <= 300) return ((co2 - 250) * 35) + ((250 - 204) * 30) + (204 * 2)
  return ((co2 - 300) * 40) + ((300 - 250) * 35) + ((250 - 204) * 30) + (204 * 2)
}

// ── Motorcycle annual tax ──
export function motorcycleTax(engineCc: number, age: number): number {
  if (age > 20) return 0
  const table = age <= 10 ? MOTO_TAX_YOUNG : MOTO_TAX_OLD
  for (const tier of table) {
    if (engineCc >= tier.minCc && engineCc <= tier.maxCc) return tier.tax
  }
  return 0
}

// ══════════════════════════════════════════════
// MAIN CALCULATION FUNCTION
// ══════════════════════════════════════════════
export function calculateAutomaks(
  input: AutomaksInput,
  options: CalculationOptions = {}
): AutomaksResult {
  const refDate = options.referenceDate ?? new Date()
  const regDate = parseRegDate(input.initialRegDate)

  const age = regDate ? vehicleAge(regDate, refDate) : 0
  const annualMul = getAnnualAgeMultiplier(age)
  const regMul = getRegAgeMultiplier(age)
  const group = classifyVehicle(input)

  const warnings: string[] = []
  const annual: TaxComponents = { baseAmount: 0, co2Amount: 0, massAmount: 0 }
  const registration: TaxComponents = { baseAmount: 0, co2Amount: 0, massAmount: 0 }
  let effectiveCo2: number | null = null
  let emissionCoefficient: number | null = null
  let estimatedCo2 = false

  // ── MOTORCYCLE / ATV / TRACTOR ──
  if (group === 'motorcycle_atv_tractor') {
    const tax = motorcycleTax(input.engineCapacity ?? 0, age)
    annual.baseAmount = round2(tax)
    return {
      annualTax: round2(tax),
      annual,
      registrationFee: 0,
      registration,
      derived: {
        yearsSinceRegistration: age, annualAgeMultiplier: annualMul,
        registrationAgeMultiplier: regMul, effectiveCo2Emission: null,
        emissionCoefficient: null, vehicleGroup: group, estimatedCo2: false,
      },
      warnings,
    }
  }

  // ── UNSUPPORTED ──
  if (group === 'unsupported') {
    return {
      annualTax: 0, annual, registrationFee: 0, registration,
      derived: {
        yearsSinceRegistration: age, annualAgeMultiplier: annualMul,
        registrationAgeMultiplier: regMul, effectiveCo2Emission: null,
        emissionCoefficient: null, vehicleGroup: group, estimatedCo2: false,
      },
      warnings: ['Selle sõidukitüübi jaoks maks ei kehti või on maksuvaba'],
    }
  }

  // ── CAR / POWERFUL VAN  or  WEAK VAN / DWELLING ──
  const isCarPowerful = group === 'car_or_powerful_van'
  const isEV = input.generalEngineType === EngineType.ELECTRIC
  const isPHEV = input.generalEngineType === EngineType.OVC_HEV
  const isMissingCo2 = input.co2Standard === Co2Standard.NOT_AVAILABLE

  // 20+ year exemption (annual only)
  if (age >= 20) {
    warnings.push('Üle 20-aastane sõiduk on aastamaksust vabastatud')
  }

  // ── Resolve effective CO₂ ──
  if (isEV) {
    effectiveCo2 = 0
  } else if (isMissingCo2) {
    const pw = input.maxNetPower ?? 0
    const km = input.kerbMass ?? 0
    if (pw > 0 && km > 0) {
      effectiveCo2 = isCarPowerful
        ? estimateCo2CarPowerful(pw, km, age, input.fuelType, input.generalEngineType)
        : estimateCo2WeakVan(pw, km, age, input.fuelType, input.generalEngineType)
      estimatedCo2 = true
    }
  } else if (input.co2Standard === Co2Standard.NEDC && input.co2Emission != null) {
    emissionCoefficient = isCarPowerful
      ? NEDC_COEFFICIENTS.car_or_powerful_van
      : NEDC_COEFFICIENTS.weak_van_or_dwelling
    effectiveCo2 = input.co2Emission * emissionCoefficient
  } else if (input.co2Standard === Co2Standard.WLTP && input.co2Emission != null) {
    emissionCoefficient = 1
    effectiveCo2 = input.co2Emission
  }

  // ── ANNUAL TAX ──
  // Base
  if (isCarPowerful) {
    annual.baseAmount = 50
  } else {
    annual.baseAmount = isEV ? 30 : 50
  }

  // CO₂ annual
  if (!isEV && effectiveCo2 != null && age < 20) {
    if (isPHEV && isMissingCo2) {
      annual.co2Amount = 0
    } else {
      const rawCo2 = isCarPowerful
        ? co2AnnualCarPowerful(effectiveCo2)
        : co2AnnualWeakVan(effectiveCo2)
      annual.co2Amount = round2(annualMul * rawCo2)
    }
  }

  // Mass annual (car/powerful van only — weak van has no mass component)
  if (isCarPowerful && input.grossWeight != null && age < 20) {
    const cfg = MASS_CONFIG.car_or_powerful_van[input.generalEngineType]
    if (cfg && input.grossWeight > cfg.threshold) {
      const over = input.grossWeight - cfg.threshold
      annual.massAmount = round2(annualMul * Math.min(over * cfg.annualRate, cfg.annualCap))
    }
  }

  // Annual total — OVC-HEV + missing CO₂ exception
  let annualTax: number
  if (age >= 20) {
    annualTax = 0
  } else if (isPHEV && isMissingCo2) {
    annualTax = round2(annual.baseAmount + annual.massAmount)
  } else {
    annualTax = round2(annual.baseAmount + annual.co2Amount + annual.massAmount)
  }

  // ── REGISTRATION FEE ──
  // Base
  if (isCarPowerful) {
    registration.baseAmount = 150
  } else {
    registration.baseAmount = isEV ? 200 : 300
  }

  // CO₂ reg
  if (!isEV && effectiveCo2 != null) {
    if (isPHEV && isMissingCo2) {
      registration.co2Amount = isCarPowerful
        ? OVC_HEV_MISSING_CO2_REG_FIXED.car_or_powerful_van
        : OVC_HEV_MISSING_CO2_REG_FIXED.weak_van_or_dwelling
    } else {
      const rawCo2Reg = isCarPowerful
        ? co2RegCarPowerful(effectiveCo2)
        : co2RegWeakVan(effectiveCo2)
      registration.co2Amount = round2(regMul * rawCo2Reg)
    }
  }

  // Mass reg (car/powerful van only)
  if (isCarPowerful && input.grossWeight != null) {
    const cfg = MASS_CONFIG.car_or_powerful_van[input.generalEngineType]
    if (cfg && input.grossWeight > cfg.threshold) {
      const over = input.grossWeight - cfg.threshold
      registration.massAmount = round2(regMul * Math.min(over * cfg.regRate, cfg.regCap))
    }
  }

  const registrationFee = round2(registration.baseAmount + registration.co2Amount + registration.massAmount)

  return {
    annualTax,
    annual,
    registrationFee,
    registration,
    derived: {
      yearsSinceRegistration: age,
      annualAgeMultiplier: annualMul,
      registrationAgeMultiplier: regMul,
      effectiveCo2Emission: effectiveCo2,
      emissionCoefficient,
      vehicleGroup: group,
      estimatedCo2,
    },
    warnings,
  }
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/calculators/automaks/calculate.ts`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/calculators/automaks/calculate.ts && git commit -m "feat(automaks): implement complete calculation engine with exact law-derived formulas"
```

---

### Task 6: Write unit tests for helper functions

**Files:**
- Create: `src/calculators/automaks/calculate.test.ts`

**Step 1: Write helper function tests**

```ts
import { describe, it, expect } from 'vitest'
import {
  round2, vehicleAge, getAnnualAgeMultiplier, getRegAgeMultiplier,
  classifyVehicle, estimateCo2CarPowerful, estimateCo2WeakVan,
  co2AnnualCarPowerful, co2RegCarPowerful,
  co2AnnualWeakVan, co2RegWeakVan,
  motorcycleTax, calculateAutomaks,
} from './calculate'
import { VehicleType, EngineType, Co2Standard, FuelType } from './types'

// ── Rounding ──
describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(123.456)).toBe(123.46)
    expect(round2(123.454)).toBe(123.45)
    expect(round2(0)).toBe(0)
  })
})

// ── Vehicle Age ──
describe('vehicleAge', () => {
  it('calculates fractional years to Jan 1 of next year', () => {
    const reg = new Date(2021, 4, 1) // May 1, 2021
    const ref = new Date(2026, 4, 10) // May 10, 2026
    // Anchor: 2027-01-01. Diff from 2021-05-01 to 2027-01-01
    const age = vehicleAge(reg, ref)
    // (2027-01-01 - 2021-05-01) / 365 days = ~5.67
    expect(age).toBeGreaterThan(5.6)
    expect(age).toBeLessThan(5.8)
  })

  it('uses 365 not 365.25 as divisor', () => {
    const reg = new Date(2022, 0, 1) // Jan 1, 2022
    const ref = new Date(2026, 5, 15) // Jun 15, 2026
    // Anchor: 2027-01-01. Diff = exactly 5 years = 1826 days / 365 = 5.0027...
    const age = vehicleAge(reg, ref)
    expect(age).toBeCloseTo(1826 / 365, 4)
  })
})

// ── Annual Age Multiplier ──
describe('getAnnualAgeMultiplier', () => {
  it('returns 1.00 for cars under 5 years', () => {
    expect(getAnnualAgeMultiplier(0)).toBe(1.0)
    expect(getAnnualAgeMultiplier(4.99)).toBe(1.0)
  })

  it('returns 0.92 for 5-5.99 years', () => {
    expect(getAnnualAgeMultiplier(5.0)).toBe(0.92)
    expect(getAnnualAgeMultiplier(5.67)).toBe(0.92)
  })

  it('returns 0 for 20+ years', () => {
    expect(getAnnualAgeMultiplier(20)).toBe(0)
    expect(getAnnualAgeMultiplier(25)).toBe(0)
  })

  it('returns 0.10 for 15-19 years', () => {
    expect(getAnnualAgeMultiplier(15)).toBe(0.10)
    expect(getAnnualAgeMultiplier(19.9)).toBe(0.10)
  })
})

// ── Registration Age Multiplier ──
describe('getRegAgeMultiplier', () => {
  it('returns 1.00 for cars under 1 year', () => {
    expect(getRegAgeMultiplier(0.5)).toBe(1.0)
  })

  it('returns 0.48 for 5-5.99 years', () => {
    expect(getRegAgeMultiplier(5.67)).toBe(0.48)
  })

  it('returns 0.05 for 20+ years', () => {
    expect(getRegAgeMultiplier(20)).toBe(0.05)
    expect(getRegAgeMultiplier(30)).toBe(0.05)
  })
})

// ── Vehicle Classification ──
describe('classifyVehicle', () => {
  const base = {
    initialRegDate: '01.05.2021', grossWeight: 2000, co2Standard: Co2Standard.WLTP,
    co2Emission: 150, fuelType: FuelType.PETROL, maxNetPower: null, kerbMass: null,
    engineCapacity: null, isHouse: false, generalEngineType: EngineType.ICE,
  }

  it('M1 non-house = car_or_powerful_van', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.M1_M1G })).toBe('car_or_powerful_van')
  })

  it('M1 house = weak_van_or_dwelling', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.M1_M1G, isHouse: true })).toBe('weak_van_or_dwelling')
  })

  it('N1 high power/mass = car_or_powerful_van', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.N1_N1G, maxNetPower: 100, kerbMass: 400 })).toBe('car_or_powerful_van')
  })

  it('N1 low power/mass = weak_van_or_dwelling', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.N1_N1G, maxNetPower: 50, kerbMass: 1500 })).toBe('weak_van_or_dwelling')
  })

  it('motorcycle = motorcycle_atv_tractor', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e })).toBe('motorcycle_atv_tractor')
  })

  it('electric motorcycle = unsupported', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e, generalEngineType: EngineType.ELECTRIC })).toBe('unsupported')
  })
})

// ── CO₂ Bands ──
describe('co2AnnualCarPowerful', () => {
  it('returns 0 for CO₂ < 118', () => {
    expect(co2AnnualCarPowerful(100)).toBe(0)
    expect(co2AnnualCarPowerful(117)).toBe(0)
  })

  it('tier 1: 118-150', () => {
    expect(co2AnnualCarPowerful(130)).toBe((130 - 117) * 3)  // 39
    expect(co2AnnualCarPowerful(150)).toBe(33 * 3)  // 99
  })

  it('tier 2: 151-200', () => {
    // (160-150)*3.5 + 33*3 = 35 + 99 = 134
    expect(co2AnnualCarPowerful(160)).toBe(134)
  })

  it('tier 3: 201+', () => {
    // (210-200)*4 + 50*3.5 + 33*3 = 40 + 175 + 99 = 314
    expect(co2AnnualCarPowerful(210)).toBe(314)
  })
})

describe('co2RegCarPowerful', () => {
  it('tier 0: < 118', () => {
    expect(co2RegCarPowerful(100)).toBe(500) // 100 * 5
  })

  it('tier 1: 118-150', () => {
    // (130-117)*10 + 117*5 = 130 + 585 = 715
    expect(co2RegCarPowerful(130)).toBe(715)
  })
})

// ── Motorcycle Tiers ──
describe('motorcycleTax', () => {
  it('600cc ≤10 years = 60€', () => {
    expect(motorcycleTax(600, 5)).toBe(60)
  })

  it('600cc 10-20 years = 45€', () => {
    expect(motorcycleTax(600, 12)).toBe(45)
  })

  it('600cc 20+ years = 0€', () => {
    expect(motorcycleTax(600, 21)).toBe(0)
  })

  it('100cc ≤10 years = 30€', () => {
    expect(motorcycleTax(100, 3)).toBe(30)
  })

  it('2000cc ≤10 years = 90€', () => {
    expect(motorcycleTax(2000, 3)).toBe(90)
  })
})
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/calculators/automaks/calculate.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/calculators/automaks/calculate.test.ts && git commit -m "test(automaks): add unit tests for helpers — age, multipliers, classification, CO₂ bands, motorcycle"
```

---

### Task 7: Write golden fixture tests

**Files:**
- Modify: `src/calculators/automaks/calculate.test.ts` (append)

**Step 1: Add golden fixture tests**

Append to `calculate.test.ts`:

```ts
// ══════════════════════════════════════════════
// GOLDEN FIXTURES — must match kalkulaator.ee
// ══════════════════════════════════════════════
const REF_DATE = new Date(2026, 4, 10) // May 10, 2026

describe('Golden Fixture A: M1 ICE WLTP', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: 2100,
    generalEngineType: EngineType.ICE, co2Standard: Co2Standard.WLTP,
    co2Emission: 160, fuelType: FuelType.PETROL,
    maxNetPower: 100, kerbMass: 1600, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annual tax = 210.08', () => expect(result.annualTax).toBe(210.08))
  it('annual base = 50.00', () => expect(result.annual.baseAmount).toBe(50))
  it('annual CO₂ = 123.28', () => expect(result.annual.co2Amount).toBe(123.28))
  it('annual mass = 36.80', () => expect(result.annual.massAmount).toBe(36.80))
  it('reg fee = 829.20', () => expect(result.registrationFee).toBe(829.20))
  it('reg base = 150.00', () => expect(result.registration.baseAmount).toBe(150))
  it('reg CO₂ = 583.20', () => expect(result.registration.co2Amount).toBe(583.20))
  it('reg mass = 96.00', () => expect(result.registration.massAmount).toBe(96))
  it('annual age mul = 0.92', () => expect(result.derived.annualAgeMultiplier).toBe(0.92))
  it('reg age mul = 0.48', () => expect(result.derived.registrationAgeMultiplier).toBe(0.48))
})

describe('Golden Fixture B: M1 OVC-HEV Missing CO₂', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: 2300,
    generalEngineType: EngineType.OVC_HEV, co2Standard: Co2Standard.NOT_AVAILABLE,
    co2Emission: null, fuelType: FuelType.PETROL,
    maxNetPower: 100, kerbMass: 1800, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annual tax = 86.80', () => expect(result.annualTax).toBe(86.80))
  it('annual base = 50.00', () => expect(result.annual.baseAmount).toBe(50))
  it('annual CO₂ = 0.00 (excluded for PHEV+missing)', () => expect(result.annual.co2Amount).toBe(0))
  it('annual mass = 36.80', () => expect(result.annual.massAmount).toBe(36.80))
  it('reg fee = 476.00', () => expect(result.registrationFee).toBe(476))
  it('reg base = 150.00', () => expect(result.registration.baseAmount).toBe(150))
  it('reg CO₂ = 230.00 (fixed)', () => expect(result.registration.co2Amount).toBe(230))
  it('reg mass = 96.00', () => expect(result.registration.massAmount).toBe(96))
})

describe('Golden Fixture C: M1 Electric Heavy', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: 2600,
    generalEngineType: EngineType.ELECTRIC, co2Standard: Co2Standard.WLTP,
    co2Emission: null, fuelType: FuelType.OTHER,
    maxNetPower: null, kerbMass: null, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annual tax = 123.60', () => expect(result.annualTax).toBe(123.60))
  it('annual base = 50.00', () => expect(result.annual.baseAmount).toBe(50))
  it('annual CO₂ = 0.00', () => expect(result.annual.co2Amount).toBe(0))
  it('annual mass = 73.60', () => expect(result.annual.massAmount).toBe(73.60))
  it('reg fee = 342.00', () => expect(result.registrationFee).toBe(342))
  it('reg base = 150.00', () => expect(result.registration.baseAmount).toBe(150))
  it('reg CO₂ = 0.00', () => expect(result.registration.co2Amount).toBe(0))
  it('reg mass = 192.00', () => expect(result.registration.massAmount).toBe(192))
})

describe('Golden Fixture D: Motorcycle 600cc', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: null,
    generalEngineType: EngineType.ICE, co2Standard: Co2Standard.WLTP,
    co2Emission: null, fuelType: FuelType.PETROL,
    maxNetPower: null, kerbMass: null, engineCapacity: 600,
  }, { referenceDate: REF_DATE })

  it('annual tax = 60.00', () => expect(result.annualTax).toBe(60))
  it('annual base = 60.00', () => expect(result.annual.baseAmount).toBe(60))
  it('reg fee = 0.00', () => expect(result.registrationFee).toBe(0))
})
```

**Step 2: Run ALL tests**

Run: `npx vitest run src/calculators/automaks/calculate.test.ts`
Expected: ALL tests PASS — helpers AND golden fixtures.

**Step 3: If any fixture fails — debug and fix calculate.ts**

Do NOT proceed to Task 8 until all golden fixtures pass. This is the hard gate.

**Step 4: Commit**

```bash
git add src/calculators/automaks/calculate.test.ts && git commit -m "test(automaks): add golden fixture tests A-D — all pass with exact kalkulaator.ee parity"
```

---

## MILESTONE 3: Next.js Project Setup + Design Token Migration
**Gate:** Project runs with `npm run dev`. Tailwind uses custom theme. Fonts load.

---

### Task 8: Configure Tailwind with design tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Update tailwind.config.ts**

Port all tokens from `full_design/styles.css`. Use CSS custom properties for oklch colors (Tailwind config uses the var references, actual values in globals.css).

**Step 2: Update globals.css**

Copy the `:root` and `[data-theme="dark"]` blocks from `full_design/styles.css` wholesale. Add motion variables. Add the `field-collapse` animation CSS.

**Step 3: Update layout.tsx**

- Import Plus Jakarta Sans and JetBrains Mono via `next/font/google`
- Set Estonian metadata: `<html lang="et">`
- Title: "Automaksu kalkulaator | Kalku"
- Description: "Arvuta oma sõiduki aastamaks ja registreerimistasu"

**Step 4: Verify**

Run: `npm run dev`
Expected: Page loads at localhost:3000 with correct fonts.

**Step 5: Commit**

```bash
git add tailwind.config.ts src/app/globals.css src/app/layout.tsx && git commit -m "feat: configure Tailwind with design tokens, oklch colors, fonts"
```

---

### Task 9: Create format.ts utility

**Files:**
- Create: `src/calculators/automaks/format.ts`

**Step 1: Write formatting utilities**

```ts
export function formatEur(value: number): string {
  return value.toFixed(2) + ' €'
}

export function formatAge(years: number): string {
  return years.toFixed(2)
}

export function formatCo2(value: number): string {
  return Math.round(value) + ' g/km'
}
```

**Step 2: Commit**

```bash
git add src/calculators/automaks/format.ts && git commit -m "feat(automaks): add formatting utilities"
```

---

## MILESTONE 4: UI Components
**Gate:** All components render. Calculator shows live results. No calculation logic in components.

---

### Task 10: Port UI atom components from design

**Files:**
- Create: `src/components/ui/Collapse.tsx`
- Create: `src/components/ui/Segmented.tsx`
- Create: `src/components/ui/Toggle.tsx`
- Create: `src/components/ui/NumberInput.tsx`
- Create: `src/components/ui/AnimatedNumber.tsx`
- Create: `src/components/ui/InfoBanner.tsx`

Port each component from `full_design/src/app.jsx` to TypeScript React with proper props interfaces. Keep the same class names — they map to `globals.css` styles ported from `styles.css`.

Reference: `full_design/src/app.jsx` lines 8-106 for component implementations.

**Step 1: Create each component file with typed props**
**Step 2: Verify they compile**: `npx tsc --noEmit`
**Step 3: Commit**

```bash
git add src/components/ui/ && git commit -m "feat: port UI atom components from design — Collapse, Segmented, Toggle, NumberInput, AnimatedNumber, InfoBanner"
```

---

### Task 11: Create ResultCard component

**Files:**
- Create: `src/components/calculators/automaks/ResultCard.tsx`

Port from `full_design/src/app.jsx` lines 435-468. TypeScript props interface. Uses AnimatedNumber for headline figure. Renders breakdown lines with explanations.

**Step 1: Write component with typed props**
**Step 2: Verify**: `npx tsc --noEmit`
**Step 3: Commit**

```bash
git add src/components/calculators/automaks/ResultCard.tsx && git commit -m "feat(automaks): add ResultCard component with breakdown and animated number"
```

---

### Task 12: Create AutomaksCalculator main component

**Files:**
- Create: `src/components/calculators/automaks/AutomaksCalculator.tsx`

Port from `full_design/src/app.jsx` lines 120-430. Key changes:
- Import `calculateAutomaks` from `@/calculators/automaks/calculate` (NOT tax-logic.js)
- Use proper TypeScript enums from `types.ts`
- All visibility flags same as design (lines 145-160 of app.jsx)
- `useMemo` for calculation results
- No formula logic — just call `calculateAutomaks(input, { referenceDate })`

**Step 1: Write component**
**Step 2: Wire to page.tsx**: Import and render `<AutomaksCalculator />`
**Step 3: Verify**: `npm run dev` — calculator renders, inputs work, results show
**Step 4: Commit**

```bash
git add src/components/calculators/automaks/ src/app/page.tsx && git commit -m "feat(automaks): complete calculator UI with live results"
```

---

### Task 13: Add dark mode provider

**Files:**
- Create: `src/lib/theme.tsx`
- Modify: `src/app/layout.tsx`

Implement theme toggle with `localStorage` persistence under key `kalku-theme`. Set `data-theme` attribute on `<html>`. Header toggle button with Sun/Moon icons (from design app.jsx lines 101-102).

**Step 1: Write theme provider**
**Step 2: Wrap layout with provider**
**Step 3: Verify**: Toggle works, persists across refresh
**Step 4: Commit**

```bash
git add src/lib/theme.tsx src/app/layout.tsx && git commit -m "feat: add dark mode with localStorage persistence"
```

---

### Task 14: Add mobile sticky summary bar

**Files:**
- Modify: `src/components/calculators/automaks/AutomaksCalculator.tsx`
- CSS already in `globals.css` (ported from styles.css)

Port from design app.jsx lines 419-427. Fixed bottom bar visible only on mobile (<768px), shows annual tax + reg fee, "Vaata" button scrolls to results.

**Step 1: Add sticky bar JSX**
**Step 2: Verify on mobile viewport**: Chrome DevTools → responsive mode
**Step 3: Commit**

```bash
git add src/components/ && git commit -m "feat(automaks): add mobile sticky summary bar"
```

---

## MILESTONE 5: Cross-Verification + Deploy
**Gate:** Results match kalkulaator.ee. Deployed. E2E verified in production browser.

---

### Task 15: Cross-verify against kalkulaator.ee

**No files changed. Testing only.**

**Step 1: Run unit tests one final time**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Start dev server**

Run: `npm run dev`

**Step 3: Open both calculators side by side in browser**

Test these 5 configurations. Enter identical values into both kalkulaator.ee and our calculator. Results must match to the cent.

| # | Vehicle | Engine | CO₂ | Weight | Expected Annual | Expected Reg |
|---|---------|--------|-----|--------|----------------|-------------|
| 1 | M1 car | ICE | WLTP 160 g/km | 2100 kg | 210.08 € | 829.20 € |
| 2 | M1 car | OVC-HEV | Missing | 2300 kg, 100kW, 1800kg | 86.80 € | 476.00 € |
| 3 | M1 car | EV | — | 2600 kg | 123.60 € | 342.00 € |
| 4 | Motorcycle | ICE | — | 600cc | 60.00 € | 0.00 € |
| 5 | M1 car | ICE | WLTP 200 g/km | 1800 kg | 148.00 € | varies |

**Step 4: If any mismatch — fix calculate.ts, re-run tests, re-verify**

**Step 5: Take screenshots of matching results for evidence**

---

### Task 16: Deploy to Vercel

**Step 1: Build**

Run: `npm run build`
Expected: Build succeeds, zero errors.

**Step 2: Deploy**

Run: `vercel --prod`
Expected: Deployed URL returned.

**Step 3: Commit any last changes**

```bash
git add -A && git commit -m "chore: production build ready"
git push
```

---

### Task 17: Production E2E verification

**Step 1: Navigate to production URL via chrome-devtools MCP**

Wait 30 seconds after deploy, then:
- Open production URL in browser
- Check console for errors (must be zero)
- Check network tab for failed requests

**Step 2: Test golden path**

- Enter M1, ICE, WLTP, 160 g/km, 2100 kg, date 01.05.2021
- Verify annual tax shows 210.08 €
- Verify registration fee shows 829.20 €

**Step 3: Test state transitions**

- Switch to Motorcycle → verify only annual tax card shown
- Switch to Electric → verify CO₂ fields hidden, CO₂ = 0 in results
- Switch to Pistikhübriid + Puudub → verify annual CO₂ shows "—"
- Toggle dark mode → verify colors switch correctly

**Step 4: Test mobile viewport**

- Chrome DevTools → iPhone 14 viewport
- Verify stacked layout
- Verify sticky bottom bar appears with summary
- Verify all inputs are usable on mobile

**Step 5: Announce completion**

Report: production URL, screenshot evidence, test results.

---

## MILESTONE SUMMARY

| Milestone | Tasks | Gate | Estimated Time |
|-----------|-------|------|---------------|
| **M1: Scaffold + Types** | 1-3 | Project compiles, types defined | 15 min |
| **M2: Calc Engine + Tests** | 4-7 | All golden fixtures pass, 0 UI code | 45 min |
| **M3: Project Setup + Tokens** | 8-9 | Dev server runs, fonts + colors correct | 20 min |
| **M4: UI Components** | 10-14 | Calculator renders with live results | 60 min |
| **M5: Verify + Deploy** | 15-17 | Matches kalkulaator.ee, live on Vercel | 30 min |
| **TOTAL** | 17 tasks | | ~3 hours |

---

## HARD RULES

1. **No calculation logic in .tsx files.** Import from `calculate.ts` only.
2. **Golden fixtures must pass before UI work starts** (Milestone 2 gate).
3. **Do not copy `full_design/src/tax-logic.js`** — every formula is wrong.
4. **Do copy `full_design/styles.css` tokens** — every design value is correct.
5. **Do port `full_design/src/app.jsx` component structure** — all UI patterns are correct.
6. **Age uses 365 divisor, not 365.25.**
7. **Age multipliers are step functions, not linear.**
8. **Cross-verify against kalkulaator.ee in browser before claiming done.**
9. **Deploy via `vercel` CLI, verify via chrome-devtools MCP.**

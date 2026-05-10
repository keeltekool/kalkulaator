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
  const dotParts = dateStr.split('.')
  if (dotParts.length === 3) {
    const [day, month, year] = dotParts.map(Number)
    return new Date(year, month - 1, day)
  }
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
  const { vehicleType, isHouse, generalEngineType, maxNetPower, kerbMass } = input

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

export function co2AnnualCarPowerful(co2: number): number {
  if (co2 < 118) return 0
  if (co2 <= 150) return (co2 - 117) * 3
  if (co2 <= 200) return ((co2 - 150) * 3.5) + (33 * 3)
  return ((co2 - 200) * 4) + (50 * 3.5) + (33 * 3)
}

export function co2RegCarPowerful(co2: number): number {
  if (co2 < 118) return co2 * 5
  if (co2 <= 150) return ((co2 - 117) * 10) + (117 * 5)
  if (co2 <= 200) return ((co2 - 150) * 30) + (33 * 10) + (117 * 5)
  return ((co2 - 200) * 50) + (50 * 30) + (33 * 10) + (117 * 5)
}

export function co2AnnualWeakVan(co2: number): number {
  if (co2 < 205) return 0
  if (co2 <= 250) return (co2 - 204) * 3
  if (co2 <= 300) return ((co2 - 250) * 3.5) + ((250 - 204) * 3)
  return ((co2 - 300) * 4) + ((300 - 250) * 3.5) + ((250 - 204) * 3)
}

export function co2RegWeakVan(co2: number): number {
  if (co2 < 205) return co2 * 2
  if (co2 <= 250) return ((co2 - 204) * 30) + (204 * 2)
  if (co2 <= 300) return ((co2 - 250) * 35) + ((250 - 204) * 30) + (204 * 2)
  return ((co2 - 300) * 40) + ((300 - 250) * 35) + ((250 - 204) * 30) + (204 * 2)
}

export function motorcycleTax(engineCc: number, age: number): number {
  if (age > 20) return 0
  const table = age <= 10 ? MOTO_TAX_YOUNG : MOTO_TAX_OLD
  for (const tier of table) {
    if (engineCc >= tier.minCc && engineCc <= tier.maxCc) return tier.tax
  }
  return 0
}

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

  if (group === 'motorcycle_atv_tractor') {
    const tax = motorcycleTax(input.engineCapacity ?? 0, age)
    annual.baseAmount = round2(tax)
    return {
      annualTax: round2(tax), annual,
      registrationFee: 0, registration,
      derived: {
        yearsSinceRegistration: age, annualAgeMultiplier: annualMul,
        registrationAgeMultiplier: regMul, effectiveCo2Emission: null,
        emissionCoefficient: null, vehicleGroup: group, estimatedCo2: false,
      },
      warnings,
    }
  }

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

  const isCarPowerful = group === 'car_or_powerful_van'
  const isEV = input.generalEngineType === EngineType.ELECTRIC
  const isPHEV = input.generalEngineType === EngineType.OVC_HEV
  const isMissingCo2 = input.co2Standard === Co2Standard.NOT_AVAILABLE

  if (age >= 20) {
    warnings.push('Üle 20-aastane sõiduk on aastamaksust vabastatud')
  }

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

  // ANNUAL TAX
  if (isCarPowerful) {
    annual.baseAmount = 50
  } else {
    annual.baseAmount = isEV ? 30 : 50
  }

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

  if (isCarPowerful && input.grossWeight != null && age < 20) {
    const cfg = MASS_CONFIG.car_or_powerful_van[input.generalEngineType]
    if (cfg && input.grossWeight > cfg.threshold) {
      const over = input.grossWeight - cfg.threshold
      annual.massAmount = round2(annualMul * Math.min(over * cfg.annualRate, cfg.annualCap))
    }
  }

  let annualTax: number
  if (age >= 20) {
    annualTax = 0
  } else if (isPHEV && isMissingCo2) {
    annualTax = round2(annual.baseAmount + annual.massAmount)
  } else {
    annualTax = round2(annual.baseAmount + annual.co2Amount + annual.massAmount)
  }

  // REGISTRATION FEE
  if (isCarPowerful) {
    registration.baseAmount = 150
  } else {
    registration.baseAmount = isEV ? 200 : 300
  }

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

  if (isCarPowerful && input.grossWeight != null) {
    const cfg = MASS_CONFIG.car_or_powerful_van[input.generalEngineType]
    if (cfg && input.grossWeight > cfg.threshold) {
      const over = input.grossWeight - cfg.threshold
      registration.massAmount = round2(regMul * Math.min(over * cfg.regRate, cfg.regCap))
    }
  }

  const registrationFee = round2(registration.baseAmount + registration.co2Amount + registration.massAmount)

  return {
    annualTax, annual,
    registrationFee, registration,
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

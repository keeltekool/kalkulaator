import { describe, it, expect } from 'vitest'
import {
  round2, vehicleAge, getAnnualAgeMultiplier, getRegAgeMultiplier,
  classifyVehicle, estimateCo2CarPowerful, estimateCo2WeakVan,
  co2AnnualCarPowerful, co2RegCarPowerful,
  co2AnnualWeakVan, co2RegWeakVan,
  motorcycleTax, calculateAutomaks,
} from './calculate'
import { VehicleType, EngineType, Co2Standard, FuelType } from './types'

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(123.456)).toBe(123.46)
    expect(round2(123.454)).toBe(123.45)
    expect(round2(0)).toBe(0)
  })
})

describe('vehicleAge', () => {
  it('calculates fractional years to Jan 1 of next year using 365 divisor', () => {
    const reg = new Date(2021, 4, 1)
    const ref = new Date(2026, 4, 10)
    const age = vehicleAge(reg, ref)
    expect(age).toBeGreaterThan(5.6)
    expect(age).toBeLessThan(5.8)
  })

  it('uses 365 not 365.25', () => {
    const reg = new Date(2022, 0, 1)
    const ref = new Date(2026, 5, 15)
    const age = vehicleAge(reg, ref)
    const expectedMs = new Date(2027, 0, 1).getTime() - new Date(2022, 0, 1).getTime()
    expect(age).toBeCloseTo(expectedMs / (1000 * 60 * 60 * 24 * 365), 4)
  })

  it('returns 0 for future registration dates', () => {
    const reg = new Date(2028, 0, 1)
    const ref = new Date(2026, 4, 10)
    expect(vehicleAge(reg, ref)).toBe(0)
  })
})

describe('getAnnualAgeMultiplier', () => {
  it('< 5 years = 1.00', () => {
    expect(getAnnualAgeMultiplier(0)).toBe(1.0)
    expect(getAnnualAgeMultiplier(4.99)).toBe(1.0)
  })
  it('5-5.99 = 0.92', () => {
    expect(getAnnualAgeMultiplier(5.0)).toBe(0.92)
    expect(getAnnualAgeMultiplier(5.67)).toBe(0.92)
  })
  it('6 = 0.84', () => expect(getAnnualAgeMultiplier(6.0)).toBe(0.84))
  it('7 = 0.75', () => expect(getAnnualAgeMultiplier(7.0)).toBe(0.75))
  it('10 = 0.51', () => expect(getAnnualAgeMultiplier(10.0)).toBe(0.51))
  it('15-19 = 0.10', () => {
    expect(getAnnualAgeMultiplier(15)).toBe(0.10)
    expect(getAnnualAgeMultiplier(19.9)).toBe(0.10)
  })
  it('20+ = 0', () => {
    expect(getAnnualAgeMultiplier(20)).toBe(0)
    expect(getAnnualAgeMultiplier(25)).toBe(0)
  })
})

describe('getRegAgeMultiplier', () => {
  it('< 1 year = 1.00', () => expect(getRegAgeMultiplier(0.5)).toBe(1.0))
  it('1 = 0.87', () => expect(getRegAgeMultiplier(1.0)).toBe(0.87))
  it('5-5.99 = 0.48', () => expect(getRegAgeMultiplier(5.67)).toBe(0.48))
  it('10 = 0.22', () => expect(getRegAgeMultiplier(10.0)).toBe(0.22))
  it('20+ = 0.05', () => {
    expect(getRegAgeMultiplier(20)).toBe(0.05)
    expect(getRegAgeMultiplier(30)).toBe(0.05)
  })
})

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
  it('N1 exactly 0.20 = weak_van_or_dwelling', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.N1_N1G, maxNetPower: 200, kerbMass: 1000 })).toBe('weak_van_or_dwelling')
  })
  it('motorcycle = motorcycle_atv_tractor', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e })).toBe('motorcycle_atv_tractor')
  })
  it('electric motorcycle = unsupported', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e, generalEngineType: EngineType.ELECTRIC })).toBe('unsupported')
  })
  it('MS2 ≤1000kg = motorcycle_atv_tractor', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.MS2, kerbMass: 800 })).toBe('motorcycle_atv_tractor')
  })
  it('MS2 >1000kg = unsupported', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.MS2, kerbMass: 1200 })).toBe('unsupported')
  })
  it('T3 = motorcycle_atv_tractor', () => {
    expect(classifyVehicle({ ...base, vehicleType: VehicleType.T3 })).toBe('motorcycle_atv_tractor')
  })
})

describe('co2AnnualCarPowerful', () => {
  it('< 118 = 0', () => {
    expect(co2AnnualCarPowerful(100)).toBe(0)
    expect(co2AnnualCarPowerful(117)).toBe(0)
  })
  it('118-150 tier', () => {
    expect(co2AnnualCarPowerful(130)).toBe((130 - 117) * 3)
    expect(co2AnnualCarPowerful(150)).toBe(33 * 3)
  })
  it('151-200 tier', () => {
    expect(co2AnnualCarPowerful(160)).toBe((160 - 150) * 3.5 + 33 * 3)
  })
  it('201+ tier', () => {
    expect(co2AnnualCarPowerful(210)).toBe((210 - 200) * 4 + 50 * 3.5 + 33 * 3)
  })
})

describe('co2RegCarPowerful', () => {
  it('< 118', () => expect(co2RegCarPowerful(100)).toBe(500))
  it('118-150', () => expect(co2RegCarPowerful(130)).toBe((130 - 117) * 10 + 117 * 5))
  it('151-200', () => expect(co2RegCarPowerful(160)).toBe((160 - 150) * 30 + 33 * 10 + 117 * 5))
  it('201+', () => expect(co2RegCarPowerful(210)).toBe((210 - 200) * 50 + 50 * 30 + 33 * 10 + 117 * 5))
})

describe('co2AnnualWeakVan', () => {
  it('< 205 = 0', () => expect(co2AnnualWeakVan(200)).toBe(0))
  it('205-250', () => expect(co2AnnualWeakVan(220)).toBe((220 - 204) * 3))
  it('251-300', () => expect(co2AnnualWeakVan(270)).toBe((270 - 250) * 3.5 + (250 - 204) * 3))
})

describe('co2RegWeakVan', () => {
  it('< 205', () => expect(co2RegWeakVan(100)).toBe(200))
  it('205-250', () => expect(co2RegWeakVan(220)).toBe((220 - 204) * 30 + 204 * 2))
})

describe('motorcycleTax', () => {
  it('600cc ≤10yr = 60', () => expect(motorcycleTax(600, 5)).toBe(60))
  it('600cc 10-20yr = 45', () => expect(motorcycleTax(600, 12)).toBe(45))
  it('600cc 20+ = 0', () => expect(motorcycleTax(600, 21)).toBe(0))
  it('100cc ≤10yr = 30', () => expect(motorcycleTax(100, 3)).toBe(30))
  it('2000cc ≤10yr = 90', () => expect(motorcycleTax(2000, 3)).toBe(90))
  it('50cc = 0 (below 51)', () => expect(motorcycleTax(50, 3)).toBe(0))
  it('1200cc 10-20yr = 60', () => expect(motorcycleTax(1200, 15)).toBe(60))
})

// ══════════════════════════════════════════════
// GOLDEN FIXTURES
// ══════════════════════════════════════════════
const REF_DATE = new Date(2026, 4, 10)

describe('Golden Fixture A: M1 ICE WLTP 160g/km 2100kg', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: 2100,
    generalEngineType: EngineType.ICE, co2Standard: Co2Standard.WLTP,
    co2Emission: 160, fuelType: FuelType.PETROL,
    maxNetPower: 100, kerbMass: 1600, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annualTax = 210.08', () => expect(result.annualTax).toBe(210.08))
  it('annual.base = 50', () => expect(result.annual.baseAmount).toBe(50))
  it('annual.co2 = 123.28', () => expect(result.annual.co2Amount).toBe(123.28))
  it('annual.mass = 36.80', () => expect(result.annual.massAmount).toBe(36.80))
  it('regFee = 829.20', () => expect(result.registrationFee).toBe(829.20))
  it('reg.base = 150', () => expect(result.registration.baseAmount).toBe(150))
  it('reg.co2 = 583.20', () => expect(result.registration.co2Amount).toBe(583.20))
  it('reg.mass = 96', () => expect(result.registration.massAmount).toBe(96))
  it('annualAgeMultiplier = 0.92', () => expect(result.derived.annualAgeMultiplier).toBe(0.92))
  it('regAgeMultiplier = 0.48', () => expect(result.derived.registrationAgeMultiplier).toBe(0.48))
  it('group = car_or_powerful_van', () => expect(result.derived.vehicleGroup).toBe('car_or_powerful_van'))
})

describe('Golden Fixture B: M1 OVC-HEV Missing CO₂', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: 2300,
    generalEngineType: EngineType.OVC_HEV, co2Standard: Co2Standard.NOT_AVAILABLE,
    co2Emission: null, fuelType: FuelType.PETROL,
    maxNetPower: 100, kerbMass: 1800, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annualTax = 86.80', () => expect(result.annualTax).toBe(86.80))
  it('annual.base = 50', () => expect(result.annual.baseAmount).toBe(50))
  it('annual.co2 = 0 (PHEV+missing excluded)', () => expect(result.annual.co2Amount).toBe(0))
  it('annual.mass = 36.80', () => expect(result.annual.massAmount).toBe(36.80))
  it('regFee = 476', () => expect(result.registrationFee).toBe(476))
  it('reg.base = 150', () => expect(result.registration.baseAmount).toBe(150))
  it('reg.co2 = 230 (fixed)', () => expect(result.registration.co2Amount).toBe(230))
  it('reg.mass = 96', () => expect(result.registration.massAmount).toBe(96))
  it('effectiveCo2 = 0', () => expect(result.derived.effectiveCo2Emission).toBe(0))
})

describe('Golden Fixture C: M1 Electric Heavy 2600kg', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: 2600,
    generalEngineType: EngineType.ELECTRIC, co2Standard: Co2Standard.WLTP,
    co2Emission: null, fuelType: FuelType.OTHER,
    maxNetPower: null, kerbMass: null, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annualTax = 123.60', () => expect(result.annualTax).toBe(123.60))
  it('annual.base = 50', () => expect(result.annual.baseAmount).toBe(50))
  it('annual.co2 = 0', () => expect(result.annual.co2Amount).toBe(0))
  it('annual.mass = 73.60', () => expect(result.annual.massAmount).toBe(73.60))
  it('regFee = 342', () => expect(result.registrationFee).toBe(342))
  it('reg.base = 150', () => expect(result.registration.baseAmount).toBe(150))
  it('reg.co2 = 0', () => expect(result.registration.co2Amount).toBe(0))
  it('reg.mass = 192', () => expect(result.registration.massAmount).toBe(192))
})

describe('Golden Fixture D: Motorcycle 600cc', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: null,
    generalEngineType: EngineType.ICE, co2Standard: Co2Standard.WLTP,
    co2Emission: null, fuelType: FuelType.PETROL,
    maxNetPower: null, kerbMass: null, engineCapacity: 600,
  }, { referenceDate: REF_DATE })

  it('annualTax = 60', () => expect(result.annualTax).toBe(60))
  it('annual.base = 60', () => expect(result.annual.baseAmount).toBe(60))
  it('annual.co2 = 0', () => expect(result.annual.co2Amount).toBe(0))
  it('annual.mass = 0', () => expect(result.annual.massAmount).toBe(0))
  it('regFee = 0', () => expect(result.registrationFee).toBe(0))
  it('group = motorcycle_atv_tractor', () => expect(result.derived.vehicleGroup).toBe('motorcycle_atv_tractor'))
})

describe('Edge: 20+ year old car', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.M1_M1G, isHouse: false,
    initialRegDate: '01.01.2000', grossWeight: 2100,
    generalEngineType: EngineType.ICE, co2Standard: Co2Standard.WLTP,
    co2Emission: 160, fuelType: FuelType.PETROL,
    maxNetPower: 100, kerbMass: 1600, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annualTax = 0 (exempt)', () => expect(result.annualTax).toBe(0))
  it('regFee still calculated', () => expect(result.registrationFee).toBeGreaterThan(0))
  it('reg multiplier = 0.05', () => expect(result.derived.registrationAgeMultiplier).toBe(0.05))
})

describe('Edge: Electric motorcycle = unsupported', () => {
  const result = calculateAutomaks({
    vehicleType: VehicleType.L3e_L4e_L5e_L6e_L7e, isHouse: false,
    initialRegDate: '01.05.2021', grossWeight: null,
    generalEngineType: EngineType.ELECTRIC, co2Standard: Co2Standard.WLTP,
    co2Emission: null, fuelType: FuelType.OTHER,
    maxNetPower: null, kerbMass: null, engineCapacity: null,
  }, { referenceDate: REF_DATE })

  it('annualTax = 0', () => expect(result.annualTax).toBe(0))
  it('group = unsupported', () => expect(result.derived.vehicleGroup).toBe('unsupported'))
})

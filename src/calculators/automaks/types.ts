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
  initialRegDate: string
  grossWeight: number | null
  generalEngineType: EngineType
  co2Standard: Co2Standard
  co2Emission: number | null
  fuelType: FuelType
  maxNetPower: number | null
  kerbMass: number | null
  engineCapacity: number | null
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

import { describe, it, expect } from 'vitest'
import { calculateVat } from './calculate'
import type { VatInput } from './types'

function calc(rate: number, mode: string, amount: number) {
  return calculateVat({ rate, mode, amount } as VatInput)
}

// ══════════════════════════════════════════════
// GOLDEN FIXTURES A-K
// ══════════════════════════════════════════════

describe('Fixture A: 24% Net 100', () => {
  const r = calc(0.24, 'net', 100)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 24.00', () => expect(r.vatAmount).toBe(24))
  it('gross = 124.00', () => expect(r.grossPrice).toBe(124))
  it('vatFromGross = 0.193548', () => expect(r.coefficients.vatFromGross).toBe(0.193548))
  it('vatFromNet = 0.240000', () => expect(r.coefficients.vatFromNet).toBe(0.24))
})

describe('Fixture C: 22% Net 100', () => {
  const r = calc(0.22, 'net', 100)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 22.00', () => expect(r.vatAmount).toBe(22))
  it('gross = 122.00', () => expect(r.grossPrice).toBe(122))
  it('vatFromGross = 0.180328', () => expect(r.coefficients.vatFromGross).toBe(0.180328))
})

describe('Fixture D: 13% Net 100', () => {
  const r = calc(0.13, 'net', 100)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 13.00', () => expect(r.vatAmount).toBe(13))
  it('gross = 113.00', () => expect(r.grossPrice).toBe(113))
  it('vatFromGross = 0.115044', () => expect(r.coefficients.vatFromGross).toBe(0.115044))
})

describe('Fixture E: 9% Net 100', () => {
  const r = calc(0.09, 'net', 100)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 9.00', () => expect(r.vatAmount).toBe(9))
  it('gross = 109.00', () => expect(r.grossPrice).toBe(109))
  it('vatFromGross = 0.082569', () => expect(r.coefficients.vatFromGross).toBe(0.082569))
})

describe('Fixture F: 24% VAT 24', () => {
  const r = calc(0.24, 'vat', 24)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 24.00', () => expect(r.vatAmount).toBe(24))
  it('gross = 124.00', () => expect(r.grossPrice).toBe(124))
})

describe('Fixture G: 24% Gross 124', () => {
  const r = calc(0.24, 'gross', 124)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 24.00', () => expect(r.vatAmount).toBe(24))
  it('gross = 124.00', () => expect(r.grossPrice).toBe(124))
})

describe('Fixture H: 24% Gross 100', () => {
  const r = calc(0.24, 'gross', 100)
  it('net = 80.65', () => expect(r.netPrice).toBe(80.65))
  it('vat = 19.35', () => expect(r.vatAmount).toBe(19.35))
  it('gross = 100.00', () => expect(r.grossPrice).toBe(100))
})

describe('Fixture I: 24% Net 1000.50', () => {
  const r = calc(0.24, 'net', 1000.50)
  it('net = 1000.50', () => expect(r.netPrice).toBe(1000.50))
  it('vat = 240.12', () => expect(r.vatAmount).toBe(240.12))
  it('gross = 1240.62', () => expect(r.grossPrice).toBe(1240.62))
})

describe('Fixture J: 13% VAT 13', () => {
  const r = calc(0.13, 'vat', 13)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 13.00', () => expect(r.vatAmount).toBe(13))
  it('gross = 113.00', () => expect(r.grossPrice).toBe(113))
})

describe('Fixture K: 22% Gross 122', () => {
  const r = calc(0.22, 'gross', 122)
  it('net = 100.00', () => expect(r.netPrice).toBe(100))
  it('vat = 22.00', () => expect(r.vatAmount).toBe(22))
  it('gross = 122.00', () => expect(r.grossPrice).toBe(122))
})

// ── Unit tests ──

describe('All rates produce correct coefficients', () => {
  it('24% vatFromGross', () => expect(calc(0.24, 'net', 1).coefficients.vatFromGross).toBe(0.193548))
  it('22% vatFromGross', () => expect(calc(0.22, 'net', 1).coefficients.vatFromGross).toBe(0.180328))
  it('13% vatFromGross', () => expect(calc(0.13, 'net', 1).coefficients.vatFromGross).toBe(0.115044))
  it('9% vatFromGross', () => expect(calc(0.09, 'net', 1).coefficients.vatFromGross).toBe(0.082569))
})

describe('Zero input', () => {
  const r = calc(0.24, 'net', 0)
  it('all zeros', () => {
    expect(r.netPrice).toBe(0)
    expect(r.vatAmount).toBe(0)
    expect(r.grossPrice).toBe(0)
  })
})

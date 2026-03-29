import { describe, it, expect } from 'vitest'
import {
  calcConcrete, cmPerPx, tiltDeg, levelLabel,
  BAG_KG, PRICE_ZAR, WASTAGE, DENSITY,
} from '../utils/measureCalc'

/* ─── tiltDeg ─────────────────────────────────────────────── */
describe('tiltDeg', () => {
  it('returns 0 when beta is 0 (phone perfectly flat)', () => {
    expect(tiltDeg(0)).toBe(0)
  })

  it('returns absolute value for negative beta', () => {
    expect(tiltDeg(-25)).toBe(25)
  })

  it('defaults to 0 when beta is null/undefined', () => {
    expect(tiltDeg(null)).toBe(0)
    expect(tiltDeg(undefined)).toBe(0)
  })
})

/* ─── levelLabel ─────────────────────────────────────────── */
describe('levelLabel', () => {
  it('returns green for tilt < 15°', () => {
    expect(levelLabel(0).color).toBe('#22C55E')
    expect(levelLabel(14).color).toBe('#22C55E')
  })

  it('returns amber for tilt 15–30°', () => {
    expect(levelLabel(15).color).toBe('#F59E0B')
    expect(levelLabel(29).color).toBe('#F59E0B')
  })

  it('returns red for tilt >= 30°', () => {
    expect(levelLabel(30).color).toBe('#EF4444')
    expect(levelLabel(90).color).toBe('#EF4444')
  })

  it('includes descriptive text', () => {
    expect(levelLabel(5).text).toContain('great')
    expect(levelLabel(20).text).toContain('tilted')
    expect(levelLabel(45).text).toContain('flat')
  })
})

/* ─── cmPerPx (FOV-based) ────────────────────────────────── */
describe('cmPerPx — FOV-based (no calibration)', () => {
  it('returns positive scale', () => {
    const scale = cmPerPx(null, 1280, 720, 120, 0)
    expect(scale).toBeGreaterThan(0)
  })

  it('larger canvas width → smaller scale (more real estate per pixel)', () => {
    const narrow = cmPerPx(null, 640,  720, 120, 0)
    const wide   = cmPerPx(null, 1280, 720, 120, 0)
    expect(narrow).toBeGreaterThan(wide)
  })

  it('higher phone → larger field → larger scale', () => {
    const low  = cmPerPx(null, 1280, 720,  60, 0)
    const high = cmPerPx(null, 1280, 720, 180, 0)
    expect(high).toBeGreaterThan(low)
  })

  it('strong tilt increases effective height and scale', () => {
    const flat   = cmPerPx(null, 1280, 720, 120,  0)
    const tilted = cmPerPx(null, 1280, 720, 120, 40)
    expect(tilted).toBeGreaterThan(flat)
  })

  it('scale matches expected value for phone at 120 cm, no tilt, 1280px wide', () => {
    // fieldWidth = 2 * 120 * tan(69°/2 * π/180) = 2 * 120 * tan(34.5°) ≈ 165.2 cm
    // scale ≈ 165.2 / 1280 ≈ 0.1289
    const scale = cmPerPx(null, 1280, 720, 120, 0)
    expect(scale).toBeCloseTo(0.1289, 2)
  })
})

/* ─── cmPerPx (calibrated) ───────────────────────────────── */
describe('cmPerPx — calibrated mode', () => {
  it('uses calibration ratio instead of FOV math', () => {
    // Credit card 8.56cm wide drawn as 200px wide
    const calData = {
      obj:  { widthCm: 8.56, heightCm: 5.40 },
      rect: { w: 200, h: 126 },          // ~200×126 px
    }
    const scale = cmPerPx(calData, 1280, 720, 120, 0)
    // scaleW = 8.56/200 = 0.0428, scaleH = 5.40/126 ≈ 0.0429, avg ≈ 0.0428
    expect(scale).toBeCloseTo(0.0428, 3)
  })

  it('ignores phone height and tilt when calibrated', () => {
    const calData = {
      obj:  { widthCm: 21.0, heightCm: 29.7 },
      rect: { w: 500, h: 707 },
    }
    const s1 = cmPerPx(calData, 1280, 720,  60,  0)
    const s2 = cmPerPx(calData, 1280, 720, 200, 45)
    expect(s1).toBeCloseTo(s2, 6)
  })
})

/* ─── calcConcrete ───────────────────────────────────────── */
describe('calcConcrete', () => {
  it('volume formula: L × W × D in metres', () => {
    const { volM3 } = calcConcrete(100, 50, 10)
    // 1m × 0.5m × 0.1m = 0.05 m³
    expect(volM3).toBeCloseTo(0.05, 6)
  })

  it('massKg includes WASTAGE multiplier', () => {
    const { massKg } = calcConcrete(100, 50, 10)
    // 0.05 * 1.20 * 2300 = 138
    expect(massKg).toBe(138)
  })

  it('bags rounds up', () => {
    // massKg = 138, BAG_KG = 40 → ceil(138/40) = 4
    expect(calcConcrete(100, 50, 10).bags).toBe(4)
  })

  it('costZAR = bags × price', () => {
    const { bags, costZAR } = calcConcrete(100, 50, 10)
    expect(costZAR).toBe(bags * PRICE_ZAR)
  })

  it('labourH minimum is 1', () => {
    // tiny pothole — still at least 1 hour
    expect(calcConcrete(5, 5, 1).labourH).toBeGreaterThanOrEqual(1)
  })

  it('small pothole (30×20×5 cm) gives reasonable estimates', () => {
    const { bags, costZAR, massKg } = calcConcrete(30, 20, 5)
    // vol = 0.03*0.02*0.05 = 0.00003 m³
    // mass = 0.00003 * 1.2 * 2300 ≈ 0.083 kg → 1 bag
    expect(bags).toBe(1)
    expect(massKg).toBeGreaterThan(0)
    expect(costZAR).toBe(PRICE_ZAR)
  })

  it('large pothole (200×150×20 cm) gives many bags', () => {
    const { bags } = calcConcrete(200, 150, 20)
    // vol = 2*1.5*0.2 = 0.6 m³; mass = 0.6*1.2*2300=1656 kg; bags=ceil(1656/40)=42
    expect(bags).toBe(42)
  })

  it('constants are sensible values', () => {
    expect(WASTAGE).toBeGreaterThan(1)       // should include wastage
    expect(DENSITY).toBeGreaterThan(2000)    // asphalt density
    expect(BAG_KG).toBeGreaterThan(0)
    expect(PRICE_ZAR).toBeGreaterThan(0)
  })
})

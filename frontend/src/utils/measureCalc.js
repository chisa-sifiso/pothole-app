/** Pure measurement / concrete calculation utilities shared by PotholeMeasure */

export const FOVH_DEG  = 69
export const FOVV_DEG  = 53
export const DENSITY   = 2300   // kg/m³
export const BAG_KG    = 40
export const PRICE_ZAR = 95
export const WASTAGE   = 1.20

export const d2r = (d) => (d * Math.PI) / 180

export function tiltDeg(beta) {
  return Math.abs(beta ?? 0)
}

export function levelLabel(tilt) {
  if (tilt < 15) return { text: 'Level — great!',           color: '#22C55E' }
  if (tilt < 30) return { text: 'Slightly tilted',           color: '#F59E0B' }
  return             { text: 'Too tilted — hold phone flat', color: '#EF4444' }
}

/**
 * Returns cm-per-pixel scale factor.
 * If calData is provided (calibration rect + known object), uses that.
 * Otherwise falls back to FOV-based math with tilt correction.
 */
export function cmPerPx(calData, canvasW, _canvasH, phoneHCm, beta) {
  if (calData) {
    const scaleW = calData.obj.widthCm  / calData.rect.w
    const scaleH = calData.obj.heightCm / calData.rect.h
    return (scaleW + scaleH) / 2
  }
  const tilt     = tiltDeg(beta)
  const effH     = phoneHCm / Math.max(Math.cos(d2r(Math.min(tilt, 60))), 0.4)
  const fieldWCm = 2 * effH * Math.tan(d2r(FOVH_DEG / 2))
  return fieldWCm / canvasW
}

/**
 * Given pothole dimensions (cm) and depth (cm), returns concrete repair estimates.
 */
export function calcConcrete(lCm, wCm, dCm) {
  const volM3   = (lCm / 100) * (wCm / 100) * (dCm / 100)
  const massKg  = volM3 * WASTAGE * DENSITY
  const bags    = Math.ceil(massKg / BAG_KG)
  const costZAR = bags * PRICE_ZAR
  const labourH = Math.max(1, Math.ceil(massKg / 150))
  return { volM3, massKg: Math.round(massKg), bags, costZAR, labourH }
}

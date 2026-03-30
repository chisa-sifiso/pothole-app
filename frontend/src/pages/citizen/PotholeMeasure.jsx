/**
 * PotholeMeasure — production-ready camera measurement component.
 *
 * Phases: intro → [calibrate] → camera → depth → result
 *
 * Accuracy approach:
 *   • Optional calibration with known object (credit card / A4) computes the
 *     exact pixels-per-cm ratio, completely bypassing FOV guessing.
 *   • Without calibration: FOV-based math + DeviceOrientation tilt correction.
 *   • Level indicator warns when the phone is too tilted.
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  X, Camera, Ruler, ChevronRight, ChevronLeft, CheckCircle,
  RotateCcw, Info, AlertTriangle, CreditCard, Target,
} from 'lucide-react'
import {
  BAG_KG, PRICE_ZAR, WASTAGE, DENSITY,
  cmPerPx, calcConcrete, tiltDeg, levelLabel,
} from '../../utils/measureCalc'

/* ─── calibration reference objects ────────────────────────── */
const CAL_OBJECTS = [
  { id: 'card', label: 'Bank / credit card', widthCm: 8.56, heightCm: 5.40 },
  { id: 'a4',   label: 'A4 paper',           widthCm: 21.0, heightCm: 29.7 },
  { id: 'a5',   label: 'A5 paper',           widthCm: 14.8, heightCm: 21.0 },
]

/* ─── depth presets ─────────────────────────────────────────── */
const DEPTH_PRESETS = [
  { label: 'Crack',    sub: '1–3 cm',  val: 2,  ring: '#FBBF24' },
  { label: 'Shallow',  sub: '3–7 cm',  val: 5,  ring: '#F97316' },
  { label: 'Medium',   sub: '7–15 cm', val: 10, ring: '#EF4444' },
  { label: 'Deep',     sub: '15+ cm',  val: 20, ring: '#991B1B' },
]

const HANDLE_R = 30   // px — touch hit radius for corner handles

/* ─── canvas draw helpers ────────────────────────────────────── */
const d2r = (d) => (d * Math.PI) / 180

/* ─── canvas draw ────────────────────────────────────────────── */
function drawOverlay(ctx, cw, ch, rect, scale, isCalibrate, hintPulse) {
  // NOTE: clearRect is called by the RAF loop BEFORE this function,
  // so the background image is drawn first, then overlay on top.

  if (!rect) {
    // pulsing crosshair hint — no dark fill so video shows through
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.3 * Math.sin(hintPulse)})`
    ctx.lineWidth = 1.5
    ctx.setLineDash([8, 8])
    ctx.beginPath(); ctx.moveTo(cw / 2, 0);  ctx.lineTo(cw / 2, ch);  ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, ch / 2);  ctx.lineTo(cw, ch / 2);  ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = `rgba(255,255,255,${0.7 + 0.2 * Math.sin(hintPulse)})`
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    const msg = isCalibrate ? 'Drag to outline the reference object' : 'Drag to outline the pothole'
    ctx.fillText(msg, cw / 2, ch / 2 + 28)
    return
  }

  // darken outside selection
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 0, cw, ch)
  ctx.clearRect(rect.x, rect.y, rect.w, rect.h)

  // border
  const color = isCalibrate ? '#60A5FA' : '#F59E0B'
  ctx.strokeStyle = color
  ctx.lineWidth   = 2.5
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)

  // corner handles
  const corners = [
    [rect.x,          rect.y         ],
    [rect.x + rect.w, rect.y         ],
    [rect.x,          rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
  ]
  corners.forEach(([cx, cy]) => {
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
    ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5; ctx.stroke()
  })

  // dimension labels
  if (scale > 0) {
    const wCm = Math.max(1, Math.round(rect.w * scale))
    const hCm = Math.max(1, Math.round(rect.h * scale))
    ctx.font      = 'bold 14px system-ui, sans-serif'
    ctx.fillStyle = '#FFF'
    ctx.textAlign = 'center'

    // width (above top edge)
    const labelY = rect.y > 24 ? rect.y - 8 : rect.y + rect.h + 20
    ctx.fillText(`${wCm} cm`, rect.x + rect.w / 2, labelY)

    // height (right of right edge, rotated)
    const labelX = rect.x + rect.w + (cw - rect.x - rect.w > 36 ? 24 : -24)
    ctx.save()
    ctx.translate(labelX, rect.y + rect.h / 2)
    ctx.rotate(Math.PI / 2)
    ctx.fillText(`${hCm} cm`, 0, 0)
    ctx.restore()
  }
}

/* ════════════════════════════════════════════════════════════════
   Component
════════════════════════════════════════════════════════════════ */
export default function PotholeMeasure({ onClose, onConfirm }) {

  /* ── phase ── */
  const PHASES = ['intro', 'calibrate', 'camera', 'depth', 'result']
  const [phase, setPhase] = useState('intro')   // intro|calibrate|camera|depth|result

  /* ── intro settings ── */
  const [phoneH, setPhoneH]           = useState(120)    // cm
  const [useCalibration, setUseCal]   = useState(true)
  const [calObjId, setCalObjId]       = useState('card')

  /* ── orientation ── */
  const [beta, setBeta]               = useState(0)
  const betaRef                       = useRef(0)

  /* ── camera / canvas ── */
  const [stream, setStream]           = useState(null)
  const [camErr, setCamErr]           = useState(null)
  const [useFallback, setUseFallback] = useState(false)
  const [hasCapture, setHasCapture]   = useState(false)
  const capturedImgRef                = useRef(null)
  const videoRef                      = useRef(null)
  const canvasRef                     = useRef(null)
  const rafRef                        = useRef(null)
  const hintPulseRef                  = useRef(0)

  /* ── rect drawing (live refs for RAF loop) ── */
  const [rect, setRect]               = useState(null)
  const rectRef                       = useRef(null)
  const dragging                      = useRef(null)   // null|'new'|'move'|'TL'|'TR'|'BL'|'BR'
  const dragOrigin                    = useRef(null)

  /* ── calibration result ── */
  const [calData, setCalData]         = useState(null)   // { obj, rect }
  const calDataRef                    = useRef(null)

  /* ── measurement ── */
  const [dims, setDims]               = useState(null)   // { lCm, wCm }
  const [depthCm, setDepthCm]         = useState(5)
  const [concrete, setConcrete]       = useState(null)

  /* ── sync refs ── */
  useEffect(() => { rectRef.current   = rect },    [rect])
  useEffect(() => { calDataRef.current = calData }, [calData])
  useEffect(() => { betaRef.current   = beta },    [beta])

  /* ── DeviceOrientation ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.beta !== null) { setBeta(e.beta); betaRef.current = e.beta }
    }
    window.addEventListener('deviceorientation', handler, true)
    return () => window.removeEventListener('deviceorientation', handler, true)
  }, [])

  /* ── stop stream helper ── */
  const stopStream = useCallback(() => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setStream(null) }
    cancelAnimationFrame(rafRef.current)
    capturedImgRef.current = null
    setHasCapture(false)
    setUseFallback(false)

  }, [stream])

  /* ── cleanup on unmount ── */
  useEffect(() => () => {
    stopStream()
    cancelAnimationFrame(rafRef.current)
  }, [stopStream])

  /* ── file capture fallback (iOS HTTP) ── */
  const handleFileCapture = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      capturedImgRef.current = img
      setRect(null)
      rectRef.current = null
      setHasCapture(true)   // triggers re-render to show canvas
    }
    img.src = url
    e.target.value = ''
  }, [])

  /* ── start camera ── */
  const startCamera = useCallback(async () => {
    setCamErr(null)
    cancelAnimationFrame(rafRef.current)
    capturedImgRef.current = null

    // iOS on HTTP — mediaDevices is undefined, use file input fallback
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUseFallback(true)
      return
    }

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      setStream(s)
      setUseFallback(false)
    } catch (err) {
      if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
        setUseFallback(true)
        return
      }
      const msg =
        err.name === 'NotFoundError'        ? 'No camera found on this device.' :
        err.name === 'OverconstrainedError' ? 'Could not access the rear camera. Try again.' :
        'Camera unavailable: ' + err.message
      setCamErr(msg)
    }
  }, [])

  /* ── attach video stream ── */
  useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
    videoRef.current.play().catch(() => {})
  }, [stream])

  /* ── canvas size sync ── */
  useEffect(() => {
    if (phase !== 'calibrate' && phase !== 'camera') return
    const canvas = canvasRef.current
    if (!canvas) return
    const sync = () => {
      canvas.width  = canvas.offsetWidth  || canvas.clientWidth  || 320
      canvas.height = canvas.offsetHeight || canvas.clientHeight || 480
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [phase, hasCapture])   // re-run when canvas appears after photo taken

  /* ── RAF draw loop ── */
  useEffect(() => {
    if (phase !== 'calibrate' && phase !== 'camera') return
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas) return

    const isCalibrate = phase === 'calibrate'
    let frame = 0

    const draw = () => {
      hintPulseRef.current += 0.05
      const cw  = canvas.width
      const ch  = canvas.height
      const ctx = canvas.getContext('2d')

      // 1. Clear canvas
      ctx.clearRect(0, 0, cw, ch)

      // 2. Draw background — captured photo (iOS) or nothing (live video shown behind canvas)
      if (capturedImgRef.current) {
        ctx.drawImage(capturedImgRef.current, 0, 0, cw, ch)
      }

      // 3. Overlay drawn on top (drawOverlay no longer calls clearRect)

      const r   = rectRef.current
      const cd  = calDataRef.current
      const b   = betaRef.current
      const scale = r
        ? cmPerPx(isCalibrate ? null : cd, cw, ch, phoneH, b)
        : 0

      drawOverlay(ctx, cw, ch, r, scale, isCalibrate, hintPulseRef.current)

      // tilt bar (camera phase only)
      if (!isCalibrate) {
        const tilt    = tiltDeg(b)
        const { color } = levelLabel(tilt)
        const barW  = Math.min(160, cw * 0.45)
        const fill  = Math.min(1, tilt / 45)
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.beginPath(); ctx.roundRect(cw/2 - barW/2, 12, barW, 20, 10); ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath(); ctx.roundRect(cw/2 - barW/2 + 2, 14, Math.max(4, (barW-4)*fill), 16, 8); ctx.fill()
        ctx.fillStyle = '#FFF'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(levelLabel(tilt).text, cw / 2, 28)
      }

      rafRef.current = requestAnimationFrame(draw)
      frame++
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, phoneH, hasCapture])   // hasCapture: restart RAF when photo loaded

  /* ═══ pointer interaction ═══ */
  function canvasXY(e) {
    const canvas = canvasRef.current
    const b      = canvas.getBoundingClientRect()
    const src    = e.touches ? e.touches[0] : e
    const scaleX = canvas.width  / b.width
    const scaleY = canvas.height / b.height
    return [(src.clientX - b.left) * scaleX, (src.clientY - b.top) * scaleY]
  }

  function hitCorner(r, px, py) {
    const pts = { TL:[r.x,r.y], TR:[r.x+r.w,r.y], BL:[r.x,r.y+r.h], BR:[r.x+r.w,r.y+r.h] }
    for (const [k,[cx,cy]] of Object.entries(pts)) {
      if (Math.hypot(px-cx, py-cy) < HANDLE_R) return k
    }
    return null
  }

  const onDown = (e) => {
    e.preventDefault()
    const [px, py] = canvasXY(e)
    const r        = rectRef.current
    if (r) {
      const corner = hitCorner(r, px, py)
      if (corner) {
        dragging.current    = corner
        dragOrigin.current  = { px, py, r: { ...r } }
        return
      }
      if (px >= r.x && px <= r.x+r.w && py >= r.y && py <= r.y+r.h) {
        dragging.current   = 'move'
        dragOrigin.current = { px, py, r: { ...r } }
        return
      }
    }
    dragging.current   = 'new'
    dragOrigin.current = { px, py }
    const newR = { x: px, y: py, w: 1, h: 1 }
    setRect(newR); rectRef.current = newR
  }

  const onMove = (e) => {
    if (!dragging.current) return
    e.preventDefault()
    const [px, py] = canvasXY(e)
    const o        = dragOrigin.current

    let r
    if (dragging.current === 'new') {
      r = { x: Math.min(px,o.px), y: Math.min(py,o.py), w: Math.abs(px-o.px), h: Math.abs(py-o.py) }
    } else if (dragging.current === 'move') {
      r = { ...o.r, x: o.r.x + (px-o.px), y: o.r.y + (py-o.py) }
    } else {
      r = { ...o.r }
      const dx = px - o.px; const dy = py - o.py
      if (dragging.current === 'TL') { r.x+=dx; r.y+=dy; r.w-=dx; r.h-=dy }
      if (dragging.current === 'TR') { r.y+=dy; r.w+=dx; r.h-=dy }
      if (dragging.current === 'BL') { r.x+=dx; r.w-=dx; r.h+=dy }
      if (dragging.current === 'BR') { r.w+=dx; r.h+=dy }
    }
    r.w = Math.max(r.w, 10); r.h = Math.max(r.h, 10)
    setRect(r); rectRef.current = r
  }

  const onUp = () => { dragging.current = null; dragOrigin.current = null }

  /* ═══ transitions ═══ */
  const goToCalibrate = async () => {
    setRect(null); rectRef.current = null
    await startCamera()
    setPhase('calibrate')
  }

  const goToCamera = async () => {
    setRect(null); rectRef.current = null
    if (!stream) await startCamera()
    setPhase('camera')
  }

  const confirmCalibration = () => {
    const canvas = canvasRef.current
    if (!canvas || !rect) return
    const obj  = CAL_OBJECTS.find((o) => o.id === calObjId)
    const data = { obj, rect: { ...rect } }
    setCalData(data); calDataRef.current = data
    setRect(null); rectRef.current = null
    // reset capture so user takes a fresh pothole photo in camera phase
    capturedImgRef.current = null
    setHasCapture(false)
    setPhase('camera')
  }

  const confirmMeasurement = () => {
    const canvas = canvasRef.current
    if (!canvas || !rect) return
    const scale = cmPerPx(calData, canvas.width, canvas.height, phoneH, beta)
    const lCm   = Math.max(1, Math.round(rect.h * scale))
    const wCm   = Math.max(1, Math.round(rect.w * scale))
    setDims({ lCm, wCm })
    stopStream()
    setPhase('depth')
  }

  const confirmDepth = () => {
    const c = calcConcrete(dims.lCm, dims.wCm, depthCm)
    setConcrete(c)
    setPhase('result')
  }

  const handleUse = () => {
    onConfirm({
      measuredLength: dims.lCm,
      measuredWidth:  dims.wCm,
      measuredDepth:  depthCm,
      concreteKg:     concrete.massKg,
    })
    onClose()
  }

  const reset = () => {
    stopStream()
    setRect(null); rectRef.current = null
    setCalData(null); calDataRef.current = null
    setDims(null); setConcrete(null); setDepthCm(5)
    dragging.current = null
    setPhase('intro')
  }

  /* ── phase indicator ── */
  const phaseIndex = PHASES.indexOf(phase)

  /* ─────────────────────────────────────────── RENDER ─── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white select-none">

      {/* ── header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-sm">Pothole Measure</span>
          {calData && (
            <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full">Calibrated</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {phase !== 'intro' && (
            <button onClick={reset} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── step dots ── */}
      <div className="flex items-center justify-center gap-2 py-2 bg-gray-900 shrink-0">
        {['Setup', useCalibration ? 'Calibrate' : null, 'Measure', 'Depth', 'Result']
          .filter(Boolean)
          .map((label, i) => {
            const active  = i === (useCalibration ? phaseIndex : [0,2,3,4].indexOf(phaseIndex))
            return (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <div className={`h-1.5 rounded-full transition-all ${active ? 'w-5 bg-amber-400' : 'w-1.5 bg-gray-600'}`} />
              </div>
            )
          })}
      </div>

      {/* ══════════════ INTRO ══════════════ */}
      {phase === 'intro' && (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* hero */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
              <Ruler className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold">Measure the Pothole</h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              Point your camera down at the pothole, outline it on screen, and get
              an accurate concrete repair estimate.
            </p>
          </div>

          {/* phone height */}
          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="w-4 h-4 text-amber-400" />
              How high will you hold your phone?
            </div>
            <input
              type="range" min={60} max={200} value={phoneH}
              onChange={(e) => setPhoneH(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">60 cm (crouching)</span>
              <span className="text-amber-400 font-bold text-sm">{phoneH} cm</span>
              <span className="text-gray-500">200 cm (tall)</span>
            </div>
            <p className="text-xs text-gray-500">
              Stand directly above the pothole and hold your phone with the camera
              pointing straight down at this height.
            </p>
          </div>

          {/* calibration toggle */}
          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Use a reference object <span className="text-xs text-green-400 font-semibold">Recommended</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Place a card or sheet of paper next to the pothole for the most accurate result.
                </p>
              </div>
              <button
                onClick={() => setUseCal((v) => !v)}
                className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${useCalibration ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useCalibration ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {useCalibration && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {CAL_OBJECTS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setCalObjId(o.id)}
                    className={`rounded-xl p-2.5 text-center border-2 transition-all text-xs ${
                      calObjId === o.id
                        ? 'border-blue-400 bg-blue-500/10 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">{o.label.split(' ')[0]}</div>
                    <div className="text-gray-500">{o.widthCm}×{o.heightCm}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* tips */}
          <div className="bg-blue-950/40 border border-blue-800/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-2">
              <Info className="w-3.5 h-3.5" /> Tips for best accuracy
            </div>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Stand directly above the pothole</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Keep the phone horizontal (flat), camera pointing down</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Make sure the whole pothole is visible in the frame</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Measure in daylight or good artificial light</li>
            </ul>
          </div>

          {camErr && (
            <div className="flex gap-2 bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {camErr}
            </div>
          )}

          <button
            onClick={useCalibration ? goToCalibrate : goToCamera}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </button>
        </div>
      )}

      {/* ══════════════ CALIBRATE ══════════════ */}
      {phase === 'calibrate' && (
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="bg-blue-900/60 border-b border-blue-800 px-4 py-2.5 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-200">
              <CreditCard className="w-4 h-4" />
              Step 1 of 2 — Calibrate with {CAL_OBJECTS.find(o=>o.id===calObjId)?.label}
            </div>
            <p className="text-xs text-blue-300 mt-0.5">
              Place the object flat on the ground beside the pothole, then drag to outline it.
            </p>
          </div>

          {/* file input — label triggers it (iOS safe) */}
          <input id="cal-photo-input" type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFileCapture} />

          {/* live video (non-fallback) */}
          {!useFallback && (
            <video ref={videoRef} autoPlay playsInline muted webkit-playsinline="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )}

          {/* fallback: no image yet */}
          {useFallback && !hasCapture && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 bg-gray-950">
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Step 1: Calibrate</p>
                <p className="text-gray-400 text-sm">
                  Place your <span className="text-blue-300 font-semibold">{CAL_OBJECTS.find(o=>o.id===calObjId)?.label}</span> flat beside the pothole and take a photo.
                </p>
              </div>
              <label htmlFor="cal-photo-input"
                className="py-3 px-8 rounded-2xl bg-blue-500 active:bg-blue-600 text-white font-bold flex items-center gap-2 cursor-pointer select-none">
                <Camera className="w-5 h-5" /> Take Photo
              </label>
            </div>
          )}

          {/* canvas — only shown when video is live OR photo captured */}
          {(!useFallback || hasCapture) && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              style={{ background: 'transparent' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            />
          )}

          {/* bottom bar — only shown when ready to draw */}
          {(!useFallback || hasCapture) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-4 flex items-center justify-between shrink-0">
              <button onClick={() => { stopStream(); setPhase('intro') }}
                className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-center">
                {rect && <div className="text-xs text-blue-300 font-semibold">Outlined — drag corners to adjust</div>}
                {useFallback && hasCapture && !rect && (
                  <label htmlFor="cal-photo-input"
                    className="text-xs text-amber-400 underline cursor-pointer"
                    onClick={() => { capturedImgRef.current = null; setHasCapture(false) }}>
                    Retake Photo
                  </label>
                )}
              </div>
              <button disabled={!rect} onClick={confirmCalibration}
                className="flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-200 disabled:opacity-30 disabled:pointer-events-none">
                Measure Pothole <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ CAMERA ══════════════ */}
      {phase === 'camera' && (
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {calData && (
            <div className="bg-green-900/50 border-b border-green-800 px-4 py-2 shrink-0 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-300 font-semibold">
                Calibrated with {calData.obj.label} — high accuracy mode
              </span>
            </div>
          )}

          {/* file input — label triggers it (iOS safe) */}
          <input id="cam-photo-input" type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFileCapture} />

          {/* live video (non-fallback) */}
          {!useFallback && (
            <video ref={videoRef} autoPlay playsInline muted webkit-playsinline="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )}

          {/* fallback: no image yet */}
          {useFallback && !hasCapture && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 bg-gray-950">
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Step 2: Measure Pothole</p>
                <p className="text-gray-400 text-sm">
                  Take a photo of the <span className="text-amber-300 font-semibold">pothole</span> from directly above.
                </p>
              </div>
              <label htmlFor="cam-photo-input"
                className="py-3 px-8 rounded-2xl bg-amber-500 active:bg-amber-600 text-black font-bold flex items-center gap-2 cursor-pointer select-none">
                <Camera className="w-5 h-5" /> Take Photo
              </label>
            </div>
          )}

          {/* canvas — only when live video OR photo captured */}
          {(!useFallback || hasCapture) && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              style={{ background: 'transparent' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            />
          )}

          {/* controls — only when ready */}
          {(!useFallback || hasCapture) && (
            <>
              {/* phone height chip */}
              <div className="absolute top-10 right-3 bg-black/60 rounded-full px-3 py-1 text-xs text-amber-400 font-semibold">
                {phoneH} cm
              </div>

              {/* redraw button */}
              {rect && (
                <button
                  onClick={() => { setRect(null); rectRef.current = null }}
                  className="absolute top-10 left-3 bg-black/60 rounded-full px-3 py-1 text-xs text-gray-300 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Redraw
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-4 flex items-center justify-between shrink-0">
                <button
                  onClick={() => { if (useCalibration) { setRect(null); rectRef.current = null; setPhase('calibrate') } else { stopStream(); setPhase('intro') } }}
                  className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="text-center">
                  {rect && (() => {
                    const canvas = canvasRef.current
                    if (!canvas) return null
                    const scale = cmPerPx(calData, canvas.width, canvas.height, phoneH, beta)
                    const wCm   = Math.max(1, Math.round(rect.w * scale))
                    const lCm   = Math.max(1, Math.round(rect.h * scale))
                    return <div className="text-amber-400 font-bold text-sm">{lCm} × {wCm} cm</div>
                  })()}
                  {!rect && !useFallback && <div className="text-xs text-gray-400">Drag to outline pothole</div>}
                  {!rect && useFallback && hasCapture && (
                    <label htmlFor="cam-photo-input"
                      className="text-xs text-amber-400 underline cursor-pointer"
                      onClick={() => { capturedImgRef.current = null; setHasCapture(false) }}>
                      Retake Photo
                    </label>
                  )}
                </div>
                <button
                  disabled={!rect}
                  onClick={confirmMeasurement}
                  className="flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-amber-200 disabled:opacity-30 disabled:pointer-events-none">
                  Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════ DEPTH ══════════════ */}
      {phase === 'depth' && dims && (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <h2 className="text-lg font-bold">Estimate the Depth</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Measured footprint: <span className="text-white font-semibold">{dims.lCm} × {dims.wCm} cm</span>
            </p>
          </div>

          {/* visual depth scale */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden" style={{ height: 80 }}>
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-amber-500/20 border-r border-gray-700 flex items-center justify-center">
                <span className="text-xs text-gray-400">Road surface</span>
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 bg-gray-600 transition-all duration-300 flex items-center justify-center"
              style={{ height: `${Math.min(100, (depthCm / 30) * 100)}%` }}
            >
              <span className="text-xs font-bold text-white">{depthCm} cm</span>
            </div>
          </div>

          {/* presets */}
          <div className="grid grid-cols-2 gap-2">
            {DEPTH_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setDepthCm(p.val)}
                className={`rounded-2xl p-3.5 text-left border-2 transition-all ${
                  depthCm === p.val
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.ring }} />
                  <span className="text-sm font-semibold">{p.label}</span>
                </div>
                <div className="text-xs text-gray-400">{p.sub}</div>
              </button>
            ))}
          </div>

          {/* fine slider */}
          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fine-tune</span>
              <span className="text-amber-400 font-bold">{depthCm} cm</span>
            </div>
            <input
              type="range" min={1} max={30} value={depthCm}
              onChange={(e) => setDepthCm(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 cm (crack)</span><span>30 cm (very deep)</span>
            </div>
          </div>

          {/* live concrete preview */}
          {(() => {
            const c = calcConcrete(dims.lCm, dims.wCm, depthCm)
            return (
              <div className="bg-gray-800 rounded-2xl divide-y divide-gray-700">
                {[
                  ['Volume',          `${(c.volM3 * 1000).toFixed(2)} L`],
                  ['Concrete needed', `${c.bags} bags  ·  ${c.massKg} kg`],
                  ['Est. cost',       `R ${c.costZAR}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-semibold text-amber-400">{v}</span>
                  </div>
                ))}
              </div>
            )
          })()}

          <div className="flex gap-3">
            <button
              onClick={() => { stopStream(); goToCamera() }}
              className="flex-1 py-3.5 rounded-2xl border border-gray-700 text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Re-measure
            </button>
            <button
              onClick={confirmDepth}
              className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-2">
              Confirm <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ RESULT ══════════════ */}
      {phase === 'result' && dims && concrete && (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="text-center space-y-1">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <h2 className="text-xl font-bold">Measurement Complete</h2>
            {calData && (
              <p className="text-xs text-blue-300">
                High-accuracy mode — calibrated with {calData.obj.label}
              </p>
            )}
          </div>

          {/* dimensions */}
          <div className="bg-gray-800 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Length', value: `${dims.lCm}`, unit: 'cm' },
              { label: 'Width',  value: `${dims.wCm}`, unit: 'cm' },
              { label: 'Depth',  value: `${depthCm}`,  unit: 'cm' },
            ].map(({ label, value, unit }) => (
              <div key={label}>
                <div className="text-3xl font-black text-amber-400">{value}</div>
                <div className="text-xs text-gray-400">{unit}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* concrete breakdown */}
          <div className="bg-gray-800 rounded-2xl divide-y divide-gray-700 overflow-hidden">
            {[
              { label: 'Pothole volume',    value: `${(concrete.volM3 * 1000).toFixed(2)} litres` },
              { label: 'Concrete mass',     value: `${concrete.massKg} kg  (20% wastage incl.)` },
              { label: 'Bags needed',       value: `${concrete.bags} × ${BAG_KG} kg bags` },
              { label: 'Material cost',     value: `R ${concrete.costZAR}` },
              { label: 'Estimated labour',  value: `~${concrete.labourH} hour${concrete.labourH !== 1 ? 's' : ''}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center px-4 py-3 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-right">{value}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center">
            Assumes standard asphalt mix — density {DENSITY} kg/m³.
            Actual quantities vary by fill method and compaction.
          </p>

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-4 rounded-2xl border border-gray-700 text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Redo
            </button>
            <button onClick={handleUse}
              className="flex-1 py-4 rounded-2xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Use Measurements
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

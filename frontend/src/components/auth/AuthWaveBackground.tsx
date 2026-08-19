import { useEffect, useRef } from 'react'

type WavePoint = {
  x: number
  y: number
}

const clampDpr = () => Math.min(window.devicePixelRatio || 1, 2)

const projectPoint = (
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
): WavePoint => {
  const perspective = 1 / (1 + z * 0.18)
  return {
    x: width * 0.5 + x * width * 0.48 * perspective,
    y: height * 0.54 + y * height * 0.28 * perspective - z * height * 0.035,
  }
}

export default function AuthWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let animationFrame = 0
    let width = 0
    let height = 0
    let dpr = clampDpr()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = clampDpr()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const drawRibbon = (
      time: number,
      index: number,
      total: number,
      color: string,
      lineWidth: number,
    ) => {
      const z = index * 0.54
      const verticalOffset = (index - total / 2) * 0.09
      const phase = time * (0.62 + index * 0.035) + index * 0.9
      const amplitude = 0.18 + Math.sin(time * 0.35 + index) * 0.035

      context.beginPath()
      for (let step = 0; step <= 132; step++) {
        const progress = step / 132
        const x = -1.24 + progress * 2.48
        const y =
          Math.sin(x * 3.4 + phase) * amplitude +
          Math.sin(x * 7.2 - time * 0.78 + index * 0.43) * 0.045 +
          verticalOffset

        const point = projectPoint(x, y, z, width, height)
        if (step === 0) context.moveTo(point.x, point.y)
        else context.lineTo(point.x, point.y)
      }

      context.strokeStyle = color
      context.lineWidth = lineWidth
      context.stroke()
    }

    const draw = (now: number) => {
      const time = now * 0.001
      context.clearRect(0, 0, width, height)

      const background = context.createRadialGradient(
        width * 0.6,
        height * 0.42,
        0,
        width * 0.55,
        height * 0.52,
        width * 0.74,
      )
      background.addColorStop(0, 'rgba(56, 189, 248, 0.11)')
      background.addColorStop(0.45, 'rgba(34, 197, 94, 0.075)')
      background.addColorStop(1, 'rgba(5, 10, 16, 0)')
      context.fillStyle = background
      context.fillRect(0, 0, width, height)

      context.save()
      context.globalCompositeOperation = 'lighter'
      context.shadowBlur = 24

      const colors = [
        'rgba(74, 222, 128, 0.52)',
        'rgba(56, 189, 248, 0.54)',
        'rgba(129, 140, 248, 0.36)',
        'rgba(20, 184, 166, 0.38)',
      ]

      for (let index = 11; index >= 0; index--) {
        context.shadowColor = colors[index % colors.length]
        drawRibbon(time, index, 12, colors[index % colors.length], index < 4 ? 1.8 : 1.1)
      }

      context.shadowBlur = 8
      for (let index = 0; index < 5; index++) {
        context.shadowColor = 'rgba(255,255,255,0.22)'
        drawRibbon(time + 1.8, index + 1.8, 12, 'rgba(255,255,255,0.12)', 0.8)
      }
      context.restore()

      if (!prefersReducedMotion) {
        animationFrame = requestAnimationFrame(draw)
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    animationFrame = requestAnimationFrame(draw)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}

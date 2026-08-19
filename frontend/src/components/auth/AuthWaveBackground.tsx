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
  const perspective = 1 / (1 + z * 0.08)
  return {
    x: width * 0.5 + x * width * 0.56 * perspective,
    y: height * 0.62 + y * height * 0.2 * perspective - z * height * 0.018,
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
      alpha = 1,
    ) => {
      const z = index * 0.34
      const verticalOffset = (index - total / 2) * 0.035
      const phase = time * (0.22 + index * 0.012) + index * 0.72
      const amplitude = 0.2 + Math.sin(time * 0.18 + index) * 0.025

      context.globalAlpha = alpha
      context.beginPath()
      for (let step = 0; step <= 180; step++) {
        const progress = step / 180
        const x = -1.18 + progress * 2.36
        const y =
          Math.sin(x * 2.55 + phase) * amplitude +
          Math.sin(x * 5.1 - time * 0.24 + index * 0.39) * 0.048 +
          verticalOffset

        const point = projectPoint(x, y, z, width, height)
        if (step === 0) context.moveTo(point.x, point.y)
        else context.lineTo(point.x, point.y)
      }

      context.strokeStyle = color
      context.lineWidth = lineWidth
      context.stroke()
      context.globalAlpha = 1
    }

    const draw = (now: number) => {
      const time = now * 0.001
      context.clearRect(0, 0, width, height)

      const background = context.createRadialGradient(
        width * 0.5,
        height * 0.66,
        0,
        width * 0.5,
        height * 0.66,
        width * 0.62,
      )
      background.addColorStop(0, 'rgba(255, 255, 255, 0.055)')
      background.addColorStop(0.36, 'rgba(255, 255, 255, 0.025)')
      background.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = background
      context.fillRect(0, 0, width, height)

      context.save()
      context.globalCompositeOperation = 'screen'
      context.lineCap = 'round'
      context.lineJoin = 'round'

      for (let index = 13; index >= 0; index--) {
        context.shadowBlur = 34
        context.shadowColor = 'rgba(255,255,255,0.28)'
        drawRibbon(time, index, 14, 'rgba(255,255,255,0.09)', 34 - index * 1.2, 0.4)
      }

      for (let index = 10; index >= 0; index--) {
        context.shadowBlur = 22
        context.shadowColor = 'rgba(255,255,255,0.36)'
        drawRibbon(time + 0.7, index + 0.45, 11, 'rgba(255,255,255,0.16)', 13 - index * 0.55, 0.62)
      }

      for (let index = 0; index < 7; index++) {
        context.shadowBlur = 16
        context.shadowColor = 'rgba(255,255,255,0.58)'
        drawRibbon(time + 1.5, index + 1.1, 7, 'rgba(255,255,255,0.55)', index === 3 ? 1.6 : 1.05, 0.92)
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

import { useEffect, useRef } from 'react'

// A living, elegant background: drifting semantic dust and faint connecting
// nodes. devicePixelRatio aware, pauses when the tab is hidden, and respects
// prefers-reduced-motion by rendering a single static frame.
export default function AnimatedBackground({ density = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let particles = []
    let raf = 0
    let running = true

    const palette = ['rgba(200,164,91,', 'rgba(63,214,176,', 'rgba(123,92,255,', 'rgba(244,239,227,']

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.floor((width * height) / 26000 * density)
      particles = new Array(Math.max(18, Math.min(120, count))).fill(0).map(() => spawn())
    }

    function spawn() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.4 + 0.1,
        c: palette[Math.floor(Math.random() * palette.length)],
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      // faint vignette glow
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.3, 40, width * 0.5, height * 0.5, Math.max(width, height) * 0.8)
      grad.addColorStop(0, 'rgba(20,24,38,0.0)')
      grad.addColorStop(1, 'rgba(4,5,9,0.5)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (running) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -10) p.x = width + 10
          if (p.x > width + 10) p.x = -10
          if (p.y < -10) p.y = height + 10
          if (p.y > height + 10) p.y = -10
        }
        ctx.beginPath()
        ctx.fillStyle = p.c + p.a + ')'
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()

        // connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const dist = dx * dx + dy * dy
          if (dist < 12000) {
            const alpha = (1 - dist / 12000) * 0.12
            ctx.strokeStyle = 'rgba(200,164,91,' + alpha + ')'
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
      }
    }

    function loop() {
      draw()
      if (!reduce && running) raf = requestAnimationFrame(loop)
    }

    function onVisibility() {
      running = !document.hidden
      if (running && !reduce) {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(loop)
      }
    }

    resize()
    draw()
    if (!reduce) raf = requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [density])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-ink-deep" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="paper-grain absolute inset-0 opacity-60" />
    </div>
  )
}

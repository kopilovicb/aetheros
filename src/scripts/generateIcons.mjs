import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, size, size)

  // Circle arc (score ring style)
  const center = size / 2
  const radius = size * 0.35
  ctx.beginPath()
  ctx.arc(center, center, radius, -Math.PI * 0.8, Math.PI * 0.5)
  ctx.strokeStyle = '#6366f1'
  ctx.lineWidth = size * 0.08
  ctx.lineCap = 'round'
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(center, center, size * 0.06, 0, Math.PI * 2)
  ctx.fillStyle = '#6366f1'
  ctx.fill()

  return canvas.toBuffer('image/png')
}

writeFileSync('public/icon-192.png', generateIcon(192))
writeFileSync('public/icon-512.png', generateIcon(512))
console.log('Icons generated!')

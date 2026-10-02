import crypto from 'node:crypto'
import { SECRET } from './db.js'

const COOKIE_NAME = 'mc_session'
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function b64url(buf) {
  return Buffer.from(buf).toString('base64url')
}

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}

export function issueToken(accountId) {
  const payload = b64url(JSON.stringify({ uid: accountId, exp: Date.now() + TOKEN_TTL_MS }))
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!data.uid || !data.exp || data.exp < Date.now()) return null
    return data.uid
  } catch {
    return null
  }
}

function isSecureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https'
}

export function setSessionCookie(req, res, accountId) {
  const secure = isSecureRequest(req) ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${issueToken(accountId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_TTL_MS / 1000}${secure}`
  )
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

export function readSessionCookie(req) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === COOKIE_NAME) return decodeURIComponent(v.join('='))
  }
  return null
}

/* ----------------------- Simple login rate limit ----------------------- */

const attempts = new Map() // ip -> { count, resetAt }

export function loginRateLimit(req, res, next) {
  const ip = req.ip || 'unknown'
  const now = Date.now()
  let entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + 10 * 60 * 1000 }
    attempts.set(ip, entry)
  }
  if (entry.count >= 20) {
    res.status(429).json({ error: 'Too many attempts. Please wait about 10 minutes and try again.' })
    return
  }
  entry.count += 1
  if (attempts.size > 5000) attempts.clear()
  next()
}

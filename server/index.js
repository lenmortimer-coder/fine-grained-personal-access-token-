import express from 'express'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  db,
  ensureAdmin,
  seedDemoIfEnabled,
  getMenteeById,
  getMentorById,
  shapeMentee,
  shapeMentor,
  shapeMatch,
} from './db.js'
import {
  setSessionCookie,
  clearSessionCookie,
  readSessionCookie,
  verifyToken,
  loginRateLimit,
} from './auth.js'
import { notify } from './mailer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

/* ----------------------------- args & env ----------------------------- */

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : undefined
}
const args = {
  port: Number(argValue('--port') || process.env.PORT || 3000),
  host: argValue('--host') || process.env.HOST || '0.0.0.0',
  mode: process.env.MC_MODE || (process.argv.includes('--prod') ? 'prod' : 'dev'),
}
const IS_PROD = args.mode === 'prod'

/* ------------------------------- helpers ------------------------------ */

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '200kb' }))

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  next()
})

function getAccount(req) {
  const token = readSessionCookie(req)
  const uid = verifyToken(token)
  if (!uid) return null
  return db.prepare('SELECT id, name, email, phone, is_admin AS isAdmin, created_at AS createdAt FROM accounts WHERE id = ?').get(uid) || null
}

function requireAuth(req, res, next) {
  const account = getAccount(req)
  if (!account) return res.status(401).json({ error: 'Please sign in.' })
  req.account = account
  next()
}

function requireAdmin(req, res, next) {
  const account = getAccount(req)
  if (!account) return res.status(401).json({ error: 'Please sign in.' })
  if (!account.isAdmin) return res.status(403).json({ error: 'Owner access only.' })
  req.account = account
  next()
}

function str(v, max = 2000) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function getMyApplications(accountId) {
  const menteeRow = db
    .prepare(
      `SELECT m.id, m.account_id AS accountId, acc.name, acc.email, acc.phone, m.agency, m.job_title AS jobTitle,
              m.years_of_service AS yearsOfService, m.bio, m.need_areas AS needAreas, m.need_statement AS needStatement,
              m.goals, m.hours_per_month AS hoursPerMonth, m.status, m.created_at AS createdAt, m.reviewed_at AS reviewedAt
       FROM mentee_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.account_id = ?`
    )
    .get(accountId)
  const mentorRow = db
    .prepare(
      `SELECT m.id, m.account_id AS accountId, acc.name, acc.email, acc.phone, m.agency, m.job_title AS jobTitle,
              m.years_of_service AS yearsOfService, m.bio, m.expertise, m.experience, m.motivation, m.capacity,
              m.status, m.created_at AS createdAt, m.reviewed_at AS reviewedAt
       FROM mentor_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.account_id = ?`
    )
    .get(accountId)
  return { mentee: shapeMentee(menteeRow), mentor: shapeMentor(mentorRow) }
}

function getMatchesFor(where, params) {
  return db
    .prepare(
      `SELECT mt.id, mt.mentor_app_id AS mentorId, mt.mentee_app_id AS menteeId, mt.note, mt.status,
              mt.created_at AS createdAt, mt.reviewed_at AS reviewedAt
       FROM matches mt ${where}`
    )
    .all(...params)
    .map(shapeMatch)
}

function withPeople(match) {
  return { ...match, mentor: getMentorById(match.mentorId), mentee: getMenteeById(match.menteeId) }
}

/* -------------------------------- auth -------------------------------- */

app.post('/api/auth/signup', (req, res) => {
  const name = str(req.body.name, 120)
  const email = str(req.body.email, 200).toLowerCase()
  const phone = str(req.body.phone, 40)
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  if (!name || !email.includes('@') || password.length < 8) {
    return res.status(400).json({ error: 'Name, a valid email and a password of at least 8 characters are required.' })
  }
  const exists = db.prepare('SELECT id FROM accounts WHERE email = ?').get(email)
  if (exists) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' })

  const { lastInsertRowid } = db
    .prepare('INSERT INTO accounts (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
    .run(name, email, phone, bcrypt.hashSync(password, 10))
  setSessionCookie(req, res, lastInsertRowid)
  res.status(201).json({ ok: true })
})

app.post('/api/auth/login', loginRateLimit, (req, res) => {
  const email = str(req.body.email, 200).toLowerCase()
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const account = db.prepare('SELECT id, password_hash FROM accounts WHERE email = ?').get(email)
  if (!account || !bcrypt.compareSync(password, account.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }
  setSessionCookie(req, res, account.id)
  res.json({ ok: true })
})

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

app.get('/api/auth/me', (req, res) => {
  const account = getAccount(req)
  if (!account) return res.json({ account: null })
  const { mentee, mentor } = getMyApplications(account.id)
  const matches = getMatchesFor(
    `WHERE mt.mentor_app_id = ? OR mt.mentee_app_id = ?`,
    [mentee?.id ?? -1, mentor?.id ?? -1]
  )
    .filter((m) => m.mentorId === mentor?.id || m.menteeId === mentee?.id)
    .map(withPeople)
  res.json({ account, mentee, mentor, matches })
})

/* --------------------------- public stats ------------------------------ */

app.get('/api/stats', (req, res) => {
  const approvedMentors = db.prepare("SELECT COUNT(*) c FROM mentor_applications WHERE status='approved'").get().c
  const approvedMentees = db.prepare("SELECT COUNT(*) c FROM mentee_applications WHERE status='approved'").get().c
  const approvedMatches = db.prepare("SELECT COUNT(*) c FROM matches WHERE status='approved'").get().c
  res.json({ approvedMentors, approvedMentees, approvedMatches })
})

/* ---------------------------- applications ----------------------------- */

app.put('/api/applications/mentee', requireAuth, (req, res) => {
  const b = req.body
  const agency = str(b.agency, 200)
  const jobTitle = str(b.jobTitle, 200)
  const yearsOfService = Number(b.yearsOfService)
  const bio = str(b.bio, 1000)
  const needAreas = Array.isArray(b.needAreas) ? b.needAreas.map((x) => str(x, 100)).filter(Boolean).slice(0, 12) : []
  const needStatement = str(b.needStatement, 4000)
  const goals = str(b.goals, 2000)
  const hoursPerMonth = str(b.hoursPerMonth, 40)

  if (!agency || !jobTitle || Number.isNaN(yearsOfService) || needAreas.length === 0 || !needStatement || !goals || !hoursPerMonth) {
    return res.status(400).json({ error: 'Please complete all required fields, including at least one area of need.' })
  }

  const existing = db.prepare('SELECT id, status FROM mentee_applications WHERE account_id = ?').get(req.account.id)
  if (existing && existing.status === 'approved') {
    return res.status(409).json({ error: 'Your mentee application is already approved.' })
  }
  if (existing) {
    db.prepare(
      `UPDATE mentee_applications SET agency=@agency, job_title=@jobTitle, years_of_service=@yearsOfService, bio=@bio,
       need_areas=@needAreas, need_statement=@needStatement, goals=@goals, hours_per_month=@hoursPerMonth,
       status='pending', reviewed_at=NULL WHERE account_id=@accountId`
    ).run({
      agency, jobTitle, yearsOfService, bio,
      needAreas: JSON.stringify(needAreas), needStatement, goals, hoursPerMonth,
      accountId: req.account.id,
    })
  } else {
    db.prepare(
      `INSERT INTO mentee_applications (account_id, agency, job_title, years_of_service, bio, need_areas, need_statement, goals, hours_per_month)
       VALUES (@accountId, @agency, @jobTitle, @yearsOfService, @bio, @needAreas, @needStatement, @goals, @hoursPerMonth)`
    ).run({
      accountId: req.account.id, agency, jobTitle, yearsOfService, bio,
      needAreas: JSON.stringify(needAreas), needStatement, goals, hoursPerMonth,
    })
  }
  notify.applicationSubmitted('mentee', req.account.name, req.account.email)
  res.status(existing ? 200 : 201).json({ ok: true })
})

app.put('/api/applications/mentor', requireAuth, (req, res) => {
  const b = req.body
  const agency = str(b.agency, 200)
  const jobTitle = str(b.jobTitle, 200)
  const yearsOfService = Number(b.yearsOfService)
  const bio = str(b.bio, 1000)
  const expertise = Array.isArray(b.expertise) ? b.expertise.map((x) => str(x, 100)).filter(Boolean).slice(0, 12) : []
  const experience = str(b.experience, 4000)
  const motivation = str(b.motivation, 2000)
  const capacity = Math.min(10, Math.max(1, Number(b.capacity) || 1))

  if (!agency || !jobTitle || Number.isNaN(yearsOfService) || expertise.length === 0 || !experience || !motivation) {
    return res.status(400).json({ error: 'Please complete all required fields, including at least one area of expertise.' })
  }

  const existing = db.prepare('SELECT id, status FROM mentor_applications WHERE account_id = ?').get(req.account.id)
  if (existing && existing.status === 'approved') {
    return res.status(409).json({ error: 'Your mentor application is already approved.' })
  }
  if (existing) {
    db.prepare(
      `UPDATE mentor_applications SET agency=@agency, job_title=@jobTitle, years_of_service=@yearsOfService, bio=@bio,
       expertise=@expertise, experience=@experience, motivation=@motivation, capacity=@capacity,
       status='pending', reviewed_at=NULL WHERE account_id=@accountId`
    ).run({
      agency, jobTitle, yearsOfService, bio,
      expertise: JSON.stringify(expertise), experience, motivation, capacity,
      accountId: req.account.id,
    })
  } else {
    db.prepare(
      `INSERT INTO mentor_applications (account_id, agency, job_title, years_of_service, bio, expertise, experience, motivation, capacity)
       VALUES (@accountId, @agency, @jobTitle, @yearsOfService, @bio, @expertise, @experience, @motivation, @capacity)`
    ).run({
      accountId: req.account.id, agency, jobTitle, yearsOfService, bio,
      expertise: JSON.stringify(expertise), experience, motivation, capacity,
    })
  }
  notify.applicationSubmitted('mentor', req.account.name, req.account.email)
  res.status(existing ? 200 : 201).json({ ok: true })
})

/* --------------------- mentee directory (mentors) ---------------------- */

app.get('/api/directory/mentees', requireAuth, (req, res) => {
  const mentor = db.prepare('SELECT id, capacity, status FROM mentor_applications WHERE account_id = ?').get(req.account.id)
  if (!mentor || mentor.status !== 'approved') {
    return res.status(403).json({ error: 'Only approved mentors can browse the mentee directory.' })
  }
  const q = str(req.query.q, 200).toLowerCase()
  const area = str(req.query.area, 100)

  let rows = db
    .prepare(
      `SELECT m.id, m.account_id AS accountId, acc.name, acc.email, acc.phone, m.agency, m.job_title AS jobTitle,
              m.years_of_service AS yearsOfService, m.bio, m.need_areas AS needAreas, m.need_statement AS needStatement,
              m.goals, m.hours_per_month AS hoursPerMonth, m.status, m.created_at AS createdAt, m.reviewed_at AS reviewedAt
       FROM mentee_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.status = 'approved'`
    )
    .all()

  let mentees = rows.map(shapeMentee)
  if (area) mentees = mentees.filter((m) => m.needAreas.includes(area))
  if (q) {
    mentees = mentees.filter((m) =>
      `${m.name} ${m.agency} ${m.jobTitle} ${m.needStatement}`.toLowerCase().includes(q)
    )
  }

  const myMatches = getMatchesFor('WHERE mt.mentor_app_id = ?', [mentor.id])
  res.json({ mentees, myMatches })
})

app.post('/api/matches', requireAuth, (req, res) => {
  const mentor = db.prepare('SELECT id, capacity, status FROM mentor_applications WHERE account_id = ?').get(req.account.id)
  if (!mentor || mentor.status !== 'approved') {
    return res.status(403).json({ error: 'Only approved mentors can propose matches.' })
  }
  const menteeId = Number(req.body.menteeId)
  const note = str(req.body.note, 3000)
  const mentee = db.prepare('SELECT id, status, account_id FROM mentee_applications WHERE id = ?').get(menteeId)
  if (!mentee || mentee.status !== 'approved') return res.status(404).json({ error: 'Mentee not found.' })
  if (!note || note.length < 10) return res.status(400).json({ error: 'Please write a short matching note (at least 10 characters).' })

  const active = db
    .prepare("SELECT COUNT(*) c FROM matches WHERE mentor_app_id = ? AND status = 'approved'")
    .get(mentor.id).c
  if (active >= mentor.capacity) {
    return res.status(409).json({ error: 'You have reached your mentee capacity. Ask the programme owner to increase it.' })
  }
  const duplicate = db
    .prepare("SELECT id FROM matches WHERE mentor_app_id = ? AND mentee_app_id = ? AND status = 'pending'")
    .get(mentor.id, menteeId)
  if (duplicate) return res.status(409).json({ error: 'You already have a pending proposal with this mentee.' })

  db.prepare('INSERT INTO matches (mentor_app_id, mentee_app_id, note) VALUES (?, ?, ?)').run(mentor.id, menteeId, note)
  const menteeAccount = db.prepare('SELECT name, email FROM accounts WHERE id = ?').get(mentee.account_id)
  notify.matchProposed(req.account.name, menteeAccount.name, menteeAccount.email)
  res.status(201).json({ ok: true })
})

/* ------------------------------ admin --------------------------------- */

app.get('/api/admin/overview', requireAdmin, (req, res) => {
  const mentees = db
    .prepare(
      `SELECT m.id, m.account_id AS accountId, acc.name, acc.email, acc.phone, m.agency, m.job_title AS jobTitle,
              m.years_of_service AS yearsOfService, m.bio, m.need_areas AS needAreas, m.need_statement AS needStatement,
              m.goals, m.hours_per_month AS hoursPerMonth, m.status, m.created_at AS createdAt, m.reviewed_at AS reviewedAt
       FROM mentee_applications m JOIN accounts acc ON acc.id = m.account_id ORDER BY m.status = 'pending' DESC, m.created_at DESC`
    )
    .all()
    .map(shapeMentee)
  const mentors = db
    .prepare(
      `SELECT m.id, m.account_id AS accountId, acc.name, acc.email, acc.phone, m.agency, m.job_title AS jobTitle,
              m.years_of_service AS yearsOfService, m.bio, m.expertise, m.experience, m.motivation, m.capacity,
              m.status, m.created_at AS createdAt, m.reviewed_at AS reviewedAt
       FROM mentor_applications m JOIN accounts acc ON acc.id = m.account_id ORDER BY m.status = 'pending' DESC, m.created_at DESC`
    )
    .all()
    .map(shapeMentor)
  const matches = db
    .prepare(
      `SELECT mt.id, mt.mentor_app_id AS mentorId, mt.mentee_app_id AS menteeId, mt.note, mt.status,
              mt.created_at AS createdAt, mt.reviewed_at AS reviewedAt
       FROM matches mt ORDER BY mt.status = 'pending' DESC, mt.created_at DESC`
    )
    .all()
    .map(shapeMatch)
    .map(withPeople)

  res.json({
    mentees,
    mentors,
    matches,
    stats: {
      pendingMentees: mentees.filter((m) => m.status === 'pending').length,
      pendingMentors: mentors.filter((m) => m.status === 'pending').length,
      pendingMatches: matches.filter((m) => m.status === 'pending').length,
      approvedMatches: matches.filter((m) => m.status === 'approved').length,
    },
  })
})

app.post('/api/admin/applications/:kind/:id/:action', requireAdmin, (req, res) => {
  const { kind, id, action } = req.params
  const table = kind === 'mentee' ? 'mentee_applications' : kind === 'mentor' ? 'mentor_applications' : null
  if (!table || !['approve', 'reject'].includes(action)) return res.status(404).json({ error: 'Unknown request.' })

  const row = db.prepare(`SELECT id, account_id, status FROM ${table} WHERE id = ?`).get(Number(id))
  if (!row) return res.status(404).json({ error: 'Application not found.' })
  if (row.status !== 'pending') return res.status(409).json({ error: 'This application has already been reviewed.' })

  const status = action === 'approve' ? 'approved' : 'rejected'
  db.prepare(`UPDATE ${table} SET status = ?, reviewed_at = datetime('now') WHERE id = ?`).run(status, row.id)
  const account = db.prepare('SELECT name, email FROM accounts WHERE id = ?').get(row.account_id)
  notify.applicationReviewed(kind, account.name, account.email, action === 'approve')
  res.json({ ok: true })
})

app.post('/api/admin/matches/:id/:action', requireAdmin, (req, res) => {
  const { id, action } = req.params
  if (!['approve', 'reject'].includes(action)) return res.status(404).json({ error: 'Unknown request.' })

  const match = db
    .prepare('SELECT id, mentor_app_id, mentee_app_id, status FROM matches WHERE id = ?')
    .get(Number(id))
  if (!match) return res.status(404).json({ error: 'Match not found.' })
  if (match.status !== 'pending') return res.status(409).json({ error: 'This match has already been reviewed.' })

  const status = action === 'approve' ? 'approved' : 'rejected'
  db.prepare("UPDATE matches SET status = ?, reviewed_at = datetime('now') WHERE id = ?").run(status, match.id)
  const mentor = db
    .prepare('SELECT acc.name, acc.email FROM mentor_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.id = ?')
    .get(match.mentor_app_id)
  const mentee = db
    .prepare('SELECT acc.name, acc.email, acc.phone FROM mentee_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.id = ?')
    .get(match.mentee_app_id)
  if (action === 'approve') {
    notify.matchReviewed(mentor.name, mentor.email, mentee.name, true, '')
    notify.matchApprovedForMentee(mentee.name, mentee.email, mentor.name, mentor.email, mentee.phone)
  } else {
    notify.matchReviewed(mentor.name, mentor.email, mentee.name, false, '')
    notify.matchDeclinedForMentee(mentee.name, mentee.email)
  }
  res.json({ ok: true })
})

/* ------------------------- static / vite ------------------------------ */

async function start() {
  const admin = ensureAdmin()
  const seeded = seedDemoIfEnabled()

  if (IS_PROD) {
    const dist = path.join(ROOT, 'dist')
    if (!fs.existsSync(dist)) {
      console.error('dist/ not found. Run `npm run build` first (or use `npm run dev`).')
      process.exit(1)
    }
    app.use(express.static(dist, { maxAge: '1h', index: false }))
    app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')))
  } else {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      root: ROOT,
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(args.port, args.host, () => {
    console.log(`\nMentorCircle ${IS_PROD ? 'production' : 'dev'} server running:`)
    console.log(`  → http://localhost:${args.port}`)
    console.log(`  → http://${args.host}:${args.port} (network)`)
    console.log(`  → database: ${path.join(ROOT, 'server', 'data', 'mentorcircle.db')}`)
    console.log(`\nOwner (admin) sign in: ${admin.email}` + (admin.generated ? `  password: ${admin.password}` : '  (password from ADMIN_PASSWORD env)'))
    if (admin.generated) {
      console.log('Save this password now — it will not be shown again. Set ADMIN_EMAIL/ADMIN_PASSWORD env vars to control it.')
    }
    if (seeded) {
      console.log('\nDemo data seeded (DEMO_SEED=1). Demo logins: ama@demo.gov / kofi@demo.gov / ebo@demo.gov / akosua@demo.gov — password demo1234')
    }
    if (!process.env.SMTP_URL) {
      console.log('\nNote: email notifications are logged to the console. Set SMTP_URL to send real emails.')
    }
    console.log('')
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})

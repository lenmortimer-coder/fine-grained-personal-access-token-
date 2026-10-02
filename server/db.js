import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.MC_DATA_DIR || path.join(__dirname, 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

export const DB_PATH = path.join(DATA_DIR, 'mentorcircle.db')
export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

db.exec(`
CREATE TABLE IF NOT EXISTS accounts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mentee_applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id      INTEGER NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  agency          TEXT NOT NULL,
  job_title       TEXT NOT NULL,
  years_of_service INTEGER NOT NULL,
  bio             TEXT DEFAULT '',
  need_areas      TEXT NOT NULL DEFAULT '[]',
  need_statement  TEXT NOT NULL,
  goals           TEXT NOT NULL,
  hours_per_month TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at     TEXT
);

CREATE TABLE IF NOT EXISTS mentor_applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id      INTEGER NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  agency          TEXT NOT NULL,
  job_title       TEXT NOT NULL,
  years_of_service INTEGER NOT NULL,
  bio             TEXT DEFAULT '',
  expertise       TEXT NOT NULL DEFAULT '[]',
  experience      TEXT NOT NULL,
  motivation      TEXT NOT NULL,
  capacity        INTEGER NOT NULL DEFAULT 2,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at     TEXT
);

CREATE TABLE IF NOT EXISTS matches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_app_id INTEGER NOT NULL REFERENCES mentor_applications(id) ON DELETE CASCADE,
  mentee_app_id INTEGER NOT NULL REFERENCES mentee_applications(id) ON DELETE CASCADE,
  note          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at   TEXT,
  UNIQUE (mentor_app_id, mentee_app_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_mentor ON matches(mentor_app_id);
CREATE INDEX IF NOT EXISTS idx_matches_mentee ON matches(mentee_app_id);
`)

/* ------------------------------------------------------------------ */
/* Secret (session signing key)                                        */
/* ------------------------------------------------------------------ */

const SECRET_PATH = path.join(DATA_DIR, 'secret.key')
function loadSecret() {
  if (process.env.MC_SECRET) return process.env.MC_SECRET
  if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf8').trim()
  const secret = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(SECRET_PATH, secret, { mode: 0o600 })
  return secret
}
export const SECRET = loadSecret()

/* ------------------------------------------------------------------ */
/* Row shaping                                                         */
/* ------------------------------------------------------------------ */

const APP_SELECT = `
  m.id, m.account_id AS accountId, acc.name, acc.email, acc.phone,
  m.agency, m.job_title AS jobTitle, m.years_of_service AS yearsOfService,
  m.bio, m.status, m.created_at AS createdAt, m.reviewed_at AS reviewedAt`

export function getMenteeById(id) {
  const row = db
    .prepare(
      `SELECT ${APP_SELECT}, m.need_areas AS needAreas, m.need_statement AS needStatement,
              m.goals, m.hours_per_month AS hoursPerMonth
       FROM mentee_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.id = ?`
    )
    .get(id)
  return shapeMentee(row)
}

export function getMentorById(id) {
  const row = db
    .prepare(
      `SELECT ${APP_SELECT}, m.expertise, m.experience, m.motivation, m.capacity
       FROM mentor_applications m JOIN accounts acc ON acc.id = m.account_id WHERE m.id = ?`
    )
    .get(id)
  return shapeMentor(row)
}

export function shapeMentee(row) {
  if (!row) return null
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    agency: row.agency,
    jobTitle: row.jobTitle,
    yearsOfService: row.yearsOfService,
    bio: row.bio,
    needAreas: JSON.parse(row.needAreas || '[]'),
    needStatement: row.needStatement,
    goals: row.goals,
    hoursPerMonth: row.hoursPerMonth,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  }
}

export function shapeMentor(row) {
  if (!row) return null
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    agency: row.agency,
    jobTitle: row.jobTitle,
    yearsOfService: row.yearsOfService,
    bio: row.bio,
    expertise: JSON.parse(row.expertise || '[]'),
    experience: row.experience,
    motivation: row.motivation,
    capacity: row.capacity,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  }
}

export function shapeMatch(row) {
  if (!row) return null
  return {
    id: row.id,
    mentorId: row.mentorId,
    menteeId: row.menteeId,
    note: row.note,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  }
}

/* ------------------------------------------------------------------ */
/* Admin account bootstrap                                             */
/* ------------------------------------------------------------------ */

export function ensureAdmin() {
  const existing = db.prepare('SELECT email FROM accounts WHERE is_admin = 1 LIMIT 1').get()
  if (existing) return { email: existing.email, generated: false }

  const email = (process.env.ADMIN_EMAIL || 'owner@mentorcircle.local').trim().toLowerCase()
  let password = process.env.ADMIN_PASSWORD
  let generated = false
  if (!password) {
    password = crypto.randomBytes(9).toString('base64url')
    generated = true
  }
  db.prepare('INSERT INTO accounts (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)').run(
    'Programme Owner',
    email,
    bcrypt.hashSync(password, 10)
  )
  return { email, password, generated }
}

/* ------------------------------------------------------------------ */
/* Optional demo seed (DEMO_SEED=1)                                    */
/* ------------------------------------------------------------------ */

export function seedDemoIfEnabled() {
  if (process.env.DEMO_SEED !== '1') return false
  const count = db.prepare('SELECT COUNT(*) AS c FROM accounts').get().c
  if (count > 1) return false // already seeded

  const insertAccount = db.prepare(
    'INSERT INTO accounts (name, email, phone, password_hash) VALUES (?, ?, ?, ?)'
  )
  const demoPassword = bcrypt.hashSync('demo1234', 10)

  const demo = [
    {
      name: 'Ama Serwaa', email: 'ama@demo.gov', phone: '+233 24 111 2233', agency: 'Ministry of Finance',
      jobTitle: 'Assistant Budget Analyst', years: 3,
      needAreas: ['Public Financial Management', 'Policy Development & Analysis'],
      needStatement: 'I prepare budget inputs but have never been coached on macro-fiscal analysis or how to defend budget lines during hearings. I need a mentor who can walk me through the full budget cycle and review my work.',
      goals: 'Lead a ministry budget review meeting independently within 18 months.', hours: '3–4 hours',
    },
    {
      name: 'Kofi Mensah', email: 'kofi@demo.gov', phone: '+233 20 555 0198', agency: 'Department of Health Services',
      jobTitle: 'Regional HR Officer', years: 6,
      needAreas: ['Human Resources & Organisational Development', 'Change Management'],
      needStatement: 'Our region is rolling out a new performance management system and staff resistance is high. I need guidance from someone who has managed similar change in the public service.',
      goals: 'Design a change-communication plan and halve appraisal-related grievances.', hours: '2–3 hours',
    },
    {
      name: 'Fatima Alhassan', email: 'fatima@demo.gov', phone: '+233 27 900 4412', agency: 'Digital Transformation Agency',
      jobTitle: 'ICT Project Coordinator', years: 4,
      needAreas: ['Digital Government / IT', 'Project Management'],
      needStatement: 'My projects keep slipping on vendor deliverables. I need a mentor experienced in public-sector IT project governance to help me structure contracts, milestones and escalation paths.',
      goals: 'Deliver the current interoperability phase on schedule.', hours: '4+ hours',
    },
    {
      name: 'Grace Eshun', email: 'grace@demo.gov', phone: '+233 23 440 5566', agency: 'Ministry of Education',
      jobTitle: 'Monitoring & Evaluation Officer', years: 5,
      needAreas: ['Monitoring & Evaluation', 'Communication & Stakeholder Engagement'],
      needStatement: 'I collect good data but struggle to turn it into decision-ready reports for senior management. I need a mentor to coach me on evidence communication and indicator design.',
      goals: 'Produce a quarterly evidence brief cited in management decisions.', hours: '3–4 hours',
      status: 'approved',
    },
  ]

  const insertMentee = db.prepare(`
    INSERT INTO mentee_applications (account_id, agency, job_title, years_of_service, bio, need_areas, need_statement, goals, hours_per_month, status, reviewed_at)
    VALUES (@accountId, @agency, @jobTitle, @years, '', @needAreas, @needStatement, @goals, @hours, @status, CASE WHEN @status != 'pending' THEN datetime('now') ELSE NULL END)`)

  for (const d of demo) {
    const { lastInsertRowid } = insertAccount.run(d.name, d.email, d.phone, demoPassword)
    insertMentee.run({
      accountId: lastInsertRowid, agency: d.agency, jobTitle: d.jobTitle, years: d.years,
      needAreas: JSON.stringify(d.needAreas), needStatement: d.needStatement, goals: d.goals,
      hours: d.hours, status: d.status || 'pending',
    })
  }

  const mentors = [
    {
      name: 'Dr. Ebo Ansah', email: 'ebo@demo.gov', phone: '+233 24 800 1122', agency: 'Treasury & Debt Management Office',
      jobTitle: 'Director, Fiscal Policy', years: 19,
      expertise: ['Public Financial Management', 'Policy Development & Analysis'],
      experience: '19 years in public financial management; led the MTEF reform; served as technical lead on two IMF programme reviews.',
      motivation: 'I benefited enormously from informal mentoring early in my career and want to pay it forward.',
      capacity: 3, status: 'approved',
    },
    {
      name: 'Akosua Frimpong', email: 'akosua@demo.gov', phone: '+233 20 733 4455', agency: 'Public Service Commission',
      jobTitle: 'Deputy Director, HR Strategy', years: 15,
      expertise: ['Human Resources & Organisational Development', 'Change Management', 'Leadership & Management'],
      experience: '15 years designing and rolling out performance systems across the civil service.',
      motivation: 'Change programmes fail more on people than on design. I mentor officers who carry reforms on the ground.',
      capacity: 2, status: 'approved',
    },
    {
      name: 'Idris Bello', email: 'idris@demo.gov', phone: '+233 27 610 9900', agency: 'Office of the Head of Civil Service (Digital)',
      jobTitle: 'Chief Digital Officer', years: 12,
      expertise: ['Digital Government / IT', 'Project Management', 'Procurement & Contract Management'],
      experience: '12 years delivering large public digital programmes, including the national service portal serving 2M+ citizens.',
      motivation: 'Strong project discipline is the rarest skill in public IT. I want to help coordinators learn it early.',
      capacity: 2, status: 'pending',
    },
  ]

  const insertMentor = db.prepare(`
    INSERT INTO mentor_applications (account_id, agency, job_title, years_of_service, bio, expertise, experience, motivation, capacity, status, reviewed_at)
    VALUES (@accountId, @agency, @jobTitle, @years, '', @expertise, @experience, @motivation, @capacity, @status, CASE WHEN @status != 'pending' THEN datetime('now') ELSE NULL END)`)

  for (const m of mentors) {
    const { lastInsertRowid } = insertAccount.run(m.name, m.email, m.phone, demoPassword)
    insertMentor.run({
      accountId: lastInsertRowid, agency: m.agency, jobTitle: m.jobTitle, years: m.years,
      expertise: JSON.stringify(m.expertise), experience: m.experience, motivation: m.motivation,
      capacity: m.capacity, status: m.status,
    })
  }

  // One pending match: Ebo (approved) proposes for Grace (approved)
  const ebo = db.prepare("SELECT id FROM mentor_applications WHERE status='approved' LIMIT 1").get()
  const grace = db.prepare("SELECT id FROM mentee_applications WHERE status='approved' LIMIT 1").get()
  if (ebo && grace) {
    db.prepare(
      'INSERT OR IGNORE INTO matches (mentor_app_id, mentee_app_id, note, status) VALUES (?, ?, ?, ?)'
    ).run(
      ebo.id, grace.id,
      'Grace wants to sharpen evidence briefs for management. My budget review cycles generate exactly the kind of decision documents she needs to study — happy to coach her.',
      'pending'
    )
  }
  return true
}

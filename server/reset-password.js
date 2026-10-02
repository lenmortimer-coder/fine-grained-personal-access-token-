/**
 * Reset an account password.
 *
 *   node server/reset-password.js <email> <new-password>
 *
 * Useful during a pilot when someone forgets their password, or to change
 * the owner (admin) password after first start.
 */
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const [email, password] = process.argv.slice(2)

if (!email || !password || password.length < 8) {
  console.error('Usage: node server/reset-password.js <email> <new-password (min 8 chars)>')
  process.exit(1)
}

const account = db.prepare('SELECT id FROM accounts WHERE email = ?').get(email.trim().toLowerCase())
if (!account) {
  console.error(`No account found for ${email}`)
  process.exit(1)
}

db.prepare('UPDATE accounts SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), account.id)
console.log(`Password updated for ${email.trim().toLowerCase()}`)

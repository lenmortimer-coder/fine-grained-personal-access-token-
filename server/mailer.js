import nodemailer from 'nodemailer'

/**
 * Email notifications.
 *
 * If SMTP_URL is set (e.g. smtp://user:pass@smtp.example.com:587) real emails are sent.
 * Otherwise messages are logged to the server console so a pilot can run with zero config.
 *
 * Optional env vars:
 *   SMTP_FROM   — sender address (default: MentorCircle <no-reply@mentorcircle.local>)
 *   MC_BASE_URL — public base URL used in links (default: http://localhost:PORT)
 */

let transporter = null
if (process.env.SMTP_URL) {
  transporter = nodemailer.createTransport(process.env.SMTP_URL)
  console.log(`[mail] SMTP configured — notifications will be emailed.`)
} else {
  console.log(`[mail] SMTP_URL not set — notifications will be logged to the console.`)
}

export function baseUrl() {
  return (process.env.MC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '')
}

export async function sendMail(to, subject, text) {
  const from = process.env.SMTP_FROM || 'MentorCircle <no-reply@mentorcircle.local>'
  if (!transporter) {
    console.log(`\n[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`)
    return
  }
  try {
    await transporter.sendMail({ from, to, subject, text })
  } catch (err) {
    console.error(`[mail] failed to send to ${to}:`, err.message)
  }
}

export const notify = {
  applicationSubmitted(kind, name, email) {
    sendMail(
      email,
      `Your ${kind} application was received`,
      `Hello ${name},\n\nYour ${kind} application on MentorCircle has been received and is pending review by the programme owner. You will be notified once a decision is made.\n\n${baseUrl()}`
    )
  },
  applicationReviewed(kind, name, email, approved) {
    sendMail(
      email,
      approved ? `Your ${kind} application was approved` : `Update on your ${kind} application`,
      approved
        ? `Hello ${name},\n\nGreat news — your ${kind} application on MentorCircle has been approved by the programme owner. Sign in to continue: ${baseUrl()}/signin`
        : `Hello ${name},\n\nThank you for applying to MentorCircle. After review, the programme owner was unable to approve your ${kind} application at this time. You are welcome to reach out for feedback and apply again.`
    )
  },
  matchProposed(mentorName, menteeName, menteeEmail) {
    sendMail(
      menteeEmail,
      `A mentor has proposed a match with you`,
      `Hello ${menteeName},\n\n${mentorName} has proposed a mentorship match with you on MentorCircle. The programme owner will review the proposal, and you will be notified once it is approved.\n\n${baseUrl()}`
    )
  },
  matchReviewed(mentorName, mentorEmail, menteeName, approved, note) {
    sendMail(
      mentorEmail,
      approved ? `Your match with ${menteeName} was approved` : `Your match proposal was declined`,
      approved
        ? `Hello ${mentorName},\n\nThe programme owner approved your mentorship match with ${menteeName}. You can find their contact details when you sign in: ${baseUrl()}/signin\n\nFirst suggested step: reach out within a week to schedule an introductory session.`
        : `Hello ${mentorName},\n\nThe programme owner declined your match proposal with ${menteeName}. You are welcome to propose another match.\n\n${baseUrl()}`
    )
  },
  matchApprovedForMentee(menteeName, menteeEmail, mentorName, mentorEmail, mentorPhone) {
    sendMail(
      menteeEmail,
      `You are now matched with ${mentorName}`,
      `Hello ${menteeName},\n\nYour mentorship match with ${mentorName} has been approved.\n\nEmail: ${mentorEmail}\nPhone: ${mentorPhone || 'not provided'}\n\n${baseUrl()}`
    )
  },
  matchDeclinedForMentee(menteeName, menteeEmail) {
    sendMail(
      menteeEmail,
      `Update on your mentor match`,
      `Hello ${menteeName},\n\nA mentor match involving you was reviewed by the programme owner and was not approved this time. Other mentors can still propose a match with you.`
    )
  },
}

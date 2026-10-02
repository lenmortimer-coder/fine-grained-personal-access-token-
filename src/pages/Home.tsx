import { useEffect } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/lib/StoreContext'

const steps = [
  {
    icon: UserPlus,
    title: '1 · Apply',
    text: 'Public servants apply as a mentee (describing the mentorship they need) or as a mentor (sharing their expertise). Everyone is vetted before joining.',
  },
  {
    icon: ShieldCheck,
    title: '2 · Get approved',
    text: 'The programme owner reviews every application. Only approved mentors and mentees enter the circle — quality over quantity.',
  },
  {
    icon: Search,
    title: '3 · Mentors scan & match',
    text: 'Approved mentors browse mentee profiles — name, agency, role and stated needs — and propose a match they believe they can serve well.',
  },
  {
    icon: Handshake,
    title: '4 · Match approved',
    text: 'Every proposed match goes back to the programme owner for final approval. Once approved, the mentoring relationship begins.',
  },
]

const values = [
  {
    icon: HeartHandshake,
    title: 'Completely free',
    text: 'No fees, no tiers, no premium plans. Mentorship is a public good and stays free for every participant.',
  },
  {
    icon: Landmark,
    title: 'Public sector focus',
    text: 'Built specifically for government agencies, ministries, departments and assemblies — and the people who serve in them.',
  },
  {
    icon: BadgeCheck,
    title: 'Owner-approved quality',
    text: 'Nothing happens without the programme owner’s sign-off: not membership, not matches. Trust is the product.',
  },
]

export default function Home() {
  const { stats, loadStats } = useApp()

  useEffect(() => {
    loadStats().catch(() => {})
  }, [loadStats])

  const approvedMentors = stats?.approvedMentors ?? 0
  const approvedMentees = stats?.approvedMentees ?? 0
  const approvedMatches = stats?.approvedMatches ?? 0

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" /> Free · Public sector only · Admin approved
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Better mentors.
            <br />
            Better public servants.
            <br />
            <span className="text-primary">Better public service.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            MentorCircle connects experienced public sector leaders with colleagues who need
            guidance — at no cost. Mentees register their needs, vetted mentors find the colleagues
            they can best support, and the programme owner approves every step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/apply/mentee">
                I need a mentor <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/apply/mentor">
                <GraduationCap className="mr-2 h-4 w-4" /> I want to mentor
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { label: 'Approved mentors', value: approvedMentors },
              { label: 'Approved mentees', value: approvedMentees },
              { label: 'Active matches', value: approvedMatches },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4">
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-2 text-muted-foreground">
            A simple, supervised cycle from application to first mentoring session.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.title} className="border-2">
              <CardContent className="pt-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Why MentorCircle</h2>
            <p className="mt-2 text-muted-foreground">
              Designed for one purpose: raising the quality of public sector employees.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <v.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual role callout */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-6 pt-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 h-8 w-8 shrink-0 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Already registered? You can do both.</h3>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Any approved mentee can also apply to become a mentor in their own area of strength —
                  every additional application simply goes through the same owner approval, and you can
                  hold both roles at once.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/signin">Check my application status</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

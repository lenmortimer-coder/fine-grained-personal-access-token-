import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { NEED_AREAS } from '@/types'
import { useApp } from '@/lib/StoreContext'

const HOURS = ['1–2 hours', '2–3 hours', '3–4 hours', '4+ hours']

export function NeedAreaChips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-accent'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function ApplyMentee() {
  const { me, applyMentee } = useApp()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const existing = me?.mentee ?? null

  const [form, setForm] = useState({
    agency: '',
    jobTitle: '',
    yearsOfService: '',
    bio: '',
    needStatement: '',
    goals: '',
  })
  const [needAreas, setNeedAreas] = useState<string[]>([])
  const [hoursPerMonth, setHoursPerMonth] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        agency: existing.agency,
        jobTitle: existing.jobTitle,
        yearsOfService: String(existing.yearsOfService),
        bio: existing.bio,
        needStatement: existing.needStatement,
        goals: existing.goals,
      })
      setNeedAreas(existing.needAreas)
      setHoursPerMonth(existing.hoursPerMonth)
    }
  }, [existing])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid =
    form.agency.trim() &&
    form.jobTitle.trim() &&
    form.yearsOfService !== '' &&
    needAreas.length > 0 &&
    form.needStatement.trim() &&
    form.goals.trim() &&
    hoursPerMonth

  const toggleArea = (a: string) =>
    setNeedAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))

  if (!me?.account) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">Sign in to apply</h1>
        <p className="mt-2 text-muted-foreground">
          Create a free account (or sign in) first — your application is then attached to your
          email so you can track its status.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/signup">Create free account</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    setError('')
    try {
      await applyMentee({
        agency: form.agency.trim(),
        jobTitle: form.jobTitle.trim(),
        yearsOfService: Number(form.yearsOfService),
        bio: form.bio.trim(),
        needAreas,
        needStatement: form.needStatement.trim(),
        goals: form.goals.trim(),
        hoursPerMonth,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">
          {existing ? 'Application updated' : 'Application submitted'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you{me?.account ? `, ${me.account.name.split(' ')[0]}` : ''}. Your mentee
          application is <strong>pending review</strong> by the programme owner. You can sign in
          anytime to check its status. The service is completely free.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild>
            <Link to="/mentee">View my status</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Apply as a mentee</CardTitle>
          <CardDescription>
            Signed in as <span className="font-medium text-foreground">{me.account.name}</span> (
            {me.account.email}). Tell us — most importantly — what you need mentorship for. Your
            application is reviewed by the programme owner before mentors can see your profile.
            Free of charge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agency">Agency / ministry / department *</Label>
                <Input
                  id="agency"
                  required
                  value={form.agency}
                  onChange={set('agency')}
                  placeholder="e.g. Ministry of Finance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Current role *</Label>
                <Input
                  id="jobTitle"
                  required
                  value={form.jobTitle}
                  onChange={set('jobTitle')}
                  placeholder="e.g. Assistant Budget Analyst"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Years in public service *</Label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={50}
                  required
                  value={form.yearsOfService}
                  onChange={set('yearsOfService')}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short bio (optional)</Label>
              <Textarea
                id="bio"
                rows={2}
                value={form.bio}
                onChange={set('bio')}
                placeholder="One or two sentences about your work."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Areas where you need mentorship * (pick at least one)</Label>
              <NeedAreaChips options={NEED_AREAS} selected={needAreas} onToggle={toggleArea} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="need">Describe your need for mentorship *</Label>
              <Textarea
                id="need"
                rows={4}
                required
                value={form.needStatement}
                onChange={set('needStatement')}
                placeholder="What challenge are you facing? What kind of guidance would help? Mentors read this to decide if they are a good fit for you."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">What do you want to achieve? *</Label>
              <Textarea
                id="goals"
                rows={3}
                required
                value={form.goals}
                onChange={set('goals')}
                placeholder="A concrete outcome you and your mentor could work toward."
              />
            </div>

            <div className="space-y-2">
              <Label>Time you can commit per month *</Label>
              <Select value={hoursPerMonth} onValueChange={setHoursPerMonth}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select commitment" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="submit" disabled={!valid || saving}>
                <Send className="mr-2 h-4 w-4" /> {saving ? 'Submitting…' : existing ? 'Update application' : 'Submit for approval'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Free · Reviewed by the programme owner before mentors see you
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

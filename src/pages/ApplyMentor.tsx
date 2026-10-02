import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, CheckCircle2, GraduationCap, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { NEED_AREAS } from '@/types'
import { useApp } from '@/lib/StoreContext'
import { NeedAreaChips } from '@/pages/ApplyMentee'

export default function ApplyMentor() {
  const { me, applyMentor } = useApp()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const existing = me?.mentor ?? null

  const [form, setForm] = useState({
    agency: '',
    jobTitle: '',
    yearsOfService: '',
    bio: '',
    experience: '',
    motivation: '',
    capacity: '2',
  })
  const [expertise, setExpertise] = useState<string[]>([])

  useEffect(() => {
    if (existing) {
      setForm({
        agency: existing.agency,
        jobTitle: existing.jobTitle,
        yearsOfService: String(existing.yearsOfService),
        bio: existing.bio,
        experience: existing.experience,
        motivation: existing.motivation,
        capacity: String(existing.capacity),
      })
      setExpertise(existing.expertise)
    }
  }, [existing])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid =
    form.agency.trim() &&
    form.jobTitle.trim() &&
    form.yearsOfService !== '' &&
    expertise.length > 0 &&
    form.experience.trim() &&
    form.motivation.trim()

  if (!me?.account) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">Sign in to apply</h1>
        <p className="mt-2 text-muted-foreground">
          Create a free account (or sign in) first — your mentor application is attached to your
          email so the programme owner can vet and approve you.
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
      await applyMentor({
        agency: form.agency.trim(),
        jobTitle: form.jobTitle.trim(),
        yearsOfService: Number(form.yearsOfService),
        bio: form.bio.trim(),
        expertise,
        experience: form.experience.trim(),
        motivation: form.motivation.trim(),
        capacity: Math.max(1, Number(form.capacity) || 1),
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
          {existing ? 'Application updated' : 'Mentor application submitted'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for volunteering, {me.account.name.split(' ')[0]}. Your mentor application is{' '}
          <strong>pending review</strong> by the programme owner. Once approved you will be able to
          browse approved mentees and propose matches.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link to="/">Back to home</Link>
        </Button>
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
          <CardTitle className="flex items-center gap-2 text-2xl">
            <GraduationCap className="h-6 w-6 text-primary" /> Apply as a mentor
          </CardTitle>
          <CardDescription>
            Signed in as <span className="font-medium text-foreground">{me.account.name}</span> (
            {me.account.email}). Share your public sector experience so the programme owner can vet
            you. Once approved, you can scan approved mentee profiles and propose matches for final
            approval. Free — your time is the only contribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agency">Agency / ministry / department *</Label>
                <Input id="agency" required value={form.agency} onChange={set('agency')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Current role *</Label>
                <Input id="jobTitle" required value={form.jobTitle} onChange={set('jobTitle')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Years in public service *</Label>
                <Input id="years" type="number" min={0} max={50} required value={form.yearsOfService} onChange={set('yearsOfService')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short bio (optional)</Label>
              <Textarea id="bio" rows={2} value={form.bio} onChange={set('bio')} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Your areas of expertise * (pick at least one)</Label>
              <NeedAreaChips options={NEED_AREAS} selected={expertise} onToggle={(a) =>
                setExpertise((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))
              } />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Relevant experience *</Label>
              <Textarea
                id="experience"
                rows={4}
                required
                value={form.experience}
                onChange={set('experience')}
                placeholder="Programmes led, reforms delivered, years of practice in your expertise areas."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Why do you want to mentor? *</Label>
              <Textarea
                id="motivation"
                rows={3}
                required
                value={form.motivation}
                onChange={set('motivation')}
                placeholder="What draws you to developing other public servants?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Mentees you can take at once *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={10}
                className="w-32"
                value={form.capacity}
                onChange={set('capacity')}
              />
            </div>

            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="submit" disabled={!valid || saving}>
                <Send className="mr-2 h-4 w-4" /> {saving ? 'Submitting…' : existing ? 'Update application' : 'Submit for approval'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Free · Vetted by the programme owner before you can browse mentees
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

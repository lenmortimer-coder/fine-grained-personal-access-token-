import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, CheckCircle2, GraduationCap, Landmark, Search, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useApp } from '@/lib/StoreContext'
import { NEED_AREAS, type MenteeApplication } from '@/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function MentorDirectory() {
  const { me, isMentor, loading, directory, loadDirectory, proposeMatch } = useApp()

  const [query, setQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<MenteeApplication | null>(null)
  const [note, setNote] = useState('')
  const [proposedFor, setProposedFor] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isMentor) loadDirectory().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMentor])

  const myMentor = me?.mentor
  const mentees = directory?.mentees ?? []
  const myMatches = directory?.myMatches ?? []

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">Loading…</div>
  }

  if (!isMentor || !myMentor) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Mentor access only</h1>
        <p className="mt-2 text-muted-foreground">
          {me?.mentor?.status === 'pending'
            ? 'Your mentor application is pending review by the programme owner. You will be able to browse mentees once approved.'
            : 'Sign in with an approved mentor account to browse the mentee directory and propose matches.'}
        </p>
        <Button className="mt-6" asChild>
          <Link to={me?.account ? '/apply/mentor' : '/signin'}>
            {me?.account ? 'Apply as a mentor' : 'Go to sign in'}
          </Link>
        </Button>
      </div>
    )
  }

  const myActive = myMatches.filter((m) => m.status === 'approved').length
  const myPending = myMatches.filter((m) => m.status === 'pending')
  const capacityLeft = myMentor.capacity - myActive

  const applyFilters = (q: string, area: string | null) => {
    loadDirectory(q, area).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load directory.'))
  }

  const openPropose = (mentee: MenteeApplication) => {
    setSelected(mentee)
    setNote('')
    setProposedFor(null)
    setError('')
  }

  const submitProposal = async () => {
    if (!selected || note.trim().length < 10 || saving) return
    setSaving(true)
    setError('')
    try {
      await proposeMatch(selected.id, note.trim())
      setProposedFor(selected.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the proposal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentee directory</h1>
          <p className="mt-1 text-muted-foreground">
            Scan approved mentees — their names, roles and stated needs — and propose a match. The
            programme owner gives final approval.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Capacity: {myActive}/{myMentor.capacity} active · {capacityLeft} slot(s) free
        </Badge>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, agency, role or need…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              applyFilters(e.target.value, areaFilter)
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAreaFilter(null)
            applyFilters(query, null)
          }}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            areaFilter === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-accent'
          }`}
        >
          All areas
        </button>
        {NEED_AREAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              const next = areaFilter === a ? null : a
              setAreaFilter(next)
              applyFilters(query, next)
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              areaFilter === a
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-accent'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Directory */}
      {mentees.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No approved mentees match your search yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mentees.map((m) => {
            const alreadyPending = myPending.some((x) => x.menteeId === m.id)
            return (
              <Card key={m.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 border">
                      <AvatarFallback className="bg-primary/10 text-primary">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight">{m.name}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Landmark className="h-3.5 w-3.5 shrink-0" /> {m.agency}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {m.jobTitle} · {m.yearsOfService} yrs in service
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.needAreas.map((a) => (
                      <Badge key={a} variant="outline">
                        {a}
                      </Badge>
                    ))}
                  </div>

                  <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{m.needStatement}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> Approved mentee · commits {m.hoursPerMonth}/month
                  </p>

                  <Separator className="my-4" />
                  {alreadyPending ? (
                    <Badge className="w-fit bg-amber-500 hover:bg-amber-500">Match proposal pending owner approval</Badge>
                  ) : proposedFor === m.id ? (
                    <Badge className="w-fit bg-green-600 hover:bg-green-600">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Proposed — awaiting owner approval
                    </Badge>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(m)}>
                        View full profile
                      </Button>
                      <Button size="sm" onClick={() => openPropose(m)} disabled={capacityLeft <= 0}>
                        <Send className="mr-1.5 h-4 w-4" /> Propose match
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail / propose dialog */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials(selected.name)}
                    </AvatarFallback>
                  </Avatar>
                  {selected.name}
                </DialogTitle>
                <DialogDescription>
                  {selected.jobTitle}, {selected.agency} · {selected.yearsOfService} years in public service
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Areas of need</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selected.needAreas.map((a) => (
                      <Badge key={a} variant="outline">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium">Statement of need</p>
                  <p className="mt-0.5 text-muted-foreground">{selected.needStatement}</p>
                </div>
                <div>
                  <p className="font-medium">Goals</p>
                  <p className="mt-0.5 text-muted-foreground">{selected.goals}</p>
                </div>
                <div>
                  <p className="font-medium">Availability</p>
                  <p className="mt-0.5 text-muted-foreground">{selected.hoursPerMonth} per month</p>
                </div>
                {selected.bio && (
                  <div>
                    <p className="font-medium">Bio</p>
                    <p className="mt-0.5 text-muted-foreground">{selected.bio}</p>
                  </div>
                )}

                <Separator />

                {proposedFor === selected.id ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Proposal sent. It is now pending the programme owner&apos;s approval.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="note">Your matching note (sent to the owner with this proposal) *</Label>
                    <Textarea
                      id="note"
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain why you are a good fit for this mentee — overlap between your expertise and their needs, relevant experience, how you would approach the first sessions."
                    />
                    <p className="text-xs text-muted-foreground">
                      The owner reviews every proposal. The mentee is matched to you only after approval.
                    </p>
                    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                  </div>
                )}
              </div>

              <DialogFooter>
                {proposedFor === selected.id ? (
                  <Button onClick={() => setSelected(null)}>Done</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setSelected(null)}>
                      Cancel
                    </Button>
                    <Button onClick={submitProposal} disabled={note.trim().length < 10 || capacityLeft <= 0 || saving}>
                      <Send className="mr-1.5 h-4 w-4" /> {saving ? 'Submitting…' : 'Submit for owner approval'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

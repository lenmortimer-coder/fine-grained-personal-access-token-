import { Link } from 'react-router'
import { useEffect } from 'react'
import {
  CalendarDays,
  Check,
  Clock,
  FileText,
  GraduationCap,
  Handshake,
  Landmark,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/lib/StoreContext'
import type { ApplicationStatus, MenteeApplication, MentorApplication } from '@/types'

function act(promise: Promise<void>) {
  promise.catch((err) => alert(err instanceof Error ? err.message : 'Action failed. Please try again.'))
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusBadge(status: ApplicationStatus, when?: string) {
  if (status === 'pending')
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3.5 w-3.5" /> Pending
      </Badge>
    )
  if (status === 'approved')
    return (
      <Badge className="bg-green-600 hover:bg-green-600">
        <Check className="mr-1 h-3.5 w-3.5" /> Approved {when ? `· ${fmtDate(when)}` : ''}
      </Badge>
    )
  return (
    <Badge variant="destructive">
      <X className="mr-1 h-3.5 w-3.5" /> Rejected {when ? `· ${fmtDate(when)}` : ''}
    </Badge>
  )
}

/* ------------------------- Mentee review card ------------------------- */

function MenteeReviewCard({ m }: { m: MenteeApplication }) {
  const { reviewApplication } = useApp()
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11 border">
            <AvatarFallback className="bg-primary/10 text-primary">{initials(m.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{m.name}</h3>
              {statusBadge(m.status, m.reviewedAt)}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5" /> {m.agency}
              </span>
              <span>{m.jobTitle}</span>
              <span>{m.yearsOfService} yrs in service</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Applied {fmtDate(m.createdAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
          <div>
            <p className="font-medium">Areas of need</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {m.needAreas.map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">Statement of need</p>
            <p className="mt-0.5 text-muted-foreground">{m.needStatement}</p>
          </div>
          <div>
            <p className="font-medium">Goals</p>
            <p className="mt-0.5 text-muted-foreground">{m.goals}</p>
          </div>
          <p className="text-muted-foreground">
            Commitment: <span className="font-medium text-foreground">{m.hoursPerMonth}/month</span>
            {m.bio ? ` · ${m.bio}` : ''}
          </p>
        </div>

        {m.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => act(reviewApplication('mentee', m.id, true))}>
              <Check className="mr-1.5 h-4 w-4" /> Approve mentee
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act(reviewApplication('mentee', m.id, false))}>
              <X className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------- Mentor review card ------------------------- */

function MentorReviewCard({ m }: { m: MentorApplication }) {
  const { reviewApplication, admin } = useApp()
  const activeMatches = admin
    ? admin.matches.filter((x) => x.mentorId === m.id && x.status === 'approved').length
    : 0
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11 border">
            <AvatarFallback className="bg-primary/10 text-primary">{initials(m.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{m.name}</h3>
              {statusBadge(m.status, m.reviewedAt)}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5" /> {m.agency}
              </span>
              <span>{m.jobTitle}</span>
              <span>{m.yearsOfService} yrs in service</span>
              <span>Capacity: {m.capacity}</span>
              {m.status === 'approved' && <span>Active matches: {activeMatches}</span>}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
          <div>
            <p className="font-medium">Expertise</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {m.expertise.map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">Experience</p>
            <p className="mt-0.5 text-muted-foreground">{m.experience}</p>
          </div>
          <div>
            <p className="font-medium">Motivation</p>
            <p className="mt-0.5 text-muted-foreground">{m.motivation}</p>
          </div>
        </div>

        {m.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => act(reviewApplication('mentor', m.id, true))}>
              <Check className="mr-1.5 h-4 w-4" /> Approve mentor
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act(reviewApplication('mentor', m.id, false))}>
              <X className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------- Page -------------------------------- */

export default function AdminDashboard() {
  const { admin, reviewMatch, isAdmin, loading, loadAdmin } = useApp()

  useEffect(() => {
    if (isAdmin) act(loadAdmin())
  }, [isAdmin, loadAdmin])

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">Loading…</div>
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Owner access only</h1>
        <p className="mt-2 text-muted-foreground">Sign in as the programme owner to review applications and matches.</p>
        <Button className="mt-6" asChild>
          <Link to="/signin">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  if (!admin) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">Loading…</div>
  }

  const mentees = admin.mentees
  const mentors = admin.mentors
  const matches = admin.matches

  const pendingMentees = mentees.filter((m) => m.status === 'pending')
  const pendingMentors = mentors.filter((m) => m.status === 'pending')
  const pendingMatches = matches.filter((m) => m.status === 'pending')
  const reviewedMentees = mentees.filter((m) => m.status !== 'pending')
  const reviewedMentors = mentors.filter((m) => m.status !== 'pending')
  const decidedMatches = matches.filter((m) => m.status !== 'pending')

  const stats = [
    { icon: Users, label: 'Mentees awaiting approval', value: pendingMentees.length },
    { icon: GraduationCap, label: 'Mentors awaiting approval', value: pendingMentors.length },
    { icon: Handshake, label: 'Matches awaiting your approval', value: pendingMatches.length },
    {
      icon: FileText,
      label: 'Approved matches to date',
      value: admin.stats.approvedMatches,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Owner approvals</h1>
          <p className="mt-1 text-muted-foreground">
            Nothing is live until you approve it — mentees, mentors and every mentor–mentee match.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="matches" className="mt-8">
        <TabsList>
          <TabsTrigger value="matches">
            Match approvals {pendingMatches.length > 0 && `(${pendingMatches.length})`}
          </TabsTrigger>
          <TabsTrigger value="mentees">
            Mentee applications {pendingMentees.length > 0 && `(${pendingMentees.length})`}
          </TabsTrigger>
          <TabsTrigger value="mentors">
            Mentor applications {pendingMentors.length > 0 && `(${pendingMentors.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------ Matches ------------------------------ */}
        <TabsContent value="matches" className="mt-4 space-y-4">
          {pendingMatches.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No match requests awaiting approval. Approved mentors propose matches from the mentee
                directory; they will appear here.
              </CardContent>
            </Card>
          )}
          {pendingMatches.map((match) => {
            const mentor = match.mentor
            const mentee = match.mentee
            if (!mentor || !mentee) return null
            return (
              <Card key={match.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">Proposed match</CardTitle>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3.5 w-3.5" /> Proposed {fmtDate(match.createdAt)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mentor</p>
                      <p className="mt-1 font-semibold">{mentor?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {mentor?.jobTitle}, {mentor?.agency} · {mentor?.yearsOfService} yrs
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(mentor?.expertise ?? []).slice(0, 3).map((e) => (
                          <Badge key={e} variant="outline">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mentee</p>
                      <p className="mt-1 font-semibold">{mentee?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {mentee?.jobTitle}, {mentee?.agency} · {mentee?.yearsOfService} yrs
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(mentee?.needAreas ?? []).map((e) => (
                          <Badge key={e} variant="outline">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
                    <p className="font-medium">Mentor&apos;s matching note</p>
                    <p className="mt-0.5 text-muted-foreground">{match.note}</p>
                    <Separator className="my-3" />
                    <p className="font-medium">Mentee&apos;s need</p>
                    <p className="mt-0.5 text-muted-foreground">{mentee?.needStatement}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => act(reviewMatch(match.id, true))}>
                      <Check className="mr-1.5 h-4 w-4" /> Approve match
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => act(reviewMatch(match.id, false))}>
                      <X className="mr-1.5 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {decidedMatches.length > 0 && (
            <div>
              <Separator className="my-6" />
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Previously decided</h3>
              <div className="space-y-2">
                {decidedMatches.map((match) => {
                  const mentor = match.mentor
                  const mentee = match.mentee
                  if (!mentor || !mentee) return null
                  return (
                    <div key={match.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                      <span>
                        <span className="font-medium">{mentor?.name}</span>
                        <span className="text-muted-foreground"> ↔ </span>
                        <span className="font-medium">{mentee?.name}</span>
                      </span>
                      {statusBadge(match.status, match.reviewedAt)}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------ Mentees ------------------------------ */}
        <TabsContent value="mentees" className="mt-4 space-y-4">
          {pendingMentees.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No mentee applications waiting. New applications appear here for your approval.
              </CardContent>
            </Card>
          )}
          {[...pendingMentees, ...reviewedMentees].map((m) => (
            <MenteeReviewCard key={m.id} m={m} />
          ))}
        </TabsContent>

        {/* ------------------------------ Mentors ------------------------------ */}
        <TabsContent value="mentors" className="mt-4 space-y-4">
          {pendingMentors.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No mentor applications waiting. New applications appear here for your approval.
              </CardContent>
            </Card>
          )}
          {[...pendingMentors, ...reviewedMentors].map((m) => (
            <MentorReviewCard key={m.id} m={m} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

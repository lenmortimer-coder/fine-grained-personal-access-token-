import { Link } from 'react-router'
import { ArrowRight, Clock, GraduationCap, Handshake, Landmark, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/lib/StoreContext'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function MenteeHome() {
  const { me, loading } = useApp()

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading…</div>
  }

  if (!me?.account) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Sign in to view your mentorship</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in with the email you registered with to see your status and any approved match.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/signin">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  const myMentee = me.mentee ?? null
  const myMentor = me.mentor ?? null
  const matches = me.matches ?? []

  if (!myMentee && !myMentor) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Handshake className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">No application yet</h1>
        <p className="mt-2 text-muted-foreground">
          You are signed in as {me.account.name}. Apply as a mentee, as a mentor, or both — each
          application is reviewed by the programme owner.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/apply/mentee">Apply as a mentee</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/apply/mentor">Apply as a mentor</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border">
          <AvatarFallback className="bg-primary/10 text-lg text-primary">{initials(me.account.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{me.account.name}</h1>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            {myMentee && (
              <span className="inline-flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5" /> {myMentee.agency}
              </span>
            )}
            {myMentor && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Mentor: {myMentor.jobTitle}, {myMentor.agency}
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {myMentee &&
              (myMentee.status === 'pending' ? (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3.5 w-3.5" /> Mentee application pending owner review
                </Badge>
              ) : myMentee.status === 'approved' ? (
                <Badge className="bg-green-600 hover:bg-green-600">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Approved mentee
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Mentee application not approved
                </Badge>
              ))}
            {myMentor &&
              (myMentor.status === 'pending' ? (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3.5 w-3.5" /> Mentor application pending owner review
                </Badge>
              ) : myMentor.status === 'approved' ? (
                <Badge className="bg-green-600 hover:bg-green-600">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Approved mentor
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Mentor application not approved
                </Badge>
              ))}
          </div>
        </div>
      </div>

      {myMentor?.status === 'approved' && (
        <Button className="mt-6" asChild>
          <Link to="/mentor">
            Open the mentee directory <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      )}

      {myMentee && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">My mentorship request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Areas of need</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {myMentee.needAreas.map((a) => (
                  <Badge key={a} variant="outline">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium">My statement of need</p>
              <p className="mt-0.5 text-muted-foreground">{myMentee.needStatement}</p>
            </div>
            <div>
              <p className="font-medium">My goals</p>
              <p className="mt-0.5 text-muted-foreground">{myMentee.goals}</p>
            </div>
            {myMentee.status !== 'approved' && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/apply/mentee">Edit application</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {myMentee && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="h-5 w-5 text-primary" /> My mentor matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matches.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {myMentee.status === 'approved'
                  ? 'No mentor has proposed a match with you yet. Approved mentors can see your profile and will propose a match when they believe they can help — every proposal is checked by the programme owner first.'
                  : 'Once your application is approved, approved mentors will be able to see your profile and propose a match.'}
              </p>
            )}
            {matches.map((x) => (
              <div key={x.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{x.mentor?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {x.mentor?.jobTitle}, {x.mentor?.agency} · {x.mentor?.yearsOfService} yrs in service
                    </p>
                  </div>
                  {x.status === 'approved' && (
                    <Badge className="bg-green-600 hover:bg-green-600">Approved match</Badge>
                  )}
                  {x.status === 'pending' && (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3.5 w-3.5" /> Pending owner approval
                    </Badge>
                  )}
                  {x.status === 'rejected' && <Badge variant="destructive">Not approved</Badge>}
                </div>
                {x.status === 'approved' && x.mentor && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-medium">Contact your mentor</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {x.mentor.email}
                      {x.mentor.phone ? ` · ${x.mentor.phone}` : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-primary/5 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            {myMentor ? 'Your mentor profile' : 'Give back as a mentor'}
          </h3>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {myMentor
              ? myMentor.status === 'approved'
                ? 'You are an approved mentor — open the mentee directory to find colleagues you can support.'
                : 'Your mentor application is being reviewed by the programme owner.'
              : 'Mentees can also apply to become mentors in their own area of strength. Your mentor application goes through the same owner approval.'}
          </p>
        </div>
        <Button asChild>
          <Link to={myMentor?.status === 'approved' ? '/mentor' : '/apply/mentor'}>
            {myMentor?.status === 'approved' ? 'Find mentees' : myMentor ? 'View application' : 'Apply as a mentor'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

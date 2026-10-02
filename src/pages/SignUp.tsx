import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useApp } from '@/lib/StoreContext'

export default function SignUp() {
  const { signup } = useApp()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid =
    form.name.trim() &&
    form.email.trim().includes('@') &&
    form.password.length >= 8 &&
    form.password === form.confirm

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.')
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Account created</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome, {form.name.split(' ')[0]}. You are signed in. What would you like to do next?
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/apply/mentee">
              Apply as a mentee <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/apply/mentor">Apply as a mentor</Link>
          </Button>
        </div>
        <Button variant="ghost" className="mt-3" asChild>
          <Link to="/">I'll do it later</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6 text-primary" /> Create your free account
          </CardTitle>
          <CardDescription>
            One account lets you apply as a mentee, as a mentor, or both — each application goes
            through the programme owner's approval. Free forever.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" required autoComplete="name" value={form.name} onChange={set('name')} placeholder="e.g. Ama Serwaa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email *</Label>
              <Input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="name@agency.gov" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+233 …" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="password">Password * (at least 8 characters)</Label>
              <Input id="password" type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password *</Label>
              <Input id="confirm" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-sm text-destructive">Passwords do not match.</p>
              )}
            </div>
            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!valid || busy}>
              {busy ? 'Creating account…' : 'Create free account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{' '}
              <Link to="/signin" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

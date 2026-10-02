import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { GraduationCap, LayoutDashboard, Users, Home as HomeIcon, LogOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useApp } from '@/lib/StoreContext'

export default function AppLayout() {
  const { me, session, isAdmin, isMentor, isMentee, admin, logout, loadAdmin } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin) loadAdmin().catch(() => {})
  }, [isAdmin, loadAdmin])

  const pendingTotal = admin
    ? admin.stats.pendingMentees + admin.stats.pendingMentors + admin.stats.pendingMatches
    : 0

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-2 transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">MentorCircle</div>
              <div className="text-[11px] text-muted-foreground">Public Sector Mentorship</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={linkCls}>
              <HomeIcon className="h-4 w-4" /> Home
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkCls}>
                <LayoutDashboard className="h-4 w-4" /> Approvals
                {pendingTotal > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5">{pendingTotal}</Badge>
                )}
              </NavLink>
            )}
            {isMentor && (
              <NavLink to="/mentor" className={linkCls}>
                <Search className="h-4 w-4" /> Find Mentees
              </NavLink>
            )}
            {(isMentee || me?.mentee || me?.mentor) && (
              <NavLink to="/mentee" className={linkCls}>
                <Users className="h-4 w-4" /> My Mentorship
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {me?.account ? (
              <>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {session?.role === 'admin' ? 'Programme Owner' : me.account.name}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout().catch(() => {})
                    navigate('/')
                  }}
                >
                  <LogOut className="mr-1.5 h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Apply now</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" /> MentorCircle
              </div>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                A free mentorship service dedicated to improving the capability and quality of public
                sector employees.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Free forever · Admin-approved matching</p>
              <p className="mt-1">Every application and match is reviewed by the programme owner.</p>
            </div>
          </div>
          <Separator className="my-5" />
          <p className="text-xs text-muted-foreground">
            Pilot deployment — accounts and data are stored on the programme server.
          </p>
        </div>
      </footer>
    </div>
  )
}

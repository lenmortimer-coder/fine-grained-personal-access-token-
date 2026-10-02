import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type {
  AdminOverview,
  DirectoryResponse,
  MatchRequest,
  MeResponse,
  MenteeApplication,
  MentorApplication,
  PublicStats,
  Session,
} from '@/types'

export interface AppApi {
  loading: boolean
  me: MeResponse | null
  session: Session | null
  isAdmin: boolean
  isMentor: boolean
  isMentee: boolean
  admin: AdminOverview | null
  directory: DirectoryResponse | null
  stats: PublicStats | null

  refreshMe: () => Promise<void>
  loadAdmin: () => Promise<void>
  loadDirectory: (q?: string, area?: string | null) => Promise<void>
  loadStats: () => Promise<void>

  signup: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>

  applyMentee: (data: Omit<MenteeApplication, 'id' | 'accountId' | 'name' | 'email' | 'phone' | 'createdAt' | 'status' | 'reviewedAt'>) => Promise<void>
  applyMentor: (data: Omit<MentorApplication, 'id' | 'accountId' | 'name' | 'email' | 'phone' | 'createdAt' | 'status' | 'reviewedAt'>) => Promise<void>

  reviewApplication: (kind: 'mentee' | 'mentor', id: number, approve: boolean) => Promise<void>
  reviewMatch: (id: number, approve: boolean) => Promise<void>
  proposeMatch: (menteeId: number, note: string) => Promise<void>
}

const AppContext = createContext<AppApi | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [admin, setAdmin] = useState<AdminOverview | null>(null)
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null)
  const [stats, setStats] = useState<PublicStats | null>(null)

  const refreshMe = useCallback(async () => {
    const data = await api<MeResponse>('/api/auth/me')
    setMe(data)
  }, [])

  useEffect(() => {
    refreshMe()
      .catch(() => setMe(null))
      .finally(() => setLoading(false))
  }, [refreshMe])

  const loadAdmin = useCallback(async () => {
    const data = await api<AdminOverview>('/api/admin/overview')
    setAdmin(data)
  }, [])

  const loadDirectory = useCallback(async (q = '', area: string | null = null) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (area) params.set('area', area)
    const data = await api<DirectoryResponse>(`/api/directory/mentees?${params.toString()}`)
    setDirectory(data)
  }, [])

  const loadStats = useCallback(async () => {
    const data = await api<PublicStats>('/api/stats')
    setStats(data)
  }, [])

  const signup = useCallback(
    async (data: { name: string; email: string; phone?: string; password: string }) => {
      await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) })
      await refreshMe()
    },
    [refreshMe]
  )

  const login = useCallback(
    async (email: string, password: string) => {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      await refreshMe()
    },
    [refreshMe]
  )

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setMe(null)
    setAdmin(null)
    setDirectory(null)
  }, [])

  const applyMentee = useCallback(
    async (data: Parameters<AppApi['applyMentee']>[0]) => {
      await api('/api/applications/mentee', { method: 'PUT', body: JSON.stringify(data) })
      await refreshMe()
    },
    [refreshMe]
  )

  const applyMentor = useCallback(
    async (data: Parameters<AppApi['applyMentor']>[0]) => {
      await api('/api/applications/mentor', { method: 'PUT', body: JSON.stringify(data) })
      await refreshMe()
    },
    [refreshMe]
  )

  const reviewApplication = useCallback(
    async (kind: 'mentee' | 'mentor', id: number, approve: boolean) => {
      await api(`/api/admin/applications/${kind}/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' })
      await loadAdmin()
      await refreshMe()
    },
    [loadAdmin, refreshMe]
  )

  const reviewMatch = useCallback(
    async (id: number, approve: boolean) => {
      await api(`/api/admin/matches/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' })
      await loadAdmin()
      await refreshMe()
    },
    [loadAdmin, refreshMe]
  )

  const proposeMatch = useCallback(
    async (menteeId: number, note: string) => {
      await api('/api/matches', { method: 'POST', body: JSON.stringify({ menteeId, note }) })
      await loadDirectory()
      await refreshMe()
    },
    [loadDirectory, refreshMe]
  )

  const session = useMemo<Session | null>(() => {
    if (!me?.account) return null
    const a = me.account
    if (a.isAdmin) return { personId: null, name: a.name, role: 'admin' }
    if (me.mentor?.status === 'approved') return { personId: me.mentor.id, name: a.name, role: 'mentor' }
    if (me.mentee?.status === 'approved') return { personId: me.mentee.id, name: a.name, role: 'mentee' }
    return { personId: null, name: a.name, role: 'pending' }
  }, [me])

  const isAdmin = !!me?.account?.isAdmin
  const isMentor = me?.mentor?.status === 'approved'
  const isMentee = me?.mentee?.status === 'approved'

  const value = useMemo<AppApi>(
    () => ({
      loading,
      me,
      session,
      isAdmin,
      isMentor,
      isMentee,
      admin,
      directory,
      stats,
      refreshMe,
      loadAdmin,
      loadDirectory,
      loadStats,
      signup,
      login,
      logout,
      applyMentee,
      applyMentor,
      reviewApplication,
      reviewMatch,
      proposeMatch,
    }),
    [
      loading, me, session, isAdmin, isMentor, isMentee, admin, directory, stats,
      refreshMe, loadAdmin, loadDirectory, loadStats,
      signup, login, logout, applyMentee, applyMentor, reviewApplication, reviewMatch, proposeMatch,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppApi {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { MatchRequest }

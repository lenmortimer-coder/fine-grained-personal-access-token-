export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface BasePerson {
  id: number
  accountId: number
  name: string
  email: string
  phone: string
  agency: string
  jobTitle: string
  yearsOfService: number
  bio: string
  createdAt: string
}

export interface MenteeApplication extends BasePerson {
  needAreas: string[]
  needStatement: string
  goals: string
  hoursPerMonth: string
  status: ApplicationStatus
  reviewedAt?: string
}

export interface MentorApplication extends BasePerson {
  expertise: string[]
  experience: string
  motivation: string
  capacity: number
  status: ApplicationStatus
  reviewedAt?: string
}

export interface MatchRequest {
  id: number
  mentorId: number
  menteeId: number
  note: string
  status: ApplicationStatus
  createdAt: string
  reviewedAt?: string
}

export interface Session {
  personId: number | null // application id, or null for the administrator
  name: string
  role: 'admin' | 'mentor' | 'mentee' | 'pending'
}

export interface Account {
  id: number
  name: string
  email: string
  phone: string
  isAdmin: number
  createdAt: string
}

export interface MatchWithPeople extends MatchRequest {
  mentor?: MentorApplication | null
  mentee?: MenteeApplication | null
}

export interface MeResponse {
  account: Account | null
  mentee?: MenteeApplication | null
  mentor?: MentorApplication | null
  matches?: MatchWithPeople[]
}

export interface AdminOverview {
  mentees: MenteeApplication[]
  mentors: MentorApplication[]
  matches: MatchWithPeople[]
  stats: {
    pendingMentees: number
    pendingMentors: number
    pendingMatches: number
    approvedMatches: number
  }
}

export interface DirectoryResponse {
  mentees: MenteeApplication[]
  myMatches: MatchRequest[]
}

export interface PublicStats {
  approvedMentors: number
  approvedMentees: number
  approvedMatches: number
}

export const NEED_AREAS = [
  'Leadership & Management',
  'Policy Development & Analysis',
  'Public Financial Management',
  'Digital Government / IT',
  'Procurement & Contract Management',
  'Human Resources & Organisational Development',
  'Monitoring & Evaluation',
  'Communication & Stakeholder Engagement',
  'Project Management',
  'Ethics, Integrity & Anti-Corruption',
  'Frontline Service Delivery',
  'Change Management',
] as const

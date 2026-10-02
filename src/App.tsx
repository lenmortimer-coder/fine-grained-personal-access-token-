import { Routes, Route } from 'react-router'
import AppLayout from '@/components/AppLayout'
import { AppProvider } from '@/lib/StoreContext'
import Home from '@/pages/Home'
import ApplyMentee from '@/pages/ApplyMentee'
import ApplyMentor from '@/pages/ApplyMentor'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import AdminDashboard from '@/pages/AdminDashboard'
import MentorDirectory from '@/pages/MentorDirectory'
import MenteeHome from '@/pages/MenteeHome'

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/apply/mentee" element={<ApplyMentee />} />
          <Route path="/apply/mentor" element={<ApplyMentor />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/mentor" element={<MentorDirectory />} />
          <Route path="/mentee" element={<MenteeHome />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

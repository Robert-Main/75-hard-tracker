import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ChallengeProvider } from './context/ChallengeContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthPage } from './pages/AuthPage'
import { PhotosPage } from './pages/PhotosPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProgressPage } from './pages/ProgressPage'
import { RulesPage } from './pages/RulesPage'
import { SettingsPage } from './pages/SettingsPage'
import { TodayPage } from './pages/TodayPage'

function AuthenticatedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="welcome">
        <p className="welcome-kicker">Loading</p>
        <h1>Checking your session…</h1>
      </section>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <ChallengeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TodayPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="photos" element={<PhotosPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChallengeProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}

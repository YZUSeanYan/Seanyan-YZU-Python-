import { Routes, Route } from 'react-router'
import { Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { UserDataProvider } from './contexts/UserDataContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Practice from './pages/Practice'
import WrongBook from './pages/WrongBook'
import Stats from './pages/Stats'
import MemoryMode from './pages/MemoryMode'
import SimExam from './pages/SimExam'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Settings from './pages/Settings'

function RequireLogin({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  return authState.isLoggedIn ? children : <Navigate to="/login" replace />;
}

function RequirePractice2({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const user = authState.user;
  const allowed = user?.role === 'admin' || Boolean(user?.practice2Enabled);
  return allowed ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<RequireLogin><Admin /></RequireLogin>} />
          <Route path="/sim-exam" element={<RequireLogin><SimExam /></RequireLogin>} />
          <Route path="*" element={
            <RequireLogin>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/practice-2" element={<RequirePractice2><Practice mode="exam" /></RequirePractice2>} />
                  <Route path="/wrongbook" element={<WrongBook />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/memory" element={<MemoryMode />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </RequireLogin>
          } />
        </Routes>
      </UserDataProvider>
    </AuthProvider>
  )
}

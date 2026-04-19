import { HashRouter, Routes, Route } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import LandingPage    from './pages/LandingPage'
import ChatPage       from './pages/ChatPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"        element={<OnboardingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/chat"    element={<ChatPage />} />
      </Routes>
    </HashRouter>
  )
}

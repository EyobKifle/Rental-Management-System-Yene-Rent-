import { Routes, Route } from 'react-router-dom'
import './App.css'

// Import page components
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import PropertiesPage from './pages/PropertiesPage'
import NotFoundPage from './pages/NotFoundPage'

// Import reusable components
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          {/* A catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  )
}

export default App

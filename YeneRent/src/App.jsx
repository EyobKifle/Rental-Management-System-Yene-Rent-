import { Routes, Route } from 'react-router-dom'
import './App.css'

// Import page components
import LandingPage from './pages/LandingPage/LandingPage.jsx'
// import DashboardPage from './pages/DashboardPage'
import DashboardPage from './pages/Dashboard/Dashboard.jsx'
// import PropertiesPage from './pages/PropertiesPage'
import PropertiesPage from './pages/Properties/Properties.jsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx'
import AnalyticsPage from './pages/Analytics/Analytics.jsx'
import TenantsPage from './pages/Tenants/Tenants.jsx'
import UnitsPage from './pages/Units/Units.jsx'
import DocumentsPage from './pages/Documents/Documents.jsx'
import PaymentsPage from './pages/Payments/Payments.jsx'

// Import reusable components
import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'

function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          {/* A catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  )
}

export default App

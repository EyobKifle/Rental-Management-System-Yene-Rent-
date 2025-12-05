import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'

// Import page components
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/Login/Login.jsx'
import DashboardPage from './pages/Dashboard/Dashboard.jsx'
import PropertiesPage from './pages/Properties/Properties.jsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx'
import AnalyticsPage from './pages/Analytics/Analytics.jsx'
import TenantsPage from './pages/Tenants/Tenants.jsx'
import UnitsPage from './pages/Units/Units.jsx'
import LeasesPage from './pages/Leases/Leases.jsx'
import DocumentsPage from './pages/Documents/Documents.jsx'
import DocumentDetails from './pages/Documents/DocumentDetails.jsx'
import PaymentsPage from './pages/Payments/Payments.jsx'
import MaintenancePage from './pages/Maintenance/Maintenance.jsx'
import MaintenanceDetails from './pages/Maintenance/MaintenanceDetails.jsx'
import NotificationsPage from './pages/Notifications/Notifications.jsx'
import PaymentDetails from './pages/Payments/PaymentDetails.jsx'
import SettingsPage from './pages/Settings/Settings.jsx'
import SignupPage from './pages/Signup/Signup.jsx'
import UnitDetails from './pages/Units/UnitDetails.jsx'
import UtilitiesPage from './pages/Utilities/Utilities.jsx'
import UtilityDetails from './pages/Utilities/UtilityDetails.jsx'

// Import reusable components
import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'

function App() {
  const location = useLocation();
  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!isPublicPage && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/:id" element={<UnitDetails />} />
          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentDetails />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/:id" element={<PaymentDetails />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetails />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/utilities" element={<UtilitiesPage />} />
          <Route path="/utilities/:id" element={<UtilityDetails />} />
          {/* A catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isPublicPage && <Footer />}
    </>
  )
}

export default App

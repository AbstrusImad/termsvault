import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import AddDocument from './pages/AddDocument'
import DocumentDetail from './pages/DocumentDetail'
import SemanticDiff from './pages/SemanticDiff'
import Reports from './pages/Reports'
import PublicBadge from './pages/PublicBadge'
import Settings from './pages/Settings'
import ApiDocs from './pages/ApiDocs'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add" element={<AddDocument />} />
          <Route path="/document/:id" element={<DocumentDetail />} />
          <Route path="/diff/:id" element={<SemanticDiff />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/badge" element={<PublicBadge />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/api-docs" element={<ApiDocs />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

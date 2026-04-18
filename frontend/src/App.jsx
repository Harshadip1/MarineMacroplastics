import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AreaMap from './pages/AreaMap'
import AreaData from './pages/AreaData'
import SatelliteUpload from './pages/SatelliteUpload'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<AreaMap />} />
          <Route path="areas" element={<AreaData />} />
        </Route>
        <Route path="/satellite-upload" element={<SatelliteUpload />} />
      </Routes>
    </Router>
  )
}

export default App

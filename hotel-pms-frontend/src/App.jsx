import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ReceptionPanel from './pages/ReceptionPanel.jsx';
import PublicBooking from './pages/PublicBooking.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import HousekeepingPage from './pages/HousekeepingPage.jsx';
import ManagerMetrics from './pages/ManagerMetrics.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recepcion" element={<ReceptionPanel />} />
        <Route path="/reservar" element={<PublicBooking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/limpieza" element={<HousekeepingPage />} />
        <Route path="/gerencia" element={<ManagerMetrics />} />
      </Routes>
    </Router>
  );
}
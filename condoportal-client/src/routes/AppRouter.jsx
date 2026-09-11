// Rutas de la aplicación.
//
// Las públicas (landing, login, registro) se montan sueltas; las internas van
// envueltas en `RutaProtegida`, que además aplica el armazón con la barra de
// navegación y, cuando hace falta, restringe por rol.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthProvider'
import RutaProtegida from '../features/auth/RutaProtegida'
import AuthPage from '../features/auth/AuthPage'
import LandingPage from '../features/landing/LandingPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import GastosPage from '../features/gastos/GastosPage'
import PagosPage from '../features/pagos/PagosPage'
import MarketplacePage from '../features/marketplace/MarketplacePage'
import PerfilProveedor from '../features/marketplace/components/PerfilProveedor'
import MapaPage from '../features/mapa/MapaPage'
import AdminPage from '../features/admin/AdminPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage modo="login" />} />
          <Route path="/registro" element={<AuthPage modo="registro" />} />

          <Route path="/dashboard" element={<RutaProtegida><DashboardPage /></RutaProtegida>} />
          <Route path="/pagos" element={<RutaProtegida><PagosPage /></RutaProtegida>} />
          <Route path="/gastos" element={<RutaProtegida><GastosPage /></RutaProtegida>} />
          <Route path="/marketplace" element={<RutaProtegida><MarketplacePage /></RutaProtegida>} />
          <Route path="/marketplace/:id" element={<RutaProtegida><PerfilProveedor /></RutaProtegida>} />
          <Route path="/mapa" element={<RutaProtegida><MapaPage /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida roles={['admin']}><AdminPage /></RutaProtegida>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRouter

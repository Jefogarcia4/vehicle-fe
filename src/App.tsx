import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import PartnerRegisterPage from '@/pages/auth/PartnerRegisterPage'
import DashboardPage from '@/pages/app/DashboardPage'
import GaragePage from '@/pages/app/GaragePage'
import VehicleFormPage from '@/pages/app/VehicleFormPage'
import VehicleLookupPage from '@/pages/app/VehicleLookupPage'
import VehicleDetailPage from '@/pages/app/VehicleDetailPage'
import WorkshopsPage from '@/pages/app/WorkshopsPage'
import ProfilePage from '@/pages/app/ProfilePage'
import PartnerPanelPage from '@/pages/app/PartnerPanelPage'
import NotificationsPage from '@/pages/app/NotificationsPage'
import CrmCustomersPage from '@/pages/app/crm/CrmCustomersPage'
import CustomerDetailPage from '@/pages/app/crm/CustomerDetailPage'
import CrmImportPage from '@/pages/app/crm/CrmImportPage'
import CampaignsPage from '@/pages/app/crm/CampaignsPage'
import CampaignEditorPage from '@/pages/app/crm/CampaignEditorPage'
import PublicVehiclePage from '@/pages/public/PublicVehiclePage'
import PartnerDirectoryPage from '@/pages/public/PartnerDirectoryPage'
import PublicPartnerPage from '@/pages/public/PublicPartnerPage'
import UnsubscribePage from '@/pages/public/UnsubscribePage'
import NotFoundPage, { NotFoundInApp } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/ingresar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/registro-aliado" element={<PartnerRegisterPage />} />
      <Route path="/v/:slug" element={<PublicVehiclePage />} />
      <Route path="/aliados" element={<PartnerDirectoryPage />} />
      <Route path="/aliados/:slug" element={<PublicPartnerPage />} />
      <Route path="/baja/:token" element={<UnsubscribePage />} />

      {/* App privada */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="garaje" element={<GaragePage />} />
          {/* Los vehículos entran por la placa: el registro pone la ficha. */}
          <Route path="vehiculos/nuevo" element={<VehicleLookupPage />} />
          <Route path="vehiculos/:id" element={<VehicleDetailPage />} />
          <Route path="vehiculos/:id/editar" element={<VehicleFormPage />} />
          <Route path="talleres" element={<WorkshopsPage />} />
          <Route path="aliado" element={<PartnerPanelPage />} />
          <Route path="avisos" element={<NotificationsPage />} />

          {/* CRM del aliado */}
          <Route path="crm" element={<CrmCustomersPage />} />
          <Route path="crm/clientes/:id" element={<CustomerDetailPage />} />
          <Route path="crm/importar" element={<CrmImportPage />} />
          <Route path="crm/campanas" element={<CampaignsPage />} />
          <Route path="crm/campanas/:id" element={<CampaignEditorPage />} />
          <Route path="perfil" element={<ProfilePage />} />

          {/* Sin esto, una ruta desconocida bajo /app pinta el cascarón en blanco en vez de un 404. */}
          <Route path="*" element={<NotFoundInApp />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
